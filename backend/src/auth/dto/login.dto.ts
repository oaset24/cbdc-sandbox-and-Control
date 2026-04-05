import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "centralbank@cbdc.gov", description: "Registrierte E-Mail-Adresse" })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: "Klartext-Passwort (TLS im Produktivbetrieb voraussetzen)" })
  @IsString()
  @MinLength(1)
  password!: string;
}
