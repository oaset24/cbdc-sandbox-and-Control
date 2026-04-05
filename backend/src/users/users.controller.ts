import { Body, Controller, Delete, Get, Param, Patch } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayloadUser } from "../auth/interfaces/jwt-payload.interface";
import { UsersService } from "./users.service";
import { UpdateKycDto } from "./dto/update-kyc.dto";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles(Role.BANK, Role.CENTRAL_BANK)
  @ApiOperation({ summary: "Nutzerliste", description: "Alle Konten (Hausbank & Zentralbank)." })
  @ApiResponse({ status: 200, description: "Liste ohne Passwort-Hash" })
  findAll() {
    return this.users.findAll();
  }

  @Get(":id")
  @Roles(Role.BANK, Role.CENTRAL_BANK, Role.COMPLIANCE, Role.USER)
  @ApiOperation({ summary: "Nutzerdetails", description: "USER nur für das eigene Konto." })
  @ApiResponse({ status: 200, description: "Stammdaten" })
  @ApiResponse({ status: 403, description: "Kein Zugriff auf fremdes Konto" })
  findOne(@Param("id") id: string, @CurrentUser() actor: JwtPayloadUser) {
    return this.users.findOne(id, actor.role, actor.sub);
  }

  @Patch(":id/kyc")
  @Roles(Role.BANK, Role.CENTRAL_BANK, Role.COMPLIANCE)
  @ApiOperation({ summary: "KYC-Status setzen" })
  @ApiResponse({ status: 200, description: "Aktualisierter Nutzer (Auszug)" })
  updateKyc(@Param("id") id: string, @Body() dto: UpdateKycDto) {
    return this.users.updateKyc(id, dto);
  }

  @Delete(":id")
  @Roles(Role.BANK, Role.CENTRAL_BANK)
  @ApiOperation({ summary: "Nutzer deaktivieren" })
  @ApiResponse({ status: 200, description: "Bestätigung inkl. isActive" })
  deactivate(@Param("id") id: string) {
    return this.users.deactivate(id);
  }
}
