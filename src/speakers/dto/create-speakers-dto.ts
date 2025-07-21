import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateSpeakerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  position: string;

  @IsOptional()
  @IsBoolean()
  state?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  batteryPercentage?: number;
}