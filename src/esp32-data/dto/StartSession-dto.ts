import { 
    IsInt, 
    IsNotEmpty, 
    IsNumber, 
    Max, 
    Min 
} from "class-validator";

export class StartSessionDto {
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  speakerId: number;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  userId: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  initialBatteryPercentage: number;
}
