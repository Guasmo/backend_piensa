import { ApiProperty } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { 
  IsEmail, 
  IsEnum, 
  IsOptional, 
  IsString 
} from "class-validator";

export class CreateUserDto {
  @ApiProperty()
	@IsString()
  username: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString() 
  phone?: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiProperty()
  @IsEnum(Role)
  @IsOptional()
  role: Role;
}
