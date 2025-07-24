import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { Esp32DataDto } from './dto/Esp32Data-dto';

// ✅ NUEVO: Interface para datos en tiempo real
interface RealtimeSessionData {
  sessionId: number;
  speakerId: number;
  startTime: Date;
  measurements: Esp32DataDto[];
  currentStats: {
    avgCurrent: number;
    avgVoltage: number;
    avgPower: number;
    totalConsumed: number;
    measurementCount: number;
    durationSeconds: number;
  };
}

@Injectable()
export class Esp32DataService {
  // ✅ NUEVO: Almacenamiento en memoria para datos en tiempo real
  private realtimeData: Map<number, RealtimeSessionData> = new Map();
  
  constructor(private prisma: PrismaService) {}

  // ✅ NUEVO: Actualizar datos en tiempo real (solo en memoria)
  async updateRealtimeData(data: Esp32DataDto) {
    try {
      console.log('📊 Datos en tiempo real recibidos del ESP32:', data);

      // Verificar que la sesión existe y está activa
      const session = await this.prisma.usageSession.findFirst({
        where: {
          id: data.usage_session_id,
          status: 'ACTIVE'
        },
        include: {
          speaker: true
        }
      });

      if (!session) {
        throw new BadRequestException(`Session ${data.usage_session_id} not found or not active`);
      }

      // Verificar que el speaker_id coincide
      if (session.speakerId !== data.speaker_id) {
        throw new BadRequestException('Speaker ID mismatch');
      }

      // Actualizar solo el porcentaje de batería del parlante en DB
      await this.prisma.speaker.update({
        where: { id: data.speaker_id },
        data: { 
          batteryPercentage: new Decimal(data.battery_remaining_percent),
          updatedAt: new Date()
        }
      });

      // Obtener o crear datos en tiempo real para esta sesión
      let sessionData = this.realtimeData.get(data.usage_session_id);
      if (!sessionData) {
        sessionData = {
          sessionId: data.usage_session_id,
          speakerId: data.speaker_id,
          startTime: session.startTime,
          measurements: [],
          currentStats: {
            avgCurrent: 0,
            avgVoltage: 0,
            avgPower: 0,
            totalConsumed: 0,
            measurementCount: 0,
            durationSeconds: 0
          }
        };
      }

      // Agregar nueva medición
      sessionData.measurements.push(data);
      
      // Mantener solo las últimas 100 mediciones en memoria
      if (sessionData.measurements.length > 100) {
        sessionData.measurements = sessionData.measurements.slice(-100);
      }

      // Calcular estadísticas actuales
      sessionData.currentStats = this.calculateRealtimeStats(sessionData.measurements, sessionData.startTime);
      
      // Actualizar en memoria
      this.realtimeData.set(data.usage_session_id, sessionData);

      console.log(`✅ Datos en tiempo real actualizados para sesión ${data.usage_session_id}`);
      
      return {
        sessionId: data.usage_session_id,
        speakerId: data.speaker_id,
        batteryPercent: data.battery_remaining_percent,
        measurementCount: sessionData.measurements.length,
        currentStats: sessionData.currentStats
      };

    } catch (error) {
      console.error('❌ Error actualizando datos en tiempo real:', error);
      throw error;
    }
  }

  // ✅ NUEVO: Obtener datos en tiempo real de una sesión
  async getRealtimeSessionData(sessionId: number) {
    const session = await this.prisma.usageSession.findUnique({
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

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    const realtimeData = this.realtimeData.get(sessionId);
    
    if (!realtimeData) {
      // Si no hay datos en tiempo real, devolver información básica de la sesión
      return {
        ...session,
        measurements: [],
        currentStats: {
          avgCurrent: 0,
          avgVoltage: 0,
          avgPower: 0,
          totalConsumed: 0,
          measurementCount: 0,
          durationSeconds: Math.floor((new Date().getTime() - session.startTime.getTime()) / 1000)
        },
        measurementCount: 0
      };
    }

    return {
      ...session,
      measurements: realtimeData.measurements.slice(-20), // Últimas 20 mediciones
      currentStats: realtimeData.currentStats,
      measurementCount: realtimeData.measurements.length
    };
  }

  // Iniciar sesión de uso
  async startUsageSession(speakerId: number, userId: number, initialBatteryPercentage: number) {
    try {
      console.log(`🚀 Iniciando sesión para parlante ${speakerId}, usuario ${userId}`);

      // Verificar que no hay sesión activa para este parlante
      const activeSession = await this.prisma.usageSession.findFirst({
        where: {
          speakerId,
          status: 'ACTIVE'
        }
      });

      if (activeSession) {
        throw new BadRequestException(`Speaker ${speakerId} already has an active session (ID: ${activeSession.id})`);
      }

      // Obtener información del parlante
      const speaker = await this.prisma.speaker.findUnique({
        where: { id: speakerId }
      });

      if (!speaker) {
        throw new NotFoundException(`Speaker with ID ${speakerId} not found`);
      }

      // Verificar que el usuario existe
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
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
          speaker: {
            select: {
              id: true,
              name: true,
              position: true
            }
          },
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

      // ✅ NUEVO: Inicializar datos en tiempo real para esta sesión
      this.realtimeData.set(session.id, {
        sessionId: session.id,
        speakerId,
        startTime: session.startTime,
        measurements: [],
        currentStats: {
          avgCurrent: 0,
          avgVoltage: 0,
          avgPower: 0,
          totalConsumed: 0,
          measurementCount: 0,
          durationSeconds: 0
        }
      });

      console.log(`✅ Sesión ${session.id} iniciada para parlante "${speaker.name}" (ID: ${speakerId})`);
      
      return session;
    } catch (error) {
      console.error('❌ Error iniciando sesión de uso:', error);
      throw error;
    }
  }

  // ✅ MODIFICADO: Terminar sesión guardando solo el resumen
  async endUsageSessionWithSummary(sessionId: number, finalBatteryPercentage: number) {
    try {
      console.log(`🔚 Terminando sesión ${sessionId} con resumen`);

      // Obtener la sesión
      const session = await this.prisma.usageSession.findUnique({
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

      if (!session) {
        throw new NotFoundException(`Session ${sessionId} not found`);
      }

      if (session.status !== 'ACTIVE') {
        throw new BadRequestException(`Session ${sessionId} is not active (status: ${session.status})`);
      }

      const endTime = new Date();
      const durationMinutes = Math.floor((endTime.getTime() - session.startTime.getTime()) / 60000);
      const batteryConsumed = Number(session.initialBatteryPercentage) - finalBatteryPercentage;

      // Obtener datos en tiempo real de la sesión
      const realtimeData = this.realtimeData.get(sessionId);
      
      let stats = {
        avgCurrent: 0,
        avgVoltage: 0,
        avgPower: 0,
        totalConsumed: 0,
        measurementCount: 0,
        durationSeconds: Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000)
      };

      if (realtimeData && realtimeData.measurements.length > 0) {
        stats = this.calculateRealtimeStats(realtimeData.measurements, session.startTime);
      }

      // Actualizar la sesión
      const updatedSession = await this.prisma.usageSession.update({
        where: { id: sessionId },
        data: {
          endTime,
          finalBatteryPercentage: new Decimal(finalBatteryPercentage),
          status: 'COMPLETED'
        }
      });

      // ✅ NUEVO: Crear registro en historial con los promedios
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
          // Usar los promedios calculados de los datos en tiempo real
          avgCurrent_mA: new Decimal(stats.avgCurrent),
          avgVoltage_V: new Decimal(stats.avgVoltage),
          avgPower_mW: new Decimal(stats.avgPower),
          totalCurrent_mA: new Decimal(stats.avgCurrent * stats.measurementCount),
          totalVoltage_V: new Decimal(stats.avgVoltage * stats.measurementCount),
          totalPower_mW: new Decimal(stats.avgPower * stats.measurementCount),
          totalConsumed_mAh: new Decimal(stats.totalConsumed),
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

      // ✅ NUEVO: Limpiar datos en tiempo real de la memoria
      this.realtimeData.delete(sessionId);

      console.log(`✅ Sesión ${sessionId} terminada. Duración: ${durationMinutes} min, Batería consumida: ${batteryConsumed.toFixed(1)}%`);

      return {
        session: updatedSession,
        statistics: stats,
        durationMinutes,
        batteryConsumed,
        measurementCount: stats.measurementCount
      };
    } catch (error) {
      console.error('❌ Error terminando sesión de uso:', error);
      throw error;
    }
  }

  // Obtener sesión activa de un parlante
  async getActiveSession(speakerId: number) {
    const session = await this.prisma.usageSession.findFirst({
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

    if (!session) {
      return null;
    }

    // Agregar datos en tiempo real si existen
    const realtimeData = this.realtimeData.get(session.id);
    if (realtimeData) {
      return {
        ...session,
        currentStats: realtimeData.currentStats,
        measurementCount: realtimeData.measurements.length,
        latestMeasurements: realtimeData.measurements.slice(-5) // Últimas 5 mediciones
      };
    }

    return session;
  }

  // Obtener sesión por ID
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

  // Obtener estado del parlante
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
      throw new NotFoundException(`Speaker with ID ${speakerId} not found`);
    }

    return {
      speaker,
      hasActiveSession: speaker.usageSessions.length > 0,
      activeSession: speaker.usageSessions[0] || null
    };
  }

  // Forzar finalización de todas las sesiones activas
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
        await this.prisma.usageSession.update({
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

        // ✅ NUEVO: Limpiar datos en tiempo real
        this.realtimeData.delete(session.id);

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
      console.error('❌ Error force-ending sessions:', error);
      throw error;
    }
  }

  // Verificar salud de la base de datos
  async checkDatabaseHealth(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  // ✅ NUEVO: Calcular estadísticas en tiempo real
  private calculateRealtimeStats(measurements: Esp32DataDto[], startTime: Date) {
    if (measurements.length === 0) {
      return {
        avgCurrent: 0,
        avgVoltage: 0,
        avgPower: 0,
        totalConsumed: 0,
        measurementCount: 0,
        durationSeconds: Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
      };
    }

    const totals = measurements.reduce((acc, m) => {
      acc.current += m.current_mA;
      acc.voltage += m.voltage_V;
      acc.power += m.power_mW;
      acc.consumed += m.total_consumed_mAh;
      return acc;
    }, { current: 0, voltage: 0, power: 0, consumed: 0 });

    const count = measurements.length;
    const latestMeasurement = measurements[measurements.length - 1];
    
    return {
      avgCurrent: Number((totals.current / count).toFixed(2)),
      avgVoltage: Number((totals.voltage / count).toFixed(2)),
      avgPower: Number((totals.power / count).toFixed(2)),
      totalConsumed: latestMeasurement ? latestMeasurement.total_consumed_mAh : 0,
      measurementCount: count,
      durationSeconds: Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
    };
  }
}