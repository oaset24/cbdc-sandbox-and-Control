import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { Public } from "./decorators/public.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";
import type { JwtPayloadUser } from "./interfaces/jwt-payload.interface";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Registrierung", description: "Legt einen neuen Nutzer mit Rolle USER an." })
  @ApiResponse({ status: 200, description: "Nutzer angelegt (ohne Passwort)" })
  @ApiResponse({ status: 409, description: "E-Mail bereits vergeben" })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post("login")
  @ApiOperation({ summary: "Anmeldung", description: "Liefert JWT (Bearer) und Nutzerprofil." })
  @ApiResponse({ status: 200, description: "access_token + user" })
  @ApiResponse({ status: 401, description: "Ungültige Zugangsdaten" })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @ApiBearerAuth()
  @Get("me")
  @ApiOperation({ summary: "Aktuelles Profil" })
  @ApiResponse({ status: 200, description: "Nutzer inkl. Rolle und KYC" })
  @ApiResponse({ status: 401, description: "Token fehlt oder ungültig" })
  me(@CurrentUser() user: JwtPayloadUser) {
    return this.auth.me(user.sub);
  }
}
