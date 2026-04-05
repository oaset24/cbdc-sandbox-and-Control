import { ApiProperty } from "@nestjs/swagger";
import { IsEthereumAddress, IsString, Matches } from "class-validator";

export class BurnDto {
  @ApiProperty({ description: "Wallet, von der Token verbrannt werden" })
  @IsEthereumAddress()
  from!: string;

  @ApiProperty({ example: "100", description: "Betrag in CBDC" })
  @IsString()
  @Matches(/^\d+(\.\d+)?$/)
  amount!: string;
}
