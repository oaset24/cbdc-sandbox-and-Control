import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

export type RedisHealthStatus = "connected" | "disabled" | "error";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.config.get<string>("REDIS_URL");
    if (!url) {
      this.logger.warn("REDIS_URL nicht gesetzt — Redis wird übersprungen.");
      return;
    }
    try {
      this.client = new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: true });
      await this.client.connect();
      await this.client.ping();
      this.logger.log("Redis verbunden.");
    } catch (err) {
      this.logger.error("Redis-Verbindung fehlgeschlagen", err);
      this.client?.disconnect();
      this.client = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  async getHealthStatus(): Promise<RedisHealthStatus> {
    const url = this.config.get<string>("REDIS_URL");
    if (!url) return "disabled";
    if (!this.client) return "error";
    try {
      const r = await this.client.ping();
      return r === "PONG" ? "connected" : "error";
    } catch {
      return "error";
    }
  }
}
