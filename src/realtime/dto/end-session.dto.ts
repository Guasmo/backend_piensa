import { IsInt, IsNumber, Min } from 'class-validator';

export class EndSessionDto {
  @IsInt()
  speakerId: number;

  @IsNumber()
  @Min(0)
  batteryPercentage: number;
}