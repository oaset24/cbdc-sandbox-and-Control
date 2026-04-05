import { ApiProperty } from "@nestjs/swagger";
import { IsEthereumAddress, IsString, Matches } from "class-validator";

export class MintDto {
  @ApiProperty()
  @IsEthereumAddress()
  to!: string;

  @ApiProperty({ example: "1000" })
  @IsString()
  @Matches(/^\d+(\.\d+)?$/)
  amount!: string;
}
