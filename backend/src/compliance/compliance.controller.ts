import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayloadUser } from "../auth/interfaces/jwt-payload.interface";
import { PrismaService } from "../prisma/prisma.service";
import { ComplianceService } from "./compliance.service";
import { CreateBlacklistDto } from "./dto/create-blacklist.dto";

@ApiTags("compliance")
@ApiBearerAuth()
@Controller("compliance")
export class ComplianceController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly compliance: ComplianceService,
  ) {}

  @Get("monitor-accounts")
  @Roles(Role.COMPLIANCE, Role.CENTRAL_BANK)
  @ApiOperation({
    summary: "Compliance-Monitor",
    description:
      "Alle Nutzer mit Kennzeichnung: mindestens eine geflaggte Transaktion (hasFlaggedActivity) und/oder on-chain eingefrorene Wallet.",
  })
  @ApiResponse({ status: 200, description: "Liste mit Risiko-Flags pro Konto" })
  async monitorAccounts() {
    return this.compliance.accountMonitor();
  }

  @Get("flagged")
  @Roles(Role.COMPLIANCE, Role.CENTRAL_BANK)
  @ApiOperation({ summary: "Geflaggte Transaktionen", description: "Transaktionen mit Flag oder Status FLAGGED." })
  @ApiResponse({ status: 200, description: "Liste der Vorgänge inkl. Nutzer-Stammdaten" })
  async flagged() {
    return this.prisma.transaction.findMany({
      where: { OR: [{ flagged: true }, { status: "FLAGGED" }] },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, email: true, role: true } } },
    });
  }

  @Post("blacklist")
  @Roles(Role.COMPLIANCE, Role.CENTRAL_BANK)
  @ApiOperation({ summary: "Blacklist-Eintrag anlegen/aktualisieren" })
  @ApiResponse({ status: 200, description: "Gespeicherter Eintrag" })
  async addBlacklist(@Body() dto: CreateBlacklistDto, @CurrentUser() actor: JwtPayloadUser) {
    const address = dto.address.toLowerCase();
    return this.prisma.blacklist.upsert({
      where: { address },
      create: {
        address,
        reason: dto.reason,
        addedBy: actor.sub,
      },
      update: {
        reason: dto.reason,
        addedBy: actor.sub,
      },
    });
  }

  @Get("blacklist")
  @Roles(Role.COMPLIANCE, Role.CENTRAL_BANK, Role.BANK)
  @ApiOperation({ summary: "Blacklist auflisten" })
  @ApiResponse({ status: 200, description: "Alle Einträge" })
  async listBlacklist() {
    return this.prisma.blacklist.findMany({ orderBy: { createdAt: "desc" } });
  }

  @Get("report")
  @Roles(Role.COMPLIANCE, Role.CENTRAL_BANK)
  @ApiOperation({ summary: "Compliance-Kennzahlen", description: "Aggregierte Zahlen und letzte geflaggte Transaktionen." })
  @ApiResponse({ status: 200, description: "Report-Objekt" })
  async report() {
    const [flaggedCount, blacklistCount, pendingKyc] = await Promise.all([
      this.prisma.transaction.count({ where: { OR: [{ flagged: true }, { status: "FLAGGED" }] } }),
      this.prisma.blacklist.count(),
      this.prisma.user.count({ where: { kycStatus: "PENDING" } }),
    ]);
    const lastFlagged = await this.prisma.transaction.findMany({
      where: { flagged: true },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, amount: true, from: true, to: true, createdAt: true, purpose: true },
    });
    return {
      flaggedTransactionCount: flaggedCount,
      blacklistEntryCount: blacklistCount,
      pendingKycUsers: pendingKyc,
      recentFlagged: lastFlagged,
    };
  }
}
