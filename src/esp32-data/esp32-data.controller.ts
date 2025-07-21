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

  // Endpoint para recibir datos del ESP32
  @Post('energy-measurement')
  @UsePipes(new ValidationPipe({ transform: true }))
  async receiveEnergyData(@Body() data: Esp32DataDto) {
    try {
      // Validar que si hay session_id, la sesión esté activa
      if (data.usage_session_id) {
        const session = await this.esp32DataService.getSessionById(data.usage_session_id);
        if (!session || session.status !== 'ACTIVE') {
          throw new BadRequestException('Invalid or inactive session');
        }
      }

      const result = await this.esp32DataService.saveEnergyMeasurement(data);
      
      return {
        success: true,
        message: 'Data received successfully',
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        success: false,
        message: 'Error saving energy measurement',
        error: error.message
      });
    }
  }

  // --- MÉTODO MODIFICADO ---
  // Endpoint para iniciar una sesión de uso
  @Post('start-session')
  @HttpCode(HttpStatus.CREATED) // Se añade para ser explícito con el código 201
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

      // ✅ FIX: Se ajusta la estructura del objeto de respuesta.
      // El objeto "session" ahora está dentro de una propiedad "data"
      // y solo se devuelve el ID y la hora de inicio, que es lo necesario.
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

  // Endpoint para terminar una sesión de uso
  @Post('end-session/:sessionId')
  @UsePipes(new ValidationPipe({ transform: true }))
  async endUsageSession(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() data: EndSessionDto
  ) {
    try {
      const result = await this.esp32DataService.endUsageSession(
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

  // Endpoint para obtener datos en tiempo real
  @Get('current-session/:sessionId')
  async getCurrentSessionData(@Param('sessionId', ParseIntPipe) sessionId: number) {
    try {
      const data = await this.esp32DataService.getCurrentSessionData(sessionId);
      
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
        message: 'Error fetching session data',
        error: error.message
      });
    }
  }

  // NUEVO: Endpoint para verificar sesiones activas de un parlante
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

  // NUEVO: Endpoint para obtener el estado actual de un parlante
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

  // NUEVO: Endpoint para forzar el final de todas las sesiones activas (útil para mantenimiento)
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

  // NUEVO: Endpoint para obtener estadísticas en tiempo real
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

  // NUEVO: Health check endpoint
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