import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
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
  transfer(@CurrentUser() user: JwtPayloadUser, @Body() dto: TransferDto) {
    return this.transactions.transfer(user.sub, dto);
  }

  @Get()
  @Roles(Role.CENTRAL_BANK, Role.BANK, Role.COMPLIANCE)
  findAll() {
    return this.transactions.findAll();
  }

  @Get("user/:id")
  @Roles(Role.USER, Role.BANK, Role.CENTRAL_BANK, Role.COMPLIANCE)
  findByUser(@Param("id") id: string, @CurrentUser() actor: JwtPayloadUser) {
    return this.transactions.findByUser(id, actor.sub, actor.role);
  }

  @Get(":id")
  @Roles(Role.CENTRAL_BANK, Role.BANK, Role.COMPLIANCE)
  findOne(@Param("id") id: string) {
    return this.transactions.findOne(id);
  }
}
