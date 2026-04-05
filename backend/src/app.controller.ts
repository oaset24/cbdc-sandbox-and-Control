import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { Public } from "./auth/decorators/public.decorator";
import { AppService } from "./app.service";

@ApiTags("health")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @SkipThrottle()
  @Get()
  @ApiOperation({ summary: "Health-Check", description: "Öffentlich; ohne Rate-Limit." })
  @ApiResponse({ status: 200, description: "Status, Redis-Ping" })
  async health() {
    return this.appService.health();
  }
}
