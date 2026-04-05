import { ApiProperty } from "@nestjs/swagger";
import { IsEthereumAddress, IsString, MinLength } from "class-validator";

export class CreateBlacklistDto {
  @ApiProperty({ example: "0x0000000000000000000000000000000000000001" })
  @IsEthereumAddress()
  address!: string;

  @ApiProperty({ example: "Verdacht auf Betrug" })
  @IsString()
  @MinLength(3)
  reason!: string;
}
