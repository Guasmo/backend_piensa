import { IsInt, IsNumber, Min } from 'class-validator';

export class StartSessionDto {
  @IsInt()
  speakerId: number;

  @IsInt()
  userId: number;

  @IsNumber()
  @Min(0)
  batteryPercentage: number;
}