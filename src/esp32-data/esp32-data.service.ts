import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { Esp32DataDto } from './dto/Esp32Data-dto';

@Injectable()
export class Esp32DataService {
  constructor(private prisma: PrismaService) {}

  async saveEnergyMeasurement(data: Esp32DataDto) {
    try {
      // ✅ FIX: Se calcula el consumo para el intervalo de 10 segundos, no para el tiempo total.
      // El intervalo de medición en el Arduino es de 10 segundos.
      const intervalInHours = 10 / 3600.0;

      const voltageHours = data.voltage_V 
        ? new Decimal(data.voltage_V * intervalInHours) 
        : new Decimal(0);
      
      const wattsHours = data.power_mW 
        ? new Decimal((data.power_mW / 1000) * intervalInHours) // mW a W
        : new Decimal(0);
      
      const ampereHours = new Decimal((data.current_mA / 1000) * intervalInHours); // mA a A

      // Si hay una sesión activa, guardar la medición
      if (data.usage_session_id) {
        // Verificar que la sesión existe y está activa
        const session = await this.prisma.usageSession.findFirst({
          where: {
            id: data.usage_session_id,
            status: 'ACTIVE'
          }
        });

        if (!session) {
          throw new BadRequestException('Session not found or not active');
        }

        const measurement = await this.prisma.energyMeasurement.create({
          data: {
            usageSessionId: data.usage_session_id,
            voltageHours: voltageHours,
            wattsHours: wattsHours,
            ampereHours: ampereHours,
            batteryPercentage: new Decimal(data.battery_remaining_percent),
            recordedAt: new Date()
          }
        });

        // Actualizar el porcentaje de batería del parlante
        if (data.speaker_id) {
          await this.prisma.speaker.update({
            where: { id: data.speaker_id },
            data: { 
              batteryPercentage: new Decimal(data.battery_remaining_percent),
              updatedAt: new Date()
            }
          });
        }

        return measurement;
      }

      // Si no hay sesión activa, solo actualizar la batería del parlante
      if (data.speaker_id) {
        return await this.prisma.speaker.update({
          where: { id: data.speaker_id },
          data: { 
            batteryPercentage: new Decimal(data.battery_remaining_percent),
            updatedAt: new Date()
          }
        });
      }

      return null;
    } catch (error) {
      console.error('Error saving energy measurement:', error);
      throw error;
    }
  }

  // Iniciar sesión de uso mejorado
  async startUsageSession(speakerId: number, userId: number, initialBatteryPercentage: number) {
    try {
      // Verificar que no hay sesión activa para este parlante
      const activeSession = await this.prisma.usageSession.findFirst({
        where: {
          speakerId,
          status: 'ACTIVE'
        }
      });

      if (activeSession) {
        throw new BadRequestException('Speaker already has an active session');
      }

      // Obtener información del parlante
      const speaker = await this.prisma.speaker.findUnique({
        where: { id: speakerId }
      });

      if (!speaker) {
        throw new NotFoundException('Speaker not found');
      }

      // Verificar que el usuario existe
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Crear nueva sesión de uso
      const session = await this.prisma.usageSession.create({
        data: {
          speakerId,
          userId,
          initialBatteryPercentage: new Decimal(initialBatteryPercentage),
          speakerName: speaker.name,
          speakerPosition: speaker.position,
          status: 'ACTIVE'
        },
        include: {
          speaker: true,
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });

      // Actualizar estado del parlante a encendido
      await this.prisma.speaker.update({
        where: { id: speakerId },
        data: { 
          state: true,
          batteryPercentage: new Decimal(initialBatteryPercentage),
          updatedAt: new Date()
        }
      });

      console.log(`✅ Session started for speaker ${speaker.name} (ID: ${speakerId})`);
      
      return session;
    } catch (error) {
      console.error('Error starting usage session:', error);
      throw error;
    }
  }

  // Terminar sesión de uso mejorado
  async endUsageSession(sessionId: number, finalBatteryPercentage: number) {
    try {
      // Obtener la sesión con todas las relaciones
      const session = await this.prisma.usageSession.findUnique({
        where: { id: sessionId },
        include: {
          energyMeasurements: true,
          speaker: true,
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });

      if (!session) {
        throw new NotFoundException('Session not found');
      }

      if (session.status !== 'ACTIVE') {
        throw new BadRequestException('Session is not active');
      }

      const endTime = new Date();

      // Actualizar la sesión
      const updatedSession = await this.prisma.usageSession.update({
        where: { id: sessionId },
        data: {
          endTime,
          finalBatteryPercentage: new Decimal(finalBatteryPercentage),
          status: 'COMPLETED'
        }
      });

      // Calcular estadísticas
      const measurements = session.energyMeasurements;
      const stats = this.calculateSessionStatistics(measurements, session.startTime, endTime);
      
      const durationMinutes = Math.floor((endTime.getTime() - session.startTime.getTime()) / 60000);
      const batteryConsumed = Number(session.initialBatteryPercentage) - finalBatteryPercentage;

      // Crear registro en historial
      await this.prisma.history.create({
        data: {
          usageSessionId: sessionId,
          speakerId: session.speakerId,
          speakerName: session.speakerName || 'Unknown',
          speakerPosition: session.speakerPosition || 'Unknown',
          userId: session.userId,
          startDate: session.startTime,
          endDate: endTime,
          durationMinutes,
          avgVoltageHours: new Decimal(stats.avgVoltageHours),
          avgWattsHours: new Decimal(stats.avgWattsHours),
          avgAmpereHours: new Decimal(stats.avgAmpereHours),
          totalVoltageHours: new Decimal(stats.totalVoltageHours),
          totalWattsHours: new Decimal(stats.totalWattsHours),
          totalAmpereHours: new Decimal(stats.totalAmpereHours),
          initialBatteryPercentage: session.initialBatteryPercentage || new Decimal(0),
          finalBatteryPercentage: new Decimal(finalBatteryPercentage),
          batteryConsumed: new Decimal(batteryConsumed)
        }
      });

      // Actualizar estado del parlante a apagado
      await this.prisma.speaker.update({
        where: { id: session.speakerId },
        data: { 
          state: false,
          batteryPercentage: new Decimal(finalBatteryPercentage),
          updatedAt: new Date()
        }
      });

      console.log(`✅ Session ended for speaker ${session.speakerName} (ID: ${session.speakerId})`);
      console.log(`📊 Duration: ${durationMinutes} minutes, Battery consumed: ${batteryConsumed.toFixed(1)}%`);

      return {
        ...updatedSession,
        statistics: stats,
        durationMinutes,
        batteryConsumed
      };
    } catch (error) {
      console.error('Error ending usage session:', error);
      throw error;
    }
  }

  // Obtener datos de sesión actual mejorado
  async getCurrentSessionData(sessionId: number) {
    const session = await this.prisma.usageSession.findUnique({
      where: { id: sessionId },
      include: {
        energyMeasurements: {
          orderBy: { recordedAt: 'desc' },
          take: 50 // Últimas 50 mediciones para gráficos
        },
        speaker: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Calcular estadísticas en tiempo real
    const measurements = session.energyMeasurements;
    const currentTime = new Date();
    const stats = this.calculateSessionStatistics(measurements, session.startTime, currentTime);

    const durationMinutes = Math.floor((currentTime.getTime() - session.startTime.getTime()) / 60000);
    
    return {
      ...session,
      currentStatistics: stats,
      durationMinutes,
      measurementCount: measurements.length
    };
  }

  // Obtener sesión activa de un parlante
  async getActiveSession(speakerId: number) {
    return await this.prisma.usageSession.findFirst({
      where: {
        speakerId,
        status: 'ACTIVE'
      },
      include: {
        speaker: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });
  }

  // NUEVO: Obtener sesión por ID
  async getSessionById(sessionId: number) {
    return await this.prisma.usageSession.findUnique({
      where: { id: sessionId },
      include: {
        speaker: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });
  }

  // NUEVO: Obtener estado del parlante
  async getSpeakerStatus(speakerId: number) {
    const speaker = await this.prisma.speaker.findUnique({
      where: { id: speakerId },
      include: {
        usageSessions: {
          where: { status: 'ACTIVE' },
          take: 1
        }
      }
    });

    if (!speaker) {
      throw new NotFoundException('Speaker not found');
    }

    return {
      speaker,
      hasActiveSession: speaker.usageSessions.length > 0,
      activeSession: speaker.usageSessions[0] || null
    };
  }

  // NUEVO: Forzar finalización de todas las sesiones activas
  async forceEndAllActiveSessions() {
    try {
      const activeSessions = await this.prisma.usageSession.findMany({
        where: { status: 'ACTIVE' },
        include: { speaker: true }
      });

      const endTime = new Date();
      const results: { sessionId: number; speakerId: number; speakerName: string | null }[] = [];

      for (const session of activeSessions) {
        // Finalizar sesión con estado INTERRUPTED
        const updatedSession = await this.prisma.usageSession.update({
          where: { id: session.id },
          data: {
            endTime,
            finalBatteryPercentage: session.speaker.batteryPercentage,
            status: 'INTERRUPTED'
          }
        });

        // Apagar parlante
        await this.prisma.speaker.update({
          where: { id: session.speakerId },
          data: { 
            state: false,
            updatedAt: new Date()
          }
        });

        results.push({
          sessionId: session.id,
          speakerId: session.speakerId,
          speakerName: session.speakerName
        });
      }

      return {
        count: results.length,
        sessions: results
      };
    } catch (error) {
      console.error('Error force-ending sessions:', error);
      throw error;
    }
  }

  // NUEVO: Obtener estadísticas de una sesión
  async getSessionStatistics(sessionId: number) {
    const session = await this.prisma.usageSession.findUnique({
      where: { id: sessionId },
      include: {
        energyMeasurements: true
      }
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const measurements = session.energyMeasurements;
    const endTime = session.endTime || new Date();
    
    return this.calculateSessionStatistics(measurements, session.startTime, endTime);
  }

  // NUEVO: Verificar salud de la base de datos
  async checkDatabaseHealth(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  // Método auxiliar para calcular estadísticas
  private calculateSessionStatistics(measurements: any[], startTime: Date, endTime: Date) {
    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
    
    if (measurements.length === 0) {
      return {
        avgVoltageHours: 0,
        avgWattsHours: 0,
        avgAmpereHours: 0,
        totalVoltageHours: 0,
        totalWattsHours: 0,
        totalAmpereHours: 0,
        measurementCount: 0,
        durationMinutes,
        avgMeasurementInterval: 0
      };
    }

    const totals = measurements.reduce((acc, m) => {
      acc.voltageHours += Number(m.voltageHours);
      acc.wattsHours += Number(m.wattsHours);
      acc.ampereHours += Number(m.ampereHours);
      return acc;
    }, { voltageHours: 0, wattsHours: 0, ampereHours: 0 });

    const count = measurements.length;
    
    // Calcular intervalo promedio entre mediciones
    let avgInterval = 0;
    if (count > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < measurements.length; i++) {
        const timeDiff = measurements[i].recordedAt.getTime() - measurements[i-1].recordedAt.getTime();
        intervals.push(timeDiff / 1000); // en segundos
      }
      avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    }

    return {
      avgVoltageHours: totals.voltageHours / count,
      avgWattsHours: totals.wattsHours / count,
      avgAmpereHours: totals.ampereHours / count,
      totalVoltageHours: totals.voltageHours,
      totalWattsHours: totals.wattsHours,
      totalAmpereHours: totals.ampereHours,
      measurementCount: count,
      durationMinutes,
      avgMeasurementInterval: avgInterval
    };
  }
}