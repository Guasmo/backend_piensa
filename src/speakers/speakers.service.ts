import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpeakerDto } from './dto/create-speakers-dto';
import { UpdateSpeakerDto } from './dto/update-speakers-dto';
import { Decimal } from '@prisma/client/runtime/library';
import { SpeakerFilters } from './dto/speakers-Dto';

@Injectable()
export class SpeakersService {
  constructor(private prisma: PrismaService) {}

  // 🆕 NUEVO: Obtener todo el historial de todos los parlantes
  async getAllSpeakersHistory(limit: number = 50, page: number = 1) {
    const skip = (page - 1) * limit;

    const [histories, total] = await Promise.all([
      this.prisma.history.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          },
          speaker: {
            select: {
              id: true,
              name: true,
              position: true
            }
          }
        }
      }),
      this.prisma.history.count()
    ]);

    // Transformar los datos para que coincidan con la interfaz del frontend
    const transformedHistories = histories.map(history => ({
      id: history.id,
      usageSessionId: history.usageSessionId,
      speakerId: history.speakerId,
      speakerName: history.speaker?.name || 'Desconocido',
      speakerPosition: history.speaker?.position || 'Desconocida',
      userId: history.userId,
      user: history.user,
      startDate: history.startDate,
      endDate: history.endDate,
      durationMinutes: history.durationMinutes,
      
      // Campos de medición - usar los nombres correctos de la base de datos
      avgAmpereHours: history.avgAmpereHours,
      avgVoltageHours: history.avgVoltageHours,
      avgWattsHours: history.avgWattsHours,
      
      totalAmpereHours: history.totalAmpereHours,
      totalVoltageHours: history.totalVoltageHours,
      totalWattsHours: history.totalWattsHours,
      
      // Información de batería
      initialBatteryPercentage: history.initialBatteryPercentage,
      finalBatteryPercentage: history.finalBatteryPercentage,
      batteryConsumed: history.batteryConsumed,
      
      createdAt: history.createdAt
    }));

    return {
      histories: transformedHistories,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Obtener todos los parlantes con filtros
  async findAll(filters: SpeakerFilters = {}) {
    const where: any = {};

    // Aplicar filtros
    if (filters.state !== undefined) {
      where.state = filters.state;
    }

    if (filters.position) {
      where.position = {
        contains: filters.position,
        mode: 'insensitive'
      };
    }

    if (filters.batteryLow) {
      where.batteryPercentage = {
        lt: new Decimal(filters.batteryLow)
      };
    }

    return await this.prisma.speaker.findMany({
      where,
      include: {
        usageSessions: {
          where: { status: 'ACTIVE' },
          take: 1,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            usageSessions: true,
            histories: true
          }
        }
      },
      orderBy: { id: 'asc' }
    });
  }

  // Obtener un parlante por ID
  async findOne(id: number) {
    const speaker = await this.prisma.speaker.findUnique({
      where: { id },
      include: {
        usageSessions: {
          where: { status: 'ACTIVE' },
          take: 1,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true
              }
            }
          }
        },
        histories: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            usageSessions: true,
            histories: true
          }
        }
      }
    });

    if (!speaker) {
      throw new NotFoundException('Speaker not found');
    }

    return speaker;
  }

  // Crear nuevo parlante
  async create(createSpeakerDto: CreateSpeakerDto) {
    const batteryPercentage = createSpeakerDto.batteryPercentage || 100;
    
    return await this.prisma.speaker.create({
      data: {
        name: createSpeakerDto.name,
        position: createSpeakerDto.position,
        state: createSpeakerDto.state || false,
        batteryPercentage: new Decimal(batteryPercentage)
      }
    });
  }

  // Actualizar parlante
  async update(id: number, updateSpeakerDto: UpdateSpeakerDto) {
    // Verificar que el parlante existe
    const existingSpeaker = await this.prisma.speaker.findUnique({
      where: { id }
    });

    if (!existingSpeaker) {
      throw new NotFoundException('Speaker not found');
    }

    const updateData: any = {};

    if (updateSpeakerDto.name) {
      updateData.name = updateSpeakerDto.name;
    }

    if (updateSpeakerDto.position) {
      updateData.position = updateSpeakerDto.position;
    }

    if (updateSpeakerDto.state !== undefined) {
      updateData.state = updateSpeakerDto.state;
    }

    if (updateSpeakerDto.batteryPercentage !== undefined) {
      updateData.batteryPercentage = new Decimal(updateSpeakerDto.batteryPercentage);
    }

    updateData.updatedAt = new Date();

    return await this.prisma.speaker.update({
      where: { id },
      data: updateData
    });
  }

  // Eliminar parlante
  async remove(id: number) {
    // Verificar que el parlante existe
    const speaker = await this.prisma.speaker.findUnique({
      where: { id },
      include: {
        usageSessions: {
          where: { status: 'ACTIVE' }
        }
      }
    });

    if (!speaker) {
      throw new NotFoundException('Speaker not found');
    }

    // No permitir eliminar si tiene sesiones activas
    if (speaker.usageSessions.length > 0) {
      throw new BadRequestException('Cannot delete speaker with active sessions');
    }

    return await this.prisma.speaker.delete({
      where: { id }
    });
  }

  // Obtener estado detallado de un parlante
  async getSpeakerDetailedStatus(id: number) {
    const speaker = await this.prisma.speaker.findUnique({
      where: { id },
      include: {
        usageSessions: {
          where: { status: 'ACTIVE' },
          take: 1,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true
              }
            },
            energyMeasurements: {
              orderBy: { recordedAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!speaker) {
      throw new NotFoundException('Speaker not found');
    }

    const activeSession = speaker.usageSessions[0];
    let sessionInfo: any = null;

    if (activeSession) {
      const currentTime = new Date();
      const durationMinutes = Math.floor(
        (currentTime.getTime() - activeSession.startTime.getTime()) / 60000
      );

      sessionInfo = {
        sessionId: activeSession.id,
        user: activeSession.user,
        startTime: activeSession.startTime,
        durationMinutes,
        lastMeasurement: activeSession.energyMeasurements[0] || null
      };
    }

    return {
      speaker: {
        id: speaker.id,
        name: speaker.name,
        position: speaker.position,
        state: speaker.state,
        batteryPercentage: Number(speaker.batteryPercentage),
        createdAt: speaker.createdAt,
        updatedAt: speaker.updatedAt
      },
      status: {
        isOnline: speaker.state,
        hasActiveSession: !!activeSession,
        batteryStatus: this.getBatteryStatus(Number(speaker.batteryPercentage))
      },
      activeSession: sessionInfo
    };
  }

  // Obtener historial de un parlante específico
  async getSpeakerHistory(id: number, limit: number = 10, page: number = 1) {
    const speaker = await this.prisma.speaker.findUnique({
      where: { id }
    });

    if (!speaker) {
      throw new NotFoundException('Speaker not found');
    }

    const skip = (page - 1) * limit;

    const [histories, total] = await Promise.all([
      this.prisma.history.findMany({
        where: { speakerId: id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          },
          speaker: {
            select: {
              id: true,
              name: true,
              position: true
            }
          }
        }
      }),
      this.prisma.history.count({
        where: { speakerId: id }
      })
    ]);

    // Transformar los datos de la misma manera que getAllSpeakersHistory
    const transformedHistories = histories.map(history => ({
      id: history.id,
      usageSessionId: history.usageSessionId,
      speakerId: history.speakerId,
      speakerName: history.speaker?.name || 'Desconocido',
      speakerPosition: history.speaker?.position || 'Desconocida',
      userId: history.userId,
      user: history.user,
      startDate: history.startDate,
      endDate: history.endDate,
      durationMinutes: history.durationMinutes,
      
      // Campos de medición - usar los nombres correctos de la base de datos
      avgAmpereHours: history.avgAmpereHours,
      avgVoltageHours: history.avgVoltageHours,
      avgWattsHours: history.avgWattsHours,
      
      totalAmpereHours: history.totalAmpereHours,
      totalVoltageHours: history.totalVoltageHours,
      totalWattsHours: history.totalWattsHours,
      
      // Información de batería
      initialBatteryPercentage: history.initialBatteryPercentage,
      finalBatteryPercentage: history.finalBatteryPercentage,
      batteryConsumed: history.batteryConsumed,
      
      createdAt: history.createdAt
    }));

    return {
      histories: transformedHistories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Obtener sesión activa de un parlante
  async getActiveSession(id: number) {
    return await this.prisma.usageSession.findFirst({
      where: {
        speakerId: id,
        status: 'ACTIVE'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        energyMeasurements: {
          orderBy: { recordedAt: 'desc' },
          take: 10
        }
      }
    });
  }

  // Forzar apagado de un parlante
  async forceShutdown(id: number) {
    const speaker = await this.prisma.speaker.findUnique({
      where: { id },
      include: {
        usageSessions: {
          where: { status: 'ACTIVE' }
        }
      }
    });

    if (!speaker) {
      throw new NotFoundException('Speaker not found');
    }

    const activeSessions = speaker.usageSessions;

    if (activeSessions.length === 0) {
      throw new BadRequestException('No active sessions to terminate');
    }

    const endTime = new Date();
    const results: { sessionId: number; status: string }[] = [];

    // Terminar todas las sesiones activas
    for (const session of activeSessions) {
      await this.prisma.usageSession.update({
        where: { id: session.id },
        data: {
          endTime,
          finalBatteryPercentage: speaker.batteryPercentage,
          status: 'INTERRUPTED'
        }
      });

      results.push({
        sessionId: session.id,
        status: 'terminated'
      });
    }

    // Apagar parlante
    await this.prisma.speaker.update({
      where: { id },
      data: { 
        state: false,
        updatedAt: new Date()
      }
    });

    return {
      message: `Speaker ${speaker.name} forced shutdown successfully`,
      terminatedSessions: results.length,
      sessions: results
    };
  }

  // Obtener estadísticas de batería
  async getBatteryStatistics() {
    const speakers = await this.prisma.speaker.findMany({
      select: {
        id: true,
        name: true,
        position: true,
        state: true,
        batteryPercentage: true
      }
    });

    const stats = {
      total: speakers.length,
      online: speakers.filter(s => s.state).length,
      offline: speakers.filter(s => !s.state).length,
      batteryLevels: {
        high: speakers.filter(s => Number(s.batteryPercentage) > 60).length,
        medium: speakers.filter(s => Number(s.batteryPercentage) <= 60 && Number(s.batteryPercentage) > 30).length,
        low: speakers.filter(s => Number(s.batteryPercentage) <= 30 && Number(s.batteryPercentage) > 10).length,
        critical: speakers.filter(s => Number(s.batteryPercentage) <= 10).length
      },
      averageBattery: speakers.length > 0 
        ? speakers.reduce((sum, s) => sum + Number(s.batteryPercentage), 0) / speakers.length
        : 0,
      speakers: speakers.map(s => ({
        ...s,
        batteryPercentage: Number(s.batteryPercentage),
        batteryStatus: this.getBatteryStatus(Number(s.batteryPercentage))
      }))
    };

    return stats;
  }

  // Método auxiliar para obtener estado de batería
  private getBatteryStatus(percentage: number): string {
    if (percentage > 60) return 'high';
    if (percentage > 30) return 'medium';
    if (percentage > 10) return 'low';
    return 'critical';
  }



  async updateBatteryLevel(id: number, batteryLevel: number) {
  const speaker = await this.prisma.speaker.findUnique({
    where: { id }
  });

  if (!speaker) {
    throw new NotFoundException('Speaker not found');
  }

  return await this.prisma.speaker.update({
    where: { id },
    data: {
      batteryPercentage: new Decimal(batteryLevel),
      updatedAt: new Date()
    }
  });
}

}