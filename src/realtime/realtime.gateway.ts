import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { EnergyMeasurementDto } from './dto/energy-measurementtDto';
import { StartSessionDto } from './dto/start-session.dto';
import { EndSessionDto } from './dto/end-session.dto';
import { ValidationPipe } from '@nestjs/common';

@WebSocketGateway({ 
  cors: { origin: '*' },
  namespace: '/'
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeSessions: Map<number, number> = new Map();
  private activeClients: Map<string, Socket> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id} desde ${client.handshake.address}`);
    this.activeClients.set(client.id, client);
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
    this.activeClients.delete(client.id);
  }

  @SubscribeMessage('start-session')
  async handleStartSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: StartSessionDto
  ): Promise<void> {
    try {
      console.log('Payload recibido para start-session:', payload);
      
      const { speakerId, userId, batteryPercentage } = payload;

      // Verificar si ya existe una sesión activa para este parlante
      if (this.activeSessions.has(speakerId)) {
        console.warn(`El parlante ${speakerId} ya tiene una sesión activa`);
        client.emit('session-error', { 
          message: 'El parlante ya tiene una sesión activa' 
        });
        return;
      }

      // Verificar que el parlante y usuario existan
      const speaker = await this.prisma.speaker.findUnique({
        where: { id: speakerId }
      });
      
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!speaker || !user) {
        client.emit('session-error', { 
          message: 'Parlante o usuario no encontrado' 
        });
        return;
      }

      const newSession = await this.prisma.usageSession.create({
        data: {
          speakerId,
          userId,
          initialBatteryPercentage: batteryPercentage,
          speakerName: speaker.name,
          speakerPosition: speaker.position,
          status: 'ACTIVE',
        },
      });

      this.activeSessions.set(speakerId, newSession.id);
      
      // Actualizar estado del parlante
      await this.prisma.speaker.update({
        where: { id: speakerId },
        data: { 
          state: true,
          batteryPercentage: batteryPercentage
        }
      });

      console.log(`Sesión iniciada ${newSession.id} para el parlante ${speakerId}`);
      
      // Emitir a todos los clientes conectados
      this.server.emit('session-started', {
        ...newSession,
        speakerName: speaker.name,
        speakerPosition: speaker.position
      });
      
    } catch (error) {
      console.error('Error al iniciar la sesión:', error);
      client.emit('session-error', { 
        message: 'No se pudo iniciar la sesión.',
        error: error.message 
      });
    }
  }

  @SubscribeMessage('energy-measurement')
  async handleEnergyMeasurement(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: EnergyMeasurementDto
  ): Promise<void> {
    try {
      console.log('Medición recibida:', payload);
      
      const usageSessionId = this.activeSessions.get(payload.speakerId);

      if (!usageSessionId) {
        console.warn(`Medición recibida para parlante ${payload.speakerId} sin sesión activa.`);
        client.emit('measurement-error', { 
          message: 'No hay sesión activa para este parlante' 
        });
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

      // Actualizar batería del parlante
      await this.prisma.speaker.update({
        where: { id: payload.speakerId },
        data: { batteryPercentage: payload.batteryPercentage }
      });

      console.log(`Medición guardada para la sesión ${usageSessionId}`);
      
      // Emitir la medición específica para este parlante
      this.server.emit(`measurement-${payload.speakerId}`, {
        ...measurement,
        speakerId: payload.speakerId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error al guardar la medición:', error);
      client.emit('measurement-error', { 
        message: 'Error al procesar la medición',
        error: error.message 
      });
    }
  }

  @SubscribeMessage('end-session')
  async handleEndSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: EndSessionDto
  ): Promise<void> {
    try {
      console.log('Finalizando sesión:', payload);
      
      const { speakerId, batteryPercentage } = payload;
      const usageSessionId = this.activeSessions.get(speakerId);

      if (!usageSessionId) {
        console.warn(`Intento de finalizar sesión para parlante ${speakerId} sin sesión activa.`);
        client.emit('session-error', { 
          message: 'No hay sesión activa para finalizar' 
        });
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

      // Actualizar estado del parlante
      await this.prisma.speaker.update({
        where: { id: speakerId },
        data: { 
          state: false,
          batteryPercentage: batteryPercentage
        }
      });

      // Crear registro de historial
      await this.createHistoryRecord(usageSessionId);

      this.activeSessions.delete(speakerId);
      
      console.log(`Sesión ${usageSessionId} finalizada para el parlante ${speakerId}`);
      this.server.emit('session-ended', updatedSession);
      
    } catch (error) {
      console.error('Error al finalizar la sesión:', error);
      client.emit('session-error', { 
        message: 'Error al finalizar la sesión',
        error: error.message 
      });
    }
  }

  private async createHistoryRecord(usageSessionId: number): Promise<void> {
    try {
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
      
      if (totalMeasurements === 0) {
        console.warn(`La sesión ${usageSessionId} no tiene mediciones, no se generará historial de consumo.`);
        return;
      }

      const totals = measurements.reduce(
        (acc, m) => {
          acc.totalVoltage += parseFloat(m.voltageHours.toString());
          acc.totalWatts += parseFloat(m.wattsHours.toString());
          acc.totalAmps += parseFloat(m.ampereHours.toString());
          return acc;
        },
        { totalVoltage: 0, totalWatts: 0, totalAmps: 0 },
      );

      const avgs = {
        avgVoltage: totals.totalVoltage / totalMeasurements,
        avgWatts: totals.totalWatts / totalMeasurements,
        avgAmps: totals.totalAmps / totalMeasurements,
      };

      const durationMinutes = Math.round(
        (session.endTime.getTime() - session.startTime.getTime()) / 60000
      );
      
      const initialBattery = session.initialBatteryPercentage ?? 0;
      const finalBattery = session.finalBatteryPercentage ?? 0;
      const batteryConsumed = Math.max(
        0, 
        parseFloat(initialBattery.toString()) - parseFloat(finalBattery.toString())
      );

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
          
          avgVoltageHours: avgs.avgVoltage,
          avgWattsHours: avgs.avgWatts,
          avgAmpereHours: avgs.avgAmps,

          totalVoltageHours: totals.totalVoltage,
          totalWattsHours: totals.totalWatts,
          totalAmpereHours: totals.totalAmps,

          initialBatteryPercentage: initialBattery,
          finalBatteryPercentage: finalBattery,
          batteryConsumed: batteryConsumed,
        },
      });

      console.log(`Registro de historial creado para la sesión ${usageSessionId}`);
      
    } catch (error) {
      console.error('Error al crear registro de historial:', error);
    }
  }

  // Método para obtener estadísticas de conexiones activas
  getConnectionStats() {
    return {
      activeClients: this.activeClients.size,
      activeSessions: this.activeSessions.size,
      sessions: Array.from(this.activeSessions.entries())
    };
  }
}