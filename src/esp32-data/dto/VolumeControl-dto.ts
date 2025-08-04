import { IsInt, IsNotEmpty, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class VolumeControlDto {
  @IsInt()
  @Min(5)
  @Max(30)
  @IsNotEmpty()
  @Type(() => Number)
  volume: number;

  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  speakerId: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  sessionId?: number;

  @IsString()
  @IsOptional()
  timestamp?: string;

  @IsString()
  @IsOptional()
  action?: 'set' | 'increase' | 'decrease' | 'sync';
}

export class VolumeResponseDto {
  success: boolean;
  message?: string;
  previousVolume?: number;
  newVolume: number;
  speakerId: number;
  timestamp: string;
  error?: string;
}