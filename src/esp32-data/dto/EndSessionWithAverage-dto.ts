import { 
    IsNumber, 
    IsOptional,
    IsInt,
    IsString,
    Max, 
    Min 
} from "class-validator";

export class EndSessionDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  finalBatteryPercentage: number;

  // Datos adicionales que envía el ESP32
  @IsInt()
  @IsOptional()
  @Min(0)
  totalMeasurementsSent?: number;       // Total de mediciones enviadas

  @IsNumber()
  @IsOptional()
  @Min(0)
  totalConsumed_mAh?: number;           // Total consumido en mAh

  @IsInt()
  @IsOptional()
  @Min(0)
  sessionDurationSeconds?: number;      // Duración reportada por ESP32

  @IsString()
  @IsOptional()
  mode?: string;                        // "realtime"
}