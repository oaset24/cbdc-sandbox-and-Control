import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayloadUser } from "../auth/interfaces/jwt-payload.interface";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AdminService } from "./admin.service";
import { MintDto } from "./dto/mint.dto";
import { BurnDto } from "./dto/burn.dto";
import { ForceTransferDto } from "./dto/force-transfer.dto";

@ApiTags("admin")
@ApiBearerAuth()
@Controller("admin")
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Post("mint")
  @Roles(Role.CENTRAL_BANK)
  mint(@CurrentUser() actor: JwtPayloadUser, @Body() dto: MintDto) {
    return this.admin.mint(actor.sub, dto);
  }

  @Post("burn")
  @Roles(Role.CENTRAL_BANK)
  burn(@CurrentUser() actor: JwtPayloadUser, @Body() dto: BurnDto) {
    return this.admin.burn(actor.sub, dto);
  }

  @Post("freeze/:address")
  @Roles(Role.CENTRAL_BANK, Role.COMPLIANCE)
  freeze(@CurrentUser() actor: JwtPayloadUser, @Param("address") address: string) {
    return this.admin.freeze(actor.sub, address);
  }

  @Post("unfreeze/:address")
  @Roles(Role.CENTRAL_BANK, Role.COMPLIANCE)
  unfreeze(@CurrentUser() actor: JwtPayloadUser, @Param("address") address: string) {
    return this.admin.unfreeze(actor.sub, address);
  }

  @Post("force-transfer")
  @Roles(Role.CENTRAL_BANK)
  forceTransfer(@CurrentUser() actor: JwtPayloadUser, @Body() dto: ForceTransferDto) {
    return this.admin.forceTransfer(actor.sub, dto);
  }

  @Get("audit-logs")
  @Roles(Role.CENTRAL_BANK, Role.COMPLIANCE)
  auditLogs(@Query("skip") skip?: string, @Query("take") take?: string) {
    const s = skip ? Number.parseInt(skip, 10) : 0;
    const t = take ? Number.parseInt(take, 10) : 100;
    return this.admin.auditLogs(Number.isFinite(s) ? s : 0, Number.isFinite(t) ? t : 100);
  }

  @Get("system-stats")
  @Roles(Role.CENTRAL_BANK, Role.BANK)
  systemStats() {
    return this.admin.systemStats();
  }
}
