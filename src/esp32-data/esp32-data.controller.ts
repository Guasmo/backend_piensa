import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  Param, 
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  ValidationPipe,
  UsePipes,
  ParseIntPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { Esp32DataService } from './esp32-data.service';
import { Esp32DataDto } from './dto/Esp32Data-dto';
import { MonitorDataDto } from './dto/MonitorData-dto';
import { StartSessionDto } from './dto/StartSession-dto';
import { EndSessionDto } from './dto/EndSession-dto';
import { VolumeControlDto } from './dto/VolumeControl-dto';

@Controller('api/energy')
export class Esp32DataController {
  constructor(private readonly esp32DataService: Esp32DataService) {}

  // ⚡ ENDPOINT PRINCIPAL ÚNICO - Obtener datos desde caché para frontend cada 2s
  @Get('realtime-data/:sessionId')
  async getRealtimeData(@Param('sessionId', ParseIntPipe) sessionId: number) {
    try {
      console.log(`📊 Frontend solicitando datos cada 2s - sesión ${sessionId}`);
      
      const data = await this.esp32DataService.getRealtimeSessionData(sessionId);
      
      return {
        success: true,
        data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Error obteniendo datos desde caché:`, error.message);
      
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException({
        success: false,
        message: 'Error fetching realtime session data',
        error: error.message
      });
    }
  }

  // ⚡ Endpoint para datos de monitoreo (caché temporal - NO guardar en BD)
  @Post('monitor-data')
  @UsePipes(new ValidationPipe({ transform: true }))
  async receiveMonitorData(@Body() data: MonitorDataDto) {
    try {
      console.log('🖥️ Datos de monitoreo recibidos (caché temporal):', {
        sessionId: data.sessionId,
        timestamp: data.timestamp,
        current: data.current_mA,
        voltage: data.voltage_V,
        power: data.power_mW,
        battery: data.battery_remaining_percent
      });

      // Validar sesión activa
      const session = await this.esp32DataService.getSessionById(data.sessionId);
      if (!session || session.status !== 'ACTIVE') {
        throw new BadRequestException('Invalid or inactive session');
      }

      // Almacenar en caché temporal (NO en base de datos)
      await this.esp32DataService.updateRealtimeCache(data);
      
      return {
        success: true,
        message: 'Monitor data cached successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error procesando datos de monitoreo:', error.message);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        success: false,
        message: 'Error caching monitor data',
        error: error.message
      });
    }
  }

  // 🔋 Endpoint para datos de batería (guardar en BD cada 30s)
  @Post('realtime-data')
  @UsePipes(new ValidationPipe({ transform: true }))
  async receiveRealtimeData(@Body() data: Esp32DataDto) {
    try {
      console.log('🔋 Actualización de batería recibida (BD):', {
        sessionId: data.usage_session_id,
        speakerId: data.speaker_id,
        battery: data.battery_remaining_percent,
        consumed: data.total_consumed_mAh
      });

      // Validar sesión activa
      if (data.usage_session_id && data.usage_session_id > 0) {
        const session = await this.esp32DataService.getSessionById(data.usage_session_id);
        if (!session || session.status !== 'ACTIVE') {
          throw new BadRequestException('Invalid or inactive session');
        }
      }

      // Solo actualizar batería del parlante (NO guardar mediciones)
      const result = await this.esp32DataService.updateSpeakerBattery(data);
      
      return {
        success: true,
        message: 'Battery updated successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error actualizando batería:', error.message);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        success: false,
        message: 'Error updating battery',
        error: error.message
      });
    }
  }

  // 🚀 Iniciar sesión de monitoreo
  @Post('start-session')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async startUsageSession(@Body() data: StartSessionDto) {
    try {
      console.log('🚀 Iniciando sesión optimizada:', {
        speakerId: data.speakerId,
        userId: data.userId,
        initialBattery: data.initialBatteryPercentage,
        mode: data.mode || 'ultra_optimized'
      });

      // Verificar sesión activa existente
      const activeSession = await this.esp32DataService.getActiveSession(data.speakerId);
      if (activeSession) {
        throw new BadRequestException('Speaker already has an active session');
      }

      const session = await this.esp32DataService.startUsageSession(
        data.speakerId,
        data.userId,
        data.initialBatteryPercentage
      );

      // Inicializar caché para esta sesión
      await this.esp32DataService.initializeRealtimeCache(session.id);

      return {
        success: true,
        message: 'Session started successfully (ultra optimized mode)',
        data: {
          id: session.id,
          startTime: session.startTime
        }
      };
    } catch (error) {
      console.error('❌ Error iniciando sesión:', error.message);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException({
        success: false,
        message: 'Error starting session',
        error: error.message
      });
    }
  }

  // 🔚 Finalizar sesión con historial completo
  @Post('end-session/:sessionId')
  @UsePipes(new ValidationPipe({ transform: true }))
  async endUsageSession(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() data: EndSessionDto & {
      totalMeasurementsSent?: number;
      totalConsumed_mAh?: number;
      sessionDurationSeconds?: number;
      avgCurrent_mA?: number;
      avgVoltage_V?: number;
      avgPower_mW?: number;
      peakPower_mW?: number;
      mode?: string;
    }
  ) {
    try {
      console.log(`🔚 Terminando sesión ultra optimizada ${sessionId}:`, {
        finalBattery: data.finalBatteryPercentage,
        totalMeasurements: data.totalMeasurementsSent || 0,
        totalConsumed: data.totalConsumed_mAh || 0,
        duration: data.sessionDurationSeconds || 0,
        mode: data.mode || 'ultra_optimized'
      });
      
      const result = await this.esp32DataService.endUsageSession(
        sessionId,
        data.finalBatteryPercentage,
        {
          totalMeasurementsSent: data.totalMeasurementsSent,
          totalConsumed_mAh: data.totalConsumed_mAh,
          sessionDurationSeconds: data.sessionDurationSeconds,
          avgCurrent_mA: data.avgCurrent_mA,
          avgVoltage_V: data.avgVoltage_V,
          avgPower_mW: data.avgPower_mW,
          peakPower_mW: data.peakPower_mW
        }
      );

      return {
        success: true,
        message: 'Session ended successfully and saved to history',
        data: result
      };
    } catch (error) {
      console.error(`❌ Error terminando sesión ${sessionId}:`, error.message);
      
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException({
        success: false,
        message: 'Error ending session',
        error: error.message
      });
    }
  }

  // 🔍 Verificar sesión activa de un parlante
  @Get('active-session/speaker/:speakerId')
  async getActiveSpeakerSession(@Param('speakerId', ParseIntPipe) speakerId: number) {
    try {
      const session = await this.esp32DataService.getActiveSession(speakerId);
      
      return {
        success: true,
        hasActiveSession: !!session,
        session: session || null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Error checking active session',
        error: error.message
      });
    }
  }

  // 📈 Obtener estadísticas de sesión
  @Get('session-stats/:sessionId')
  async getSessionStats(@Param('sessionId', ParseIntPipe) sessionId: number) {
    try {
      const stats = await this.esp32DataService.getSessionStatistics(sessionId);
      
      return {
        success: true,
        stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException({
        success: false,
        message: 'Error fetching session statistics',
        error: error.message
      });
    }
  }

  // 🧹 Limpiar caché de sesiones inactivas (mantenimiento)
  @Post('cleanup-cache')
  async cleanupCache() {
    try {
      const cleaned = await this.esp32DataService.cleanupInactiveSessionsCache();
      
      return {
        success: true,
        message: `Cleaned ${cleaned} inactive session caches`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Error cleaning up cache',
        error: error.message
      });
    }
  }

  // 📊 Obtener información del caché (debugging)
  @Get('cache-info')
  async getCacheInfo() {
    try {
      const cacheInfo = this.esp32DataService.getCacheInfo();
      
      return {
        success: true,
        cache: cacheInfo,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Error fetching cache info',
        error: error.message
      });
    }
  }

  // 🏥 Health check
  @Get('health')
  async healthCheck() {
    try {
      const dbHealth = await this.esp32DataService.checkDatabaseHealth();
      const cacheHealth = await this.esp32DataService.checkCacheHealth();
      
      return {
        success: true,
        status: 'healthy',
        services: {
          database: dbHealth ? 'connected' : 'disconnected',
          cache: cacheHealth ? 'active' : 'inactive'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        status: 'unhealthy',
        error: error.message
      });
    }
  }

  // 🔄 Reiniciar caché para sesión específica
  @Post('reset-cache/:sessionId')
  async resetSessionCache(@Param('sessionId', ParseIntPipe) sessionId: number) {
    try {
      // Limpiar caché existente
      await this.esp32DataService.clearRealtimeCache(sessionId);
      
      // Reinicializar caché
      await this.esp32DataService.initializeRealtimeCache(sessionId);
      
      return {
        success: true,
        message: `Cache reset for session ${sessionId}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Error resetting session cache',
        error: error.message
      });
    }
  }

  // 📋 Obtener sesión por ID
  @Get('session/:sessionId')
  async getSession(@Param('sessionId', ParseIntPipe) sessionId: number) {
    try {
      const session = await this.esp32DataService.getSessionById(sessionId);
      
      if (!session) {
        throw new NotFoundException('Session not found');
      }
      
      return {
        success: true,
        session,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException({
        success: false,
        message: 'Error fetching session',
        error: error.message
      });
    }
  }

  // 🔍 Verificar si una sesión tiene datos en caché
  @Get('has-cache/:sessionId')
  async hasSessionCache(@Param('sessionId', ParseIntPipe) sessionId: number) {
    try {
      const cacheInfo = this.esp32DataService.getCacheInfo();
      const hasCache = cacheInfo.sessions.some(s => s.sessionId === sessionId);
      
      return {
        success: true,
        hasCache,
        sessionId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Error checking session cache',
        error: error.message
      });
    }
  }

  // 🚀 Endpoint de prueba para verificar conectividad
  @Get('ping')
  async ping() {
    return {
      success: true,
      message: 'ESP32 Data Controller is running',
      mode: 'ultra_optimized',
      timestamp: new Date().toISOString()
    };
  }

  // 📊 Estadísticas generales del sistema
  @Get('system-stats')
  async getSystemStats() {
    try {
      const cacheInfo = this.esp32DataService.getCacheInfo();
      const dbHealth = await this.esp32DataService.checkDatabaseHealth();
      const cacheHealth = await this.esp32DataService.checkCacheHealth();
      
      return {
        success: true,
        stats: {
          activeSessions: cacheInfo.totalSessions,
          sessions: cacheInfo.sessions,
          database: dbHealth ? 'healthy' : 'unhealthy',
          cache: cacheHealth ? 'healthy' : 'unhealthy',
          mode: 'ultra_optimized',
          features: [
            'Fetching cada 2 segundos',
            'Endpoint único para frontend',
            'Caché temporal en memoria',
            'BD solo para batería cada 30s',
            'Historial completo al finalizar'
          ]
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Error fetching system stats',
        error: error.message
      });
    }
  }



  
// 🔊 ENDPOINT DE VOLUMEN SIMPLE (SIN ESP32)
@Post('volume/:speakerId')
@UsePipes(new ValidationPipe({ transform: true }))
async setVolume(
  @Param('speakerId', ParseIntPipe) speakerId: number,
  @Body() volumeData: any
) {
  try {
    console.log(`🔊 Comando de volumen recibido para speaker ${speakerId}:`, volumeData);

    // Validar volumen
    const volume = volumeData.volume;
    if (!volume || volume < 5 || volume > 30) {
      throw new BadRequestException({
        success: false,
        message: 'Volume must be between 5 and 30',
        currentVolume: volume
      });
    }

    // Simular cambio de volumen exitoso
    const previousVolume = 25; // Valor simulado
    
    console.log(`✅ Volumen simulado cambiado de ${previousVolume} a ${volume} para speaker ${speakerId}`);

    // Respuesta exitosa inmediata
    return {
      success: true,
      message: 'Volume changed successfully',
      data: {
        speakerId,
        previousVolume,
        newVolume: volume,
        timestamp: new Date().toISOString(),
        mode: 'simulation' // Indicar que es simulación
      }
    };

  } catch (error) {
    console.error(`❌ Error en comando de volumen para speaker ${speakerId}:`, error.message);
    
    if (error instanceof BadRequestException) {
      throw error;
    }
    
    throw new InternalServerErrorException({
      success: false,
      message: 'Error processing volume command',
      error: error.message,
      speakerId
    });
  }
}

  // 🔊 OBTENER ESTADO DEL VOLUMEN (SIMULADO)
@Get('volume/:speakerId')
async getVolumeStatus(@Param('speakerId', ParseIntPipe) speakerId: number) {
  try {
    console.log(`🔊 Consultando estado de volumen simulado para speaker ${speakerId}`);

    // Respuesta simulada
    return {
      success: true,
      data: {
        speakerId,
        currentVolume: 25, // Valor simulado
        minVolume: 5,
        maxVolume: 30,
        volumePercent: Math.round((25 / 30) * 100),
        audioPlaying: true,
        mode: 'simulation',
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error(`❌ Error obteniendo estado de volumen simulado:`, error.message);
    
    throw new InternalServerErrorException({
      success: false,
      message: 'Error fetching volume status',
      error: error.message,
      speakerId
    });
  }
}

  // 🔊 Endpoints de conveniencia para incrementar/decrementar
  @Post('volume/:speakerId/increase')
  async increaseVolume(@Param('speakerId', ParseIntPipe) speakerId: number) {
    try {
      // Obtener volumen actual
      const currentStatus = await this.esp32DataService.getVolumeStatus(speakerId);
      const newVolume = Math.min(currentStatus.currentVolume + 1, 30);
      
      return await this.setVolume(speakerId, {
        volume: newVolume,
        speakerId,
        action: 'increase'
      });
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Error increasing volume',
        error: error.message
      });
    }
  }

  @Post('volume/:speakerId/decrease')
  async decreaseVolume(@Param('speakerId', ParseIntPipe) speakerId: number) {
    try {
      // Obtener volumen actual
      const currentStatus = await this.esp32DataService.getVolumeStatus(speakerId);
      const newVolume = Math.max(currentStatus.currentVolume - 1, 5);
      
      return await this.setVolume(speakerId, {
        volume: newVolume,
        speakerId,
        action: 'decrease'
      });
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Error decreasing volume',
        error: error.message
      });
    }
  }

}




// Health check general del sistema
@Controller('api')
export class HealthController {
  constructor(private readonly esp32DataService: Esp32DataService) {}

  @Get('health')
  async systemHealth() {
    try {
      const dbHealth = await this.esp32DataService.checkDatabaseHealth();
      const cacheHealth = await this.esp32DataService.checkCacheHealth();
      
      return {
        success: true,
        status: 'healthy',
        services: {
          database: dbHealth ? 'up' : 'down',
          cache: cacheHealth ? 'up' : 'down',
          api: 'up'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        status: 'unhealthy',
        error: error.message
      });
    }
  }

  @Get('status')
  async getStatus() {
    try {
      const cacheInfo = this.esp32DataService.getCacheInfo();
      
      return {
        success: true,
        status: 'operational',
        mode: 'ultra_optimized',
        activeSessions: cacheInfo.totalSessions,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        status: 'error',
        error: error.message
      });
    }
  }
}