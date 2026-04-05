import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { KYCStatus } from "@prisma/client";

export class UpdateKycDto {
  @ApiProperty({ enum: KYCStatus, description: "Neuer KYC-Status für das Konto" })
  @IsEnum(KYCStatus)
  status!: KYCStatus;
}
