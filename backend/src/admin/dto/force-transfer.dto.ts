import { ApiProperty } from "@nestjs/swagger";
import { IsEthereumAddress, IsString, Matches } from "class-validator";

export class ForceTransferDto {
  @ApiProperty({ description: "Quell-Wallet" })
  @IsEthereumAddress()
  from!: string;

  @ApiProperty({ description: "Ziel-Wallet" })
  @IsEthereumAddress()
  to!: string;

  @ApiProperty({ example: "50", description: "Betrag in CBDC" })
  @IsString()
  @Matches(/^\d+(\.\d+)?$/)
  amount!: string;
}
