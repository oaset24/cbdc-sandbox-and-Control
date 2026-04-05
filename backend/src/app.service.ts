import { Injectable } from "@nestjs/common";
import { RedisService } from "./redis/redis.service";

@Injectable()
export class AppService {
  constructor(private readonly redis: RedisService) {}

  async health() {
    const redis = await this.redis.getHealthStatus();
    return { status: "ok" as const, service: "cbdc-backend", redis };
  }
}
