import { IsInt, IsNotEmpty, IsNumber, Min, Max, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class StartSessionDto {
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  speakerId: number;

  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  userId: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsNotEmpty()
  @Type(() => Number)
  initialBatteryPercentage: number;

  @IsString()
  @IsOptional()
  mode?: string;

  @IsInt()
  @Min(5)
  @Max(30)
  @IsOptional()
  @Type(() => Number)
  initialVolume?: number;
}