import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  ValidationPipe,
  UsePipes,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException
} from '@nestjs/common';
import { SpeakersService } from './speakers.service';
import { CreateSpeakerDto } from './dto/create-speakers-dto';
import { UpdateSpeakerDto } from './dto/update-speakers-dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { Role } from '@prisma/client';

@Controller('speakers')
export class SpeakersController {
  constructor(private readonly speakersService: SpeakersService) {}

  // ✅ 1. RUTAS ESTÁTICAS PRIMERO - Obtener todos los parlantes con filtros opcionales
  @Get()
  async findAll(
    @Query('state') state?: string,
    @Query('position') position?: string,
    @Query('batteryLow') batteryLow?: string
  ) {
    try {
      const filters = {
        state: state ? state === 'true' : undefined,
        position: position || undefined,
        batteryLow: batteryLow ? parseFloat(batteryLow) : undefined
      };

      const speakers = await this.speakersService.findAll(filters);
      
      return {
        success: true,
        count: speakers.length,
        data: speakers,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Error fetching speakers',
        error: error.message
      });
    }
  }

  // ✅ 2. RUTA all-history ANTES de las rutas con :id
  @Get('all-history')
  async getAllSpeakersHistory(
    @Query('limit') limit?: string,
    @Query('page') page?: string
  ) {
    try {
      const limitNum = limit ? parseInt(limit) : 50;
      const pageNum = page ? parseInt(page) : 1;
      
      const result = await this.speakersService.getAllSpeakersHistory(limitNum, pageNum);
      
      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Error fetching all speakers history',
        error: error.message
      });
    }
  }

  // ✅ 3. RUTA battery/stats ANTES de las rutas con :id
  @Get('battery/stats')
  async getBatteryStats() {
    try {
      const stats = await this.speakersService.getBatteryStatistics();
      
      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Error fetching battery statistics',
        error: error.message
      });
    }
  }

  // ✅ 4. RUTAS DINÁMICAS CON :id AL FINAL

  // Obtener un parlante por ID
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      const speaker = await this.speakersService.findOne(id);
      
      return {
        success: true,
        data: speaker,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        success: false,
        message: 'Error fetching speaker',
        error: error.message
      });
    }
  }

  // Obtener historial de un parlante específico
  @Get(':id/history')
  async getSpeakerHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: string,
    @Query('page') page?: string
  ) {
    try {
      const limitNum = limit ? parseInt(limit) : 20;
      const pageNum = page ? parseInt(page) : 1;
      
      const history = await this.speakersService.getSpeakerHistory(id, limitNum, pageNum);
      
      return {
        success: true,
        data: history,
        pagination: {
          page: pageNum,
          limit: limitNum
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        success: false,
        message: 'Error fetching speaker history',
        error: error.message
      });
    }
  }

  // Obtener estado detallado de un parlante
  @Get(':id/status')
  async getSpeakerStatus(@Param('id', ParseIntPipe) id: number) {
    try {
      const status = await this.speakersService.getSpeakerDetailedStatus(id);
      
      return {
        success: true,
        data: status,
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

  // Obtener sesión actual activa de un parlante
  @Get(':id/active-session')
  async getActiveSession(@Param('id', ParseIntPipe) id: number) {
    try {
      const session = await this.speakersService.getActiveSession(id);
      
      return {
        success: true,
        hasActiveSession: !!session,
        data: session,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Error fetching active session',
        error: error.message
      });
    }
  }

  // ✅ 5. MÉTODOS POST, PUT, DELETE AL FINAL

  // Crear nuevo parlante
  @Auth(Role.ADMIN, Role.SUPERADMIN)
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createSpeakerDto: CreateSpeakerDto) {
    try {
      const speaker = await this.speakersService.create(createSpeakerDto);
      
      return {
        success: true,
        message: 'Speaker created successfully',
        data: speaker,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: 'Error creating speaker',
        error: error.message
      });
    }
  }

  // Forzar apagado de un parlante (terminar sesión activa)
  @Post(':id/force-shutdown')
  async forceShutdown(@Param('id', ParseIntPipe) id: number) {
    try {
      const result = await this.speakersService.forceShutdown(id);
      
      return {
        success: true,
        message: result.message,
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        success: false,
        message: 'Error forcing shutdown',
        error: error.message
      });
    }
  }

  // Actualizar parlante
  @Auth(Role.ADMIN, Role.SUPERADMIN)
  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSpeakerDto: UpdateSpeakerDto
  ) {
    try {
      const speaker = await this.speakersService.update(id, updateSpeakerDto);
      
      return {
        success: true,
        message: 'Speaker updated successfully',
        data: speaker,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        success: false,
        message: 'Error updating speaker',
        error: error.message
      });
    }
  }

  // Eliminar parlante
  @Auth(Role.ADMIN, Role.SUPERADMIN)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.speakersService.remove(id);
      
      return {
        success: true,
        message: 'Speaker deleted successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException({
        success: false,
        message: 'Error deleting speaker',
        error: error.message
      });
    }
  }

  @Get(':id/battery-level')
async getBatteryLevel(@Param('id', ParseIntPipe) id: number) {
  try {
    const speaker = await this.speakersService.findOne(id);
    
    return {
      success: true,
      speakerId: id,
      currentBatteryLevel: Number(speaker.batteryPercentage),
      lastUpdated: speaker.updatedAt,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw error;
    }
    
    throw new InternalServerErrorException({
      success: false,
      message: 'Error fetching battery level',
      error: error.message
    });
  }
}


@Put(':id/battery-level')
async updateBatteryLevel(
  @Param('id', ParseIntPipe) id: number,
  @Body() updateData: { batteryLevel: number }
) {
  try {
    if (updateData.batteryLevel < 0 || updateData.batteryLevel > 100) {
      throw new BadRequestException('Battery level must be between 0 and 100');
    }

    const updatedSpeaker = await this.speakersService.updateBatteryLevel(id, updateData.batteryLevel);
    
    return {
      success: true,
      message: 'Battery level updated successfully',
      data: {
        speakerId: id,
        previousLevel: Number(updatedSpeaker.batteryPercentage),
        newLevel: updateData.batteryLevel,
        updatedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    if (error instanceof NotFoundException || error instanceof BadRequestException) {
      throw error;
    }
    
    throw new InternalServerErrorException({
      success: false,
      message: 'Error updating battery level',
      error: error.message
    });
  }
}
}