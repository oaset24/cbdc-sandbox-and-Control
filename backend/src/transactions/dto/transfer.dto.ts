import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEthereumAddress, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class TransferDto {
  @ApiProperty({ description: "Empfänger (Checksumme oder Lowercase)" })
  @IsEthereumAddress()
  to!: string;

  @ApiProperty({ example: "100.5", description: "Betrag in CBDC (Ether-Einheiten)" })
  @IsString()
  @Matches(/^\d+(\.\d+)?$/, { message: "amount muss eine positive Dezimalzahl sein" })
  amount!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(0)
  purpose?: string;
}
