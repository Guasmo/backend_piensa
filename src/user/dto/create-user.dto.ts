import { ApiProperty } from "@nestjs/swagger";
import { Role } from "generated/prisma";
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
  password: string;

  @ApiProperty()
  @IsEnum(Role)
  @IsOptional()
  role: Role;
}
