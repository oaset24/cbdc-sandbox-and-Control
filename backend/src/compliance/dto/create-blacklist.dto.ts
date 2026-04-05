import { ApiProperty } from "@nestjs/swagger";
import { IsEthereumAddress, IsString, MinLength } from "class-validator";

export class CreateBlacklistDto {
  @ApiProperty({ example: "0x0000000000000000000000000000000000000001", description: "Wallet-Adresse (wird normalisiert)" })
  @IsEthereumAddress()
  address!: string;

  @ApiProperty({ example: "Verdacht auf Betrug", description: "Freitext-Begründung (min. 3 Zeichen)" })
  @IsString()
  @MinLength(3)
  reason!: string;
}
