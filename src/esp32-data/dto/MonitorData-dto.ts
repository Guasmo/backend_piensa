import { IsInt, IsNumber, IsNotEmpty, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class MonitorDataDto {
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  sessionId: number;

  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  speakerId: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  timestamp: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  current_mA: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  voltage_V: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  power_mW: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsNotEmpty()
  @Type(() => Number)
  battery_remaining_percent: number;

  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  total_consumed_mAh: number;

  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  sample_index: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  avgCurrent_mA?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  avgVoltage_V?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  avgPower_mW?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  peakPower_mW?: number;

  @IsInt()
  @Min(5)
  @Max(30)
  @IsOptional()
  @Type(() => Number)
  currentVolume?: number;
}