import { IsNumber, IsOptional, IsString, Min, Max, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

export class VolumeControlDto {
  @IsNumber()
  @IsInt()
  @Min(5, { message: 'El volumen mínimo es 5' })
  @Max(30, { message: 'El volumen máximo es 30' })
  @Transform(({ value }) => parseInt(value))
  volume: number;

  @IsOptional()
  @IsNumber()
  @IsInt()
  sessionId?: number;

  @IsOptional()
  @IsNumber()
  @IsInt()
  speakerId?: number;

  @IsOptional()
  @IsString()
  action?: 'set' | 'sync' | 'increase' | 'decrease';

  @IsOptional()
  @IsString()
  timestamp?: string;
}