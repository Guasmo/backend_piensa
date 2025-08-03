import { 
  Injectable, 
  NotFoundException, 
  BadRequestException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { Esp32DataDto } from './dto/Esp32Data-dto';
import { MonitorDataDto } from './dto/MonitorData-dto';

@Injectable()
export class Esp32DataService {
  constructor(private prisma: PrismaService) {}

  // 🗄️ CACHÉ OPTIMIZADO - Un solo Map para datos completos
  private realtimeDataCache = new Map<number, RealtimeSessionData>();

  // ⚡ Inicializar caché para nueva sesión
  async initializeRealtimeCache(sessionId: number): Promise<void> {
    const session = await this.prisma.usageSession.findUnique({
      where: { id: sessionId },
      include: { speaker: true }
    });

    if (session) {
      this.realtimeDataCache.set(sessionId, {
        sessionId,
        speakerId: session.speakerId,
        speakerName: session.speakerName || session.speaker.name,
        userId: session.userId,
        status: session.status,
        startTime: session.startTime.toISOString(),
        durationMinutes: 0,
        initialBatteryPercentage: Number(session.initialBatteryPercentage || 100),
        
        latestData: {
          timestamp: 0,
          current_mA: 0,
          voltage_V: 0,
          power_mW: 0,
          battery_remaining_percent: Number(session.initialBatteryPercentage || 100),
          total_consumed_mAh: 0,
          sample_index: 0
        },
        
        statistics: {
          avgCurrent_mA: 0,
          avgVoltage_V: 0,
          avgPower_mW: 0,
          peakPower_mW: 0,
          measurementCount: 0,
          totalConsumed_mAh: 0,
          durationSeconds: 0
        },
        
        lastUpdated: new Date(),
        created: new Date()
      });

      console.log(`🗄️ Caché optimizado inicializado para sesión ${sessionId}`);
    }
  }

  // 🔄 Actualizar caché con datos del ESP32 (llamado desde monitor-data)
  async updateRealtimeCache(data: MonitorDataDto): Promise<void> {
    const cache = this.realtimeDataCache.get(data.sessionId);
    
    if (!cache) {
      console.warn(`⚠️ Caché no encontrado para sesión ${data.sessionId}, inicializando...`);
      await this.initializeRealtimeCache(data.sessionId);
      return this.updateRealtimeCache(data);
    }

    // Calcular duración desde el inicio
    const sessionStart = new Date(cache.startTime);
    const now = new Date();
    const durationMinutes = Math.floor((now.getTime() - sessionStart.getTime()) / 60000);
    const durationSeconds = Math.floor((now.getTime() - sessionStart.getTime()) / 1000);

    // Actualizar datos más recientes
    cache.latestData = {
      timestamp: data.timestamp,
      current_mA: data.current_mA,
      voltage_V: data.voltage_V,
      power_mW: data.power_mW,
      battery_remaining_percent: data.battery_remaining_percent,
      total_consumed_mAh: data.total_consumed_mAh,
      sample_index: data.sample_index
    };

    // Actualizar estadísticas desde datos del ESP32
    cache.statistics = {
      avgCurrent_mA: data.avgCurrent_mA || 0,
      avgVoltage_V: data.avgVoltage_V || 0,
      avgPower_mW: data.avgPower_mW || 0,
      peakPower_mW: data.peakPower_mW || 0,
      measurementCount: data.sample_index,
      totalConsumed_mAh: data.total_consumed_mAh,
      durationSeconds: data.timestamp
    };

    // Actualizar info de sesión
    cache.durationMinutes = durationMinutes;
    cache.lastUpdated = new Date();

    console.log(`🔄 Caché actualizado para sesión ${data.sessionId}: V:${data.voltage_V}V, I:${data.current_mA}mA, P:${data.power_mW}mW`);
  }

  // 📊 ENDPOINT PRINCIPAL - Obtener datos para frontend (GET /realtime-data/:sessionId)
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
      throw new NotFoundException('Session not found');
    }

    // Obtener datos desde caché
    const cache = this.realtimeDataCache.get(sessionId);
    
    if (!cache) {
      console.warn(`⚠️ Caché no encontrado para sesión ${sessionId}, creando datos básicos`);
      
      // Calcular duración actual
      const currentTime = new Date();
      const durationMinutes = Math.floor((currentTime.getTime() - session.startTime.getTime()) / 60000);
      
      return {
        sessionId: session.id,
        speakerId: session.speakerId,
        speakerName: session.speakerName || session.speaker.name,
        userId: session.userId,
        status: session.status,
        startTime: session.startTime.toISOString(),
        durationMinutes,
        initialBatteryPercentage: Number(session.initialBatteryPercentage || 100),
        
        // Datos vacíos si no hay caché
        latestData: {
          timestamp: 0,
          current_mA: 0,
          voltage_V: 0,
          power_mW: 0,
          battery_remaining_percent: Number(session.speaker.batteryPercentage || 100),
          total_consumed_mAh: 0,
          sample_index: 0
        },
        
        statistics: {
          avgCurrent_mA: 0,
          avgVoltage_V: 0,
          avgPower_mW: 0,
          peakPower_mW: 0,
          measurementCount: 0,
          totalConsumed_mAh: 0,
          durationSeconds: durationMinutes * 60
        },
        
        hasRealtimeData: false,
        lastUpdated: new Date().toISOString()
      };
    }

    // Devolver datos completos desde caché
    return {
      sessionId: cache.sessionId,
      speakerId: cache.speakerId,
      speakerName: cache.speakerName,
      userId: cache.userId,
      status: cache.status,
      startTime: cache.startTime,
      durationMinutes: cache.durationMinutes,
      initialBatteryPercentage: cache.initialBatteryPercentage,
      
      latestData: cache.latestData,
      statistics: cache.statistics,
      
      hasRealtimeData: true,
      lastUpdated: cache.lastUpdated.toISOString()
    };
  }

  // 🔋 Actualizar solo batería del parlante en BD (cada 30s)
  async updateSpeakerBattery(data: Esp32DataDto) {
    try {
      console.log('🔋 Actualizando batería del parlante en BD:', {
        speakerId: data.speaker_id,
        batteryPercent: data.battery_remaining_percent
      });

      // Validar sesión activa
      if (data.usage_session_id && data.usage_session_id > 0) {
        const session = await this.prisma.usageSession.findFirst({
          where: {
            id: data.usage_session_id,
            status: 'ACTIVE'
          }
        });

        if (!session) {
          throw new BadRequestException('Session not found or not active');
        }
      }

      // Solo actualizar batería del parlante (NO guardar mediciones)
      if (data.speaker_id) {
        const updatedSpeaker = await this.prisma.speaker.update({
          where: { id: data.speaker_id },
          data: { 
            batteryPercentage: new Decimal(data.battery_remaining_percent),
            updatedAt: new Date()
          }
        });

        console.log(`🔋 Batería actualizada en BD para parlante ${data.speaker_id}: ${data.battery_remaining_percent}%`);
        return updatedSpeaker;
      }

      return { message: 'Batería actualizada correctamente' };
    } catch (error) {
      console.error('Error updating speaker battery:', error);
      throw error;
    }
  }

  // 🚀 Iniciar sesión de uso
async startUsageSession(speakerId: number, userId: number, requestedBatteryPercentage?: number) {
  try {
    // Verificar que no hay sesión activa
    const activeSession = await this.prisma.usageSession.findFirst({
      where: {
        speakerId,
        status: 'ACTIVE'
      }
    });

    if (activeSession) {
      throw new BadRequestException('Speaker already has an active session');
    }

    // Verificar parlante existe
    const speaker = await this.prisma.speaker.findUnique({
      where: { id: speakerId }
    });

    if (!speaker) {
      throw new NotFoundException('Speaker not found');
    }

    // Verificar usuario existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 🔋 USAR NIVEL ACTUAL DE BATERÍA DEL SPEAKER (PERSISTENTE)
    const currentBatteryLevel = Number(speaker.batteryPercentage);
    
    console.log(`🔋 Iniciando sesión con batería actual del speaker: ${currentBatteryLevel}%`);
    
    // Si el ESP32 envía un nivel diferente, logearlo pero usar el de la BD
    if (requestedBatteryPercentage && Math.abs(requestedBatteryPercentage - currentBatteryLevel) > 5) {
      console.warn(`⚠️ Discrepancia de batería: ESP32 reporta ${requestedBatteryPercentage}%, BD tiene ${currentBatteryLevel}%. Usando valor de BD.`);
    }

    // Crear sesión con nivel actual de batería
    const session = await this.prisma.usageSession.create({
      data: {
        speakerId,
        userId,
        initialBatteryPercentage: new Decimal(currentBatteryLevel), // 🔋 USAR VALOR ACTUAL
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

    // Actualizar estado del parlante (mantener batería actual)
    await this.prisma.speaker.update({
      where: { id: speakerId },
      data: { 
        state: true,
        updatedAt: new Date()
        // NO actualizar batteryPercentage aquí
      }
    });

    console.log(`✅ Sesión iniciada para parlante ${speaker.name} con batería actual: ${currentBatteryLevel}%`);
    return session;
  } catch (error) {
    console.error('Error starting usage session:', error);
    throw error;
  }
}
  // 🔚 Finalizar sesión y guardar historial completo
async endUsageSession(
  sessionId: number, 
  finalBatteryPercentage: number,
  esp32Data?: {
    totalMeasurementsSent?: number;
    totalConsumed_mAh?: number;
    sessionDurationSeconds?: number;
    avgCurrent_mA?: number;
    avgVoltage_V?: number;
    avgPower_mW?: number;
    peakPower_mW?: number;
  }
) {
  try {
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
      throw new NotFoundException('Session not found');
    }

    if (session.status !== 'ACTIVE') {
      throw new BadRequestException('Session is not active');
    }

    const endTime = new Date();
    const durationMinutes = Math.floor((endTime.getTime() - session.startTime.getTime()) / 60000);
    const batteryConsumed = Number(session.initialBatteryPercentage) - finalBatteryPercentage;

    console.log(`🔋 Finalizando sesión: Batería inicial ${Number(session.initialBatteryPercentage)}% → Final ${finalBatteryPercentage}%`);
    console.log(`🔋 Batería consumida: ${batteryConsumed.toFixed(2)}%`);

    // Calcular estadísticas desde los datos del ESP32
    const stats = this.calculateStatsFromESP32Data(esp32Data, durationMinutes);

    // Actualizar sesión como completada
    const updatedSession = await this.prisma.usageSession.update({
      where: { id: sessionId },
      data: {
        endTime,
        finalBatteryPercentage: new Decimal(finalBatteryPercentage),
        status: 'COMPLETED',
        metadata: {
          totalMeasurementsSent: esp32Data?.totalMeasurementsSent || 0,
          totalConsumed_mAh: esp32Data?.totalConsumed_mAh || 0,
          reportedDurationSeconds: esp32Data?.sessionDurationSeconds || 0,
          actualDurationMinutes: durationMinutes,
          avgCurrent_mA: esp32Data?.avgCurrent_mA || 0,
          avgVoltage_V: esp32Data?.avgVoltage_V || 0,
          avgPower_mW: esp32Data?.avgPower_mW || 0,
          peakPower_mW: esp32Data?.peakPower_mW || 0,
          batteryConsumed: batteryConsumed
        }
      }
    });

    // Crear registro en historial con datos reales del ESP32
    const historyRecord = await this.prisma.history.create({
      data: {
        usageSessionId: sessionId,
        speakerId: session.speakerId,
        speakerName: session.speakerName || 'Unknown',
        speakerPosition: session.speakerPosition || 'Unknown',
        userId: session.userId,
        startDate: session.startTime,
        endDate: endTime,
        durationMinutes,
        
        // Usar datos reales del ESP32
        avgVoltageHours: new Decimal(stats.avgVoltage || 0),
        avgWattsHours: new Decimal(stats.avgPower || 0),
        avgAmpereHours: new Decimal(stats.avgCurrent || 0),
        totalVoltageHours: new Decimal(stats.totalVoltage || 0),
        totalWattsHours: new Decimal(stats.totalPower || 0),
        totalAmpereHours: new Decimal(stats.totalCurrent || 0),
        
        initialBatteryPercentage: session.initialBatteryPercentage || new Decimal(0),
        finalBatteryPercentage: new Decimal(finalBatteryPercentage),
        batteryConsumed: new Decimal(batteryConsumed),
        
        // Guardar datos completos del ESP32
        esp32Data: {
          totalMeasurementsSent: esp32Data?.totalMeasurementsSent || 0,
          totalConsumed_mAh: esp32Data?.totalConsumed_mAh || 0,
          reportedDurationSeconds: esp32Data?.sessionDurationSeconds || 0,
          avgCurrent_mA: esp32Data?.avgCurrent_mA || 0,
          avgVoltage_V: esp32Data?.avgVoltage_V || 0,
          avgPower_mW: esp32Data?.avgPower_mW || 0,
          peakPower_mW: esp32Data?.peakPower_mW || 0
        }
      }
    });

    // 🔋 GUARDAR NIVEL FINAL DE BATERÍA EN EL SPEAKER (PERSISTENTE)
    await this.prisma.speaker.update({
      where: { id: session.speakerId },
      data: { 
        state: false,
        batteryPercentage: new Decimal(finalBatteryPercentage), // 🔋 PERSISTIR BATERÍA
        updatedAt: new Date()
      }
    });

    // Limpiar caché
    this.clearRealtimeCache(sessionId);

    console.log(`✅ Sesión ${sessionId} finalizada y guardada en historial`);
    console.log(`🔋 Batería final persistida: ${finalBatteryPercentage}% para speaker ${session.speakerId}`);
    console.log(`📊 Duración: ${durationMinutes}min, Batería consumida: ${batteryConsumed.toFixed(1)}%`);

    return {
      session: updatedSession,
      historyRecord,
      statistics: stats,
      durationMinutes,
      batteryConsumed,
      esp32Data,
      persistedBatteryLevel: finalBatteryPercentage
    };
  } catch (error) {
    console.error('Error ending usage session:', error);
    throw error;
  }
}

  // Calcular estadísticas reales desde datos del ESP32
  private calculateStatsFromESP32Data(esp32Data: any, durationMinutes: number) {
    if (!esp32Data) {
      return {
        avgVoltage: 0,
        avgCurrent: 0,
        avgPower: 0,
        totalVoltage: 0,
        totalCurrent: 0,
        totalPower: 0
      };
    }

    // Usar datos directos del ESP32
    const avgCurrent = esp32Data.avgCurrent_mA || 0;
    const avgVoltage = esp32Data.avgVoltage_V || 0;
    const avgPower = esp32Data.avgPower_mW || 0;
    const totalConsumed = esp32Data.totalConsumed_mAh || 0;

    // Calcular totales basados en promedios y duración
    const durationHours = durationMinutes / 60;
    const totalCurrent = totalConsumed; // mAh
    const totalVoltage = avgVoltage * durationHours; // V⋅h
    const totalPower = avgPower * durationHours / 1000; // W⋅h (convertir de mW⋅h)

    return {
      avgVoltage,
      avgCurrent,
      avgPower,
      totalVoltage,
      totalCurrent,
      totalPower
    };
  }

  // 🗑️ Limpiar caché de sesión específica
  async clearRealtimeCache(sessionId: number): Promise<void> {
    const deleted = this.realtimeDataCache.delete(sessionId);
    if (deleted) {
      console.log(`🗑️ Caché limpiado para sesión ${sessionId}`);
    }
  }

  // 🧹 Limpiar caché de sesiones inactivas
  async cleanupInactiveSessionsCache(): Promise<number> {
    const activeSessions = await this.prisma.usageSession.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true }
    });

    const activeIds = new Set(activeSessions.map(s => s.id));
    let cleanedCount = 0;

    for (const [sessionId] of this.realtimeDataCache) {
      if (!activeIds.has(sessionId)) {
        this.realtimeDataCache.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Limpieza de caché: ${cleanedCount} sesiones inactivas eliminadas`);
    }

    return cleanedCount;
  }

  // 🏥 Verificar salud del caché
  async checkCacheHealth(): Promise<boolean> {
    try {
      const cacheSize = this.realtimeDataCache.size;
      console.log(`🗄️ Caché activo: ${cacheSize} sesiones`);
      return true;
    } catch {
      return false;
    }
  }

  // 📊 Obtener estadísticas desde metadatos de sesión o caché
  async getSessionStatistics(sessionId: number) {
    const session = await this.prisma.usageSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Si la sesión está activa, usar datos del caché
    if (session.status === 'ACTIVE') {
      const cache = this.realtimeDataCache.get(sessionId);
      if (cache) {
        return {
          avgVoltageHours: cache.statistics.avgVoltage_V,
          avgWattsHours: cache.statistics.avgPower_mW / 1000,
          avgAmpereHours: cache.statistics.avgCurrent_mA / 1000,
          totalVoltageHours: cache.statistics.avgVoltage_V * (cache.statistics.durationSeconds / 3600),
          totalWattsHours: cache.statistics.avgPower_mW * (cache.statistics.durationSeconds / 3600) / 1000,
          totalAmpereHours: cache.latestData.total_consumed_mAh / 1000,
          measurementCount: cache.statistics.measurementCount,
          durationMinutes: Math.floor(cache.statistics.durationSeconds / 60),
          avgMeasurementInterval: cache.statistics.measurementCount > 0 ? cache.statistics.durationSeconds / cache.statistics.measurementCount : 0
        };
      }
    }

    // Si la sesión está completada, usar metadatos
    const endTime = session.endTime || new Date();
    const durationMinutes = Math.floor((endTime.getTime() - session.startTime.getTime()) / 60000);
    
    const metadata = session.metadata as any;
    
    return {
      avgVoltageHours: metadata?.avgVoltage_V || 0,
      avgWattsHours: metadata?.avgPower_mW || 0,
      avgAmpereHours: metadata?.avgCurrent_mA || 0,
      totalVoltageHours: 0,
      totalWattsHours: 0,
      totalAmpereHours: metadata?.totalConsumed_mAh || 0,
      measurementCount: metadata?.totalMeasurementsSent || 0,
      durationMinutes,
      avgMeasurementInterval: durationMinutes > 0 ? (metadata?.reportedDurationSeconds || 0) / (metadata?.totalMeasurementsSent || 1) : 0
    };
  }

  // 🔍 Obtener sesión activa de un parlante
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

  // 🆔 Obtener sesión por ID
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

  // 🏥 Verificar salud de la base de datos
  async checkDatabaseHealth(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  // 📊 Obtener información del caché para debugging
  getCacheInfo() {
    const sessions = Array.from(this.realtimeDataCache.entries()).map(([sessionId, cache]) => ({
      sessionId,
      speakerId: cache.speakerId,
      measurementCount: cache.statistics.measurementCount,
      lastUpdated: cache.lastUpdated,
      latestBattery: cache.latestData.battery_remaining_percent
    }));

    return {
      totalSessions: this.realtimeDataCache.size,
      sessions
    };
  }
}