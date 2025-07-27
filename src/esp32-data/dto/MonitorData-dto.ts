import { 
    IsInt, 
    IsNotEmpty, 
    IsNumber, 
    IsOptional, 
    Max, 
    Min 
} from "class-validator";

export class MonitorDataDto {
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  sessionId: number;                    // ID de sesión activa

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  speakerId: number;                    // ID del parlante

  @IsNumber()
  @IsNotEmpty()
  timestamp: number;                    // Tiempo desde inicio en segundos

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  current_mA: number;                   // Corriente en mA

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  voltage_V: number;                    // Voltaje en V

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  power_mW: number;                     // Potencia en mW

  @IsNumber()
  @Min(0)
  @Max(100)
  battery_remaining_percent: number;    // Porcentaje de batería restante

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  total_consumed_mAh: number;           // Total consumido en mAh

  @IsInt()
  @IsNotEmpty()
  @Min(0)
  sample_index: number;                 // Índice de muestra

  // Estadísticas calculadas opcionales (desde ESP32)
  @IsNumber()
  @IsOptional()
  @Min(0)
  avgCurrent_mA?: number;               // Corriente promedio

  @IsNumber()
  @IsOptional()
  @Min(0)
  avgVoltage_V?: number;                // Voltaje promedio

  @IsNumber()
  @IsOptional()
  @Min(0)
  avgPower_mW?: number;                 // Potencia promedio

  @IsNumber()
  @IsOptional()
  @Min(0)
  peakPower_mW?: number;                // Pico de potencia
}