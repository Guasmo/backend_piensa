import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { Esp32DataService } from './esp32-data.service';

export interface Esp32DataDto {
  timestamp: number;        // Tiempo desde inicio en segundos
  current_mA: number;       // Corriente en mA
  voltage_V?: number;       // Voltaje en V (opcional)
  power_mW?: number;        // Potencia en mW (opcional)
  total_consumed_mAh: number; // Total consumido en mAh
  sample_index: number;     // Índice de muestra
  battery_remaining_percent: number; // Porcentaje de batería restante
  speaker_id?: number;      // ID del parlante (opcional)
  usage_session_id?: number; // ID de sesión de uso (opcional)
}

@Controller('esp32-data')
export class Esp32DataController {
  constructor(private readonly esp32DataService: Esp32DataService) {}

  // Endpoint para recibir datos del ESP32
  @Post('energy-measurement')
  async receiveEnergyData(@Body() data: Esp32DataDto) {
    try {
      const result = await this.esp32DataService.saveEnergyMeasurement(data);
      return {
        success: true,
        message: 'Data received successfully',
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error saving data',
        error: error.message
      };
    }
  }

  // Endpoint para iniciar una sesión de uso
  @Post('start-session')
  async startUsageSession(@Body() data: { 
    speakerId: number, 
    userId: number,
    initialBatteryPercentage: number 
  }) {
    try {
      const session = await this.esp32DataService.startUsageSession(
        data.speakerId,
        data.userId,
        data.initialBatteryPercentage
      );
      return {
        success: true,
        session
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Endpoint para terminar una sesión de uso
  @Post('end-session/:sessionId')
  async endUsageSession(
    @Param('sessionId') sessionId: string,
    @Body() data: { finalBatteryPercentage: number }
  ) {
    try {
      const result = await this.esp32DataService.endUsageSession(
        parseInt(sessionId),
        data.finalBatteryPercentage
      );
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Endpoint para obtener datos en tiempo real
  @Get('current-session/:sessionId')
  async getCurrentSessionData(@Param('sessionId') sessionId: string) {
    try {
      const data = await this.esp32DataService.getCurrentSessionData(parseInt(sessionId));
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}