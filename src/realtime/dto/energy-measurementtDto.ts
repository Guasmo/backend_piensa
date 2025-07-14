import { IsInt, IsNumber, Min } from 'class-validator';

export class EnergyMeasurementDto {
  @IsInt()
  speakerId: number;

  @IsNumber()
  voltageHours: number;

  @IsNumber()
  wattsHours: number;

  @IsNumber()
  ampereHours: number;

  @IsNumber()
  @Min(0)
  batteryPercentage: number;
}