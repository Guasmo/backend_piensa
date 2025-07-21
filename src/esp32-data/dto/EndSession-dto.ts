import { 
    IsNumber, 
    Max, 
    Min 
} from "class-validator";

export class EndSessionDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  finalBatteryPercentage: number;
}