import { ApiProperty } from "@nestjs/swagger";
import { IsEthereumAddress, IsString, Matches } from "class-validator";

export class ForceTransferDto {
  @ApiProperty()
  @IsEthereumAddress()
  from!: string;

  @ApiProperty()
  @IsEthereumAddress()
  to!: string;

  @ApiProperty({ example: "50" })
  @IsString()
  @Matches(/^\d+(\.\d+)?$/)
  amount!: string;
}
