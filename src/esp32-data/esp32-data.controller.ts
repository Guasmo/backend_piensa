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
import { StartSessionDto } from './dto/StartSession-dto';
import { EndSessionDto } from './dto/EndSession-dto';

@Controller('esp32-data')
export class Esp32DataController {
  constructor(private readonly esp32DataService: Esp32DataService) {}

  // ✅ NUEVO: Endpoint para recibir datos en tiempo real (NO los guarda en DB)
  @Post('realtime-data')
  @UsePipes(new ValidationPipe({ transform: true }))
  async receiveRealtimeData(@Body() data: Esp32DataDto) {
    try {
      // Validar que si hay session_id, la sesión esté activa
      if (data.usage_session_id) {
        const session = await this.esp32DataService.getSessionById(data.usage_session_id);
        if (!session || session.status !== 'ACTIVE') {
          throw new BadRequestException('Invalid or inactive session');
        }
      }

      // Solo almacenar en memoria temporal y actualizar batería del parlante
      const result = await this.esp32DataService.updateRealtimeData(data);
      
      return {
        success: true,
        message: 'Realtime data received successfully',
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        success: false,
        message: 'Error processing realtime data',
        error: error.message
      });
    }
  }

  // ✅ NUEVO: Endpoint para obtener datos en tiempo real de una sesión
  @Get('realtime-data/:sessionId')
  async getRealtimeData(@Param('sessionId', ParseIntPipe) sessionId: number) {
    try {
      const data = await this.esp32DataService.getRealtimeSessionData(sessionId);
      
      return {
        success: true,
        data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException({
        success: false,
        message: 'Error fetching realtime data',
        error: error.message
      });
    }
  }

  // Endpoint para iniciar una sesión de uso
  @Post('start-session')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async startUsageSession(@Body() data: StartSessionDto) {
    try {
      // Verificar si ya hay una sesión activa para este parlante
      const activeSession = await this.esp32DataService.getActiveSession(data.speakerId);
      if (activeSession) {
        throw new BadRequestException('Speaker already has an active session');
      }

      const session = await this.esp32DataService.startUsageSession(
        data.speakerId,
        data.userId,
        data.initialBatteryPercentage
      );

      return {
        success: true,
        message: 'Session started successfully',
        data: {
          id: session.id,
          startTime: session.startTime
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
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

  // ✅ MODIFICADO: Endpoint para terminar sesión (ahora guarda el resumen)
  @Post('end-session/:sessionId')
  @UsePipes(new ValidationPipe({ transform: true }))
  async endUsageSession(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() data: EndSessionDto
  ) {
    try {
      const result = await this.esp32DataService.endUsageSessionWithSummary(
        sessionId,
        data.finalBatteryPercentage
      );

      return {
        success: true,
        message: 'Session ended successfully',
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
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

  // Endpoint para verificar sesiones activas de un parlante
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

  // Endpoint para obtener el estado actual de un parlante
  @Get('speaker-status/:speakerId')
  async getSpeakerStatus(@Param('speakerId', ParseIntPipe) speakerId: number) {
    try {
      const status = await this.esp32DataService.getSpeakerStatus(speakerId);
      
      return {
        success: true,
        status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException({
        success: false,
        message: 'Error fetching speaker status',
        error: error.message
      });
    }
  }

  // Endpoint para forzar el final de todas las sesiones activas
  @Post('force-end-all-sessions')
  async forceEndAllActiveSessions() {
    try {
      const result = await this.esp32DataService.forceEndAllActiveSessions();
      
      return {
        success: true,
        message: `${result.count} sessions were force-ended`,
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Error force-ending sessions',
        error: error.message
      });
    }
  }

  // Health check endpoint
  @Get('health')
  async healthCheck() {
    try {
      const dbHealth = await this.esp32DataService.checkDatabaseHealth();
      
      return {
        success: true,
        status: 'healthy',
        database: dbHealth ? 'connected' : 'disconnected',
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
}