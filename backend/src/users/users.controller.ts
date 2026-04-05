import { Body, Controller, Delete, Get, Param, Patch } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayloadUser } from "../auth/interfaces/jwt-payload.interface";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UsersService } from "./users.service";
import { UpdateKycDto } from "./dto/update-kyc.dto";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles(Role.BANK, Role.CENTRAL_BANK)
  findAll() {
    return this.users.findAll();
  }

  @Get(":id")
  @Roles(Role.BANK, Role.CENTRAL_BANK, Role.COMPLIANCE, Role.USER)
  findOne(@Param("id") id: string, @CurrentUser() actor: JwtPayloadUser) {
    return this.users.findOne(id, actor.role, actor.sub);
  }

  @Patch(":id/kyc")
  @Roles(Role.BANK, Role.CENTRAL_BANK, Role.COMPLIANCE)
  updateKyc(@Param("id") id: string, @Body() dto: UpdateKycDto) {
    return this.users.updateKyc(id, dto);
  }

  @Delete(":id")
  @Roles(Role.BANK, Role.CENTRAL_BANK)
  deactivate(@Param("id") id: string) {
    return this.users.deactivate(id);
  }
}
