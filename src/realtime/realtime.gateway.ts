import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service'; // Asegúrate que la ruta a tu PrismaService sea correcta
import { EnergyMeasurementDto } from './dto/energy-measurementtDto';
import { StartSessionDto } from './dto/start-session.dto';
import { EndSessionDto } from './dto/end-session.dto';

@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Mapa para rastrear sesiones activas: speakerId -> usageSessionId
  private activeSessions: Map<number, number> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('start-session')
  async handleStartSession(client: Socket, payload: StartSessionDto): Promise<void> {
    try {
      const { speakerId, userId, batteryPercentage } = payload;

      const newSession = await this.prisma.usageSession.create({
        data: {
          speakerId,
          userId,
          initialBatteryPercentage: batteryPercentage,
          status: 'ACTIVE',
        },
      });

      this.activeSessions.set(speakerId, newSession.id);
      console.log(`Sesión iniciada ${newSession.id} para el parlante ${speakerId}`);
      this.server.emit('session-started', newSession);
    } catch (error) {
      console.error('Error al iniciar la sesión:', error);
      client.emit('session-error', { message: 'No se pudo iniciar la sesión.' });
    }
  }

  @SubscribeMessage('energy-measurement')
  async handleEnergyMeasurement(client: Socket, payload: EnergyMeasurementDto): Promise<void> {
    try {
      const usageSessionId = this.activeSessions.get(payload.speakerId);

      if (!usageSessionId) {
        console.warn(`Medición recibida para parlante ${payload.speakerId} sin sesión activa.`);
        return;
      }

      const measurement = await this.prisma.energyMeasurement.create({
        data: {
          usageSessionId: usageSessionId,
          voltageHours: payload.voltageHours,
          wattsHours: payload.wattsHours,
          ampereHours: payload.ampereHours,
          batteryPercentage: payload.batteryPercentage,
        },
      });

      console.log(`Medición recibida para la sesión ${usageSessionId}`);
      this.server.emit(`measurement-${payload.speakerId}`, measurement);
    } catch (error) {
      console.error('Error al guardar la medición:', error);
    }
  }

  @SubscribeMessage('end-session')
  async handleEndSession(client: Socket, payload: EndSessionDto): Promise<void> {
    try {
      const { speakerId, batteryPercentage } = payload;
      const usageSessionId = this.activeSessions.get(speakerId);

      if (!usageSessionId) {
        console.warn(`Intento de finalizar sesión para parlante ${speakerId} sin sesión activa.`);
        return;
      }

      const updatedSession = await this.prisma.usageSession.update({
        where: { id: usageSessionId },
        data: {
          endTime: new Date(),
          finalBatteryPercentage: batteryPercentage,
          status: 'COMPLETED',
        },
      });

      // Llama a la función para crear el registro de historial
      await this.createHistoryRecord(usageSessionId);

      this.activeSessions.delete(speakerId);
      console.log(`Sesión ${usageSessionId} finalizada para el parlante ${speakerId}`);
      this.server.emit('session-ended', updatedSession);
    } catch (error) {
      console.error('Error al finalizar la sesión:', error);
    }
  }

  /**
   * Obtiene una sesión con todas sus mediciones, calcula los totales y promedios,
   * y guarda el resultado en la tabla `History`.
   */
  private async createHistoryRecord(usageSessionId: number): Promise<void> {
    const session = await this.prisma.usageSession.findUnique({
      where: { id: usageSessionId },
      include: {
        energyMeasurements: true,
        speaker: true,
        user: true,
      },
    });

    if (!session || !session.endTime) {
      console.error(`No se pudo generar historial para la sesión ${usageSessionId}`);
      return;
    }

    const measurements = session.energyMeasurements;
    const totalMeasurements = measurements.length;
    
    // Si no hay mediciones, no se puede generar un historial con datos de consumo.
    if (totalMeasurements === 0) {
        console.warn(`La sesión ${usageSessionId} no tiene mediciones, no se generará historial de consumo.`);
        return;
    }

    // 1. Calcular los totales de consumo sumando todas las mediciones
    const totals = measurements.reduce(
      (acc, m) => {
        acc.totalVoltage += parseFloat(m.voltageHours.toString());
        acc.totalWatts += parseFloat(m.wattsHours.toString());
        acc.totalAmps += parseFloat(m.ampereHours.toString());
        return acc;
      },
      { totalVoltage: 0, totalWatts: 0, totalAmps: 0 },
    );

    // 2. Calcular promedios
    const avgs = {
      avgVoltage: totals.totalVoltage / totalMeasurements,
      avgWatts: totals.totalWatts / totalMeasurements,
      avgAmps: totals.totalAmps / totalMeasurements,
    };

    // 3. Calcular duración y batería
    const durationMinutes = Math.round((session.endTime.getTime() - session.startTime.getTime()) / 60000);
    const initialBattery = session.initialBatteryPercentage ?? 0;
    const finalBattery = session.finalBatteryPercentage ?? 0;
    const batteryConsumed = Math.max(0, parseFloat(initialBattery.toString()) - parseFloat(finalBattery.toString()));

    // 4. Crear el registro en la tabla History
    await this.prisma.history.create({
      data: {
        usageSessionId: session.id,
        speakerId: session.speakerId,
        speakerName: session.speaker.name,
        speakerPosition: session.speaker.position,
        userId: session.userId,
        startDate: session.startTime,
        endDate: session.endTime,
        durationMinutes: durationMinutes,
        
        // Promedios
        avgVoltageHours: avgs.avgVoltage,
        avgWattsHours: avgs.avgWatts,
        avgAmpereHours: avgs.avgAmps,

        // Totales de consumo
        totalVoltageHours: totals.totalVoltage,
        totalWattsHours: totals.totalWatts,
        totalAmpereHours: totals.totalAmps,

        // Información de batería
        initialBatteryPercentage: initialBattery,
        finalBatteryPercentage: finalBattery,
        batteryConsumed: batteryConsumed,
      },
    });

    console.log(`Registro de historial creado para la sesión ${usageSessionId}`);
  }
}