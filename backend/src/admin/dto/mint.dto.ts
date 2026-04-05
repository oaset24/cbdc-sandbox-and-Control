import { ApiProperty } from "@nestjs/swagger";
import { IsEthereumAddress, IsString, Matches } from "class-validator";

export class MintDto {
  @ApiProperty({ description: "Ziel-Wallet (Ethereum-Adresse)" })
  @IsEthereumAddress()
  to!: string;

  @ApiProperty({ example: "1000", description: "Betrag in CBDC (dezimal, Punkt als Trenner)" })
  @IsString()
  @Matches(/^\d+(\.\d+)?$/)
  amount!: string;
}
