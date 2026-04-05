import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayloadUser } from "../auth/interfaces/jwt-payload.interface";
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
  @ApiOperation({ summary: "Token minten", description: "On-Chain Mint durch Zentralbank; schreibt Audit-Log." })
  @ApiResponse({ status: 200, description: "Transaktions-Hash" })
  @ApiResponse({ status: 400, description: "Blockchain nicht konfiguriert oder ungültige Eingabe" })
  mint(@CurrentUser() actor: JwtPayloadUser, @Body() dto: MintDto) {
    return this.admin.mint(actor.sub, dto);
  }

  @Post("burn")
  @Roles(Role.CENTRAL_BANK)
  @ApiOperation({ summary: "Token verbrennen" })
  @ApiResponse({ status: 200, description: "Transaktions-Hash" })
  burn(@CurrentUser() actor: JwtPayloadUser, @Body() dto: BurnDto) {
    return this.admin.burn(actor.sub, dto);
  }

  @Post("freeze/:address")
  @Roles(Role.CENTRAL_BANK, Role.COMPLIANCE)
  @ApiOperation({ summary: "Wallet on-chain einfrieren" })
  @ApiResponse({ status: 200, description: "Transaktions-Hash" })
  freeze(@CurrentUser() actor: JwtPayloadUser, @Param("address") address: string) {
    return this.admin.freeze(actor.sub, address);
  }

  @Post("unfreeze/:address")
  @Roles(Role.CENTRAL_BANK, Role.COMPLIANCE)
  @ApiOperation({ summary: "Wallet on-chain freigeben" })
  @ApiResponse({ status: 200, description: "Transaktions-Hash" })
  unfreeze(@CurrentUser() actor: JwtPayloadUser, @Param("address") address: string) {
    return this.admin.unfreeze(actor.sub, address);
  }

  @Post("force-transfer")
  @Roles(Role.CENTRAL_BANK)
  @ApiOperation({ summary: "Zwangsüberweisung (on-chain)" })
  @ApiResponse({ status: 200, description: "Transaktions-Hash" })
  forceTransfer(@CurrentUser() actor: JwtPayloadUser, @Body() dto: ForceTransferDto) {
    return this.admin.forceTransfer(actor.sub, dto);
  }

  @Get("audit-logs")
  @Roles(Role.CENTRAL_BANK, Role.COMPLIANCE)
  @ApiOperation({ summary: "Audit-Log lesen", description: "Paginierung über skip/take (Query)." })
  @ApiResponse({ status: 200, description: "Chronologische Audit-Einträge" })
  auditLogs(@Query("skip") skip?: string, @Query("take") take?: string) {
    const s = skip ? Number.parseInt(skip, 10) : 0;
    const t = take ? Number.parseInt(take, 10) : 100;
    return this.admin.auditLogs(Number.isFinite(s) ? s : 0, Number.isFinite(t) ? t : 100);
  }

  /** Gleiche Daten wie GET /dashboard/system-stats (ältere Clients / Doku). */
  @Get("system-stats")
  @Roles(Role.CENTRAL_BANK, Role.BANK)
  @ApiOperation({ summary: "Systemstatistiken (Legacy-Pfad)", description: "Identisch zu GET /dashboard/system-stats." })
  @ApiResponse({ status: 200, description: "Kennzahlen inkl. optional totalSupplyWei" })
  systemStats() {
    return this.admin.systemStats();
  }
}
