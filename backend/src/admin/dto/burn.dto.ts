import { ApiProperty } from "@nestjs/swagger";
import { IsEthereumAddress, IsString, Matches } from "class-validator";

export class BurnDto {
  @ApiProperty()
  @IsEthereumAddress()
  from!: string;

  @ApiProperty({ example: "100" })
  @IsString()
  @Matches(/^\d+(\.\d+)?$/)
  amount!: string;
}
