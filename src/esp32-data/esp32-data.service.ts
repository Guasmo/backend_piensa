import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Esp32DataDto } from './esp32-data.controller';

@Injectable()
export class Esp32DataService {
  constructor(private prisma: PrismaService) {}

  // Guardar medición de energía
  async saveEnergyMeasurement(data: Esp32DataDto) {
    // Convertir datos del ESP32 al formato de la base de datos
    const voltageHours = data.voltage_V ? (data.voltage_V * data.timestamp) / 3600 : 0;
    const wattsHours = data.power_mW ? (data.power_mW * data.timestamp) / 3600000 : 0; // mW a W
    const ampereHours = (data.current_mA * data.timestamp) / 3600000; // mA a A

    // Si hay una sesión activa, guardar la medición
    if (data.usage_session_id) {
      const measurement = await this.prisma.energyMeasurement.create({
        data: {
          usageSessionId: data.usage_session_id,
          voltageHours: voltageHours,
          wattsHours: wattsHours,
          ampereHours: ampereHours,
          batteryPercentage: data.battery_remaining_percent,
          recordedAt: new Date()
        }
      });

      // Actualizar el porcentaje de batería del parlante
      if (data.speaker_id) {
        await this.prisma.speaker.update({
          where: { id: data.speaker_id },
          data: { batteryPercentage: data.battery_remaining_percent }
        });
      }

      return measurement;
    }

    // Si no hay sesión activa, solo actualizar la batería del parlante
    if (data.speaker_id) {
      return await this.prisma.speaker.update({
        where: { id: data.speaker_id },
        data: { batteryPercentage: data.battery_remaining_percent }
      });
    }

    return null;
  }

  // Iniciar sesión de uso
  async startUsageSession(speakerId: number, userId: number, initialBatteryPercentage: number) {
    // Obtener información del parlante
    const speaker = await this.prisma.speaker.findUnique({
      where: { id: speakerId }
    });

    if (!speaker) {
      throw new Error('Speaker not found');
    }

    // Crear nueva sesión de uso
    const session = await this.prisma.usageSession.create({
      data: {
        speakerId,
        userId,
        initialBatteryPercentage,
        speakerName: speaker.name,
        speakerPosition: speaker.position,
        status: 'ACTIVE'
      }
    });

    // Actualizar estado del parlante a encendido
    await this.prisma.speaker.update({
      where: { id: speakerId },
      data: { 
        state: true,
        batteryPercentage: initialBatteryPercentage
      }
    });

    return session;
  }

  // Terminar sesión de uso
  async endUsageSession(sessionId: number, finalBatteryPercentage: number) {
    // Obtener la sesión
    const session = await this.prisma.usageSession.findUnique({
      where: { id: sessionId },
      include: {
        energyMeasurements: true,
        speaker: true
      }
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Actualizar la sesión
    const updatedSession = await this.prisma.usageSession.update({
      where: { id: sessionId },
      data: {
        endTime: new Date(),
        finalBatteryPercentage,
        status: 'COMPLETED'
      }
    });

    // Calcular promedios y totales
    const measurements = session.energyMeasurements;
    
    // Verificar si hay mediciones antes de calcular promedios
    const avgVoltageHours = measurements.length > 0 
      ? measurements.reduce((sum, m) => sum + Number(m.voltageHours), 0) / measurements.length 
      : 0;
    const avgWattsHours = measurements.length > 0 
      ? measurements.reduce((sum, m) => sum + Number(m.wattsHours), 0) / measurements.length 
      : 0;
    const avgAmpereHours = measurements.length > 0 
      ? measurements.reduce((sum, m) => sum + Number(m.ampereHours), 0) / measurements.length 
      : 0;

    const totalVoltageHours = measurements.reduce((sum, m) => sum + Number(m.voltageHours), 0);
    const totalWattsHours = measurements.reduce((sum, m) => sum + Number(m.wattsHours), 0);
    const totalAmpereHours = measurements.reduce((sum, m) => sum + Number(m.ampereHours), 0);

    const durationMinutes = Math.floor((updatedSession.endTime!.getTime() - updatedSession.startTime.getTime()) / 60000);
    const batteryConsumed = Number(session.initialBatteryPercentage) - finalBatteryPercentage;

    // Crear registro en historial
    await this.prisma.history.create({
      data: {
        usageSessionId: sessionId,
        speakerId: session.speakerId,
        speakerName: session.speakerName || 'Unknown', // Manejar posible null
        speakerPosition: session.speakerPosition || 'Unknown', // Manejar posible null
        userId: session.userId,
        startDate: session.startTime,
        endDate: updatedSession.endTime!,
        durationMinutes,
        avgVoltageHours,
        avgWattsHours,
        avgAmpereHours,
        totalVoltageHours,
        totalWattsHours,
        totalAmpereHours,
        initialBatteryPercentage: Number(session.initialBatteryPercentage) || 0,
        finalBatteryPercentage,
        batteryConsumed
      }
    });

    // Actualizar estado del parlante a apagado
    await this.prisma.speaker.update({
      where: { id: session.speakerId },
      data: { 
        state: false,
        batteryPercentage: finalBatteryPercentage
      }
    });

    return updatedSession;
  }

  // Obtener datos de sesión actual
  async getCurrentSessionData(sessionId: number) {
    const session = await this.prisma.usageSession.findUnique({
      where: { id: sessionId },
      include: {
        energyMeasurements: {
          orderBy: { recordedAt: 'desc' },
          take: 10 // Últimas 10 mediciones
        },
        speaker: true,
        user: true
      }
    });

    if (!session) {
      throw new Error('Session not found');
    }

    return session;
  }

  // Obtener sesión activa de un parlante
  async getActiveSession(speakerId: number) {
    return await this.prisma.usageSession.findFirst({
      where: {
        speakerId,
        status: 'ACTIVE'
      }
    });
  }
}