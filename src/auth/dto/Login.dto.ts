import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
    @ApiProperty({
        description: "The institutional email of the user",
		example: "john.doe@sudamericano.edu.ec",
    })
    @IsString()
    usernameOrEmail: string;

    @ApiProperty({
        description: "The password for the user account",
		example: "StrongP@ssw0rd",
    })
	@IsString()
	@IsNotEmpty()
    password: string;
}