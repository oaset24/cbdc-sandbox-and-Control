import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "user@example.com", description: "Eindeutige E-Mail; Rolle wird immer USER" })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, example: "SecurePass1", description: "Mindestens 8 Zeichen" })
  @IsString()
  @MinLength(8)
  password!: string;
}
