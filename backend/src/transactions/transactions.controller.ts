import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayloadUser } from "../auth/interfaces/jwt-payload.interface";
import { TransactionsService } from "./transactions.service";
import { TransferDto } from "./dto/transfer.dto";

@ApiTags("transactions")
@ApiBearerAuth()
@Controller("transactions")
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Post("transfer")
  @Roles(Role.USER)
  @ApiOperation({ summary: "CBDC-Transfer", description: "Custodial-Transfer nach Compliance-Prüfung." })
  @ApiResponse({ status: 200, description: "Transaktion angelegt" })
  @ApiResponse({ status: 400, description: "Compliance / Validierung" })
  transfer(@CurrentUser() user: JwtPayloadUser, @Body() dto: TransferDto) {
    return this.transactions.transfer(user.sub, dto);
  }

  @Get()
  @Roles(Role.CENTRAL_BANK, Role.BANK, Role.COMPLIANCE)
  @ApiOperation({ summary: "Alle Transaktionen" })
  @ApiResponse({ status: 200, description: "Liste mit Nutzer-Relation" })
  findAll() {
    return this.transactions.findAll();
  }

  @Get("user/:id")
  @Roles(Role.USER, Role.BANK, Role.CENTRAL_BANK, Role.COMPLIANCE)
  @ApiOperation({ summary: "Transaktionen eines Nutzers" })
  @ApiResponse({ status: 403, description: "USER ohne Berechtigung für fremde ID" })
  findByUser(@Param("id") id: string, @CurrentUser() actor: JwtPayloadUser) {
    return this.transactions.findByUser(id, actor.sub, actor.role);
  }

  @Get(":id")
  @Roles(Role.CENTRAL_BANK, Role.BANK, Role.COMPLIANCE)
  @ApiOperation({ summary: "Transaktionsdetail" })
  findOne(@Param("id") id: string) {
    return this.transactions.findOne(id);
  }
}
