import { 
    IsInt, 
    IsNotEmpty, 
    IsNumber, 
    IsOptional, 
    Max, 
    Min 
} from "class-validator";

// DTOs con validaciones
export class Esp32DataDto {
  @IsNumber()
  @IsNotEmpty()
  timestamp: number;        // Tiempo desde inicio en segundos

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  current_mA: number;       // Corriente en mA

  @IsOptional()
  @IsNumber()
  @Min(0)
  voltage_V?: number;       // Voltaje en V (opcional)

  @IsOptional()
  @IsNumber()
  @Min(0)
  power_mW?: number;        // Potencia en mW (opcional)

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  total_consumed_mAh: number; // Total consumido en mAh

  @IsInt()
  @IsNotEmpty()
  @Min(0)
  sample_index: number;     // Índice de muestra

  @IsNumber()
  @Min(0)
  @Max(100)
  battery_remaining_percent: number; // Porcentaje de batería restante

  @IsOptional()
  @IsInt()
  @Min(1)
  speaker_id?: number;      // ID del parlante (opcional)

  @IsOptional()
  @IsInt()
  @Min(1)
  usage_session_id?: number; // ID de sesión de uso (opcional)
}
