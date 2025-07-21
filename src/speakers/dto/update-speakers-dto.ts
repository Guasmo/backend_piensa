import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class UpdateSpeakerDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  position?: string;

  @IsOptional()
  @IsBoolean()
  state?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  batteryPercentage?: number;
}