import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Roles } from "../auth/decorators/roles.decorator";
import { AdminService } from "../admin/admin.service";

@ApiTags("dashboard")
@ApiBearerAuth()
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly admin: AdminService) {}

  @Get("system-stats")
  @Roles(Role.CENTRAL_BANK, Role.BANK)
  @ApiOperation({
    summary: "Dashboard-Systemstatistiken",
    description: "Empfohlener Endpunkt für Zentralbank- und Hausbank-Dashboard (ohne /admin-Pfad).",
  })
  @ApiResponse({ status: 200, description: "Kennzahlen, optional On-Chain totalSupply" })
  systemStats() {
    return this.admin.systemStats();
  }
}
