import { 
    IsInt, 
    IsNotEmpty, 
    IsNumber, 
    IsOptional, 
    Max, 
    Min 
} from "class-validator";

// DTO ajustado para coincidir con los datos del ESP32
export class Esp32DataDto {
  @IsNumber()
  @IsNotEmpty()
  timestamp: number;        // Tiempo desde inicio en segundos

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  current_mA: number;       // Corriente en mA

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  voltage_V: number;        // Voltaje en V

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  power_mW: number;         // Potencia en mW

  @IsNumber()
  @Min(0)
  @Max(100)
  battery_remaining_percent: number; // Porcentaje de batería restante

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  speaker_id: number;       // ID del parlante

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  usage_session_id: number; // ID de sesión de uso

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  total_consumed_mAh: number; // Total consumido en mAh

  @IsInt()
  @IsNotEmpty()
  @Min(0)
  sample_index: number;     // Índice de muestra
}