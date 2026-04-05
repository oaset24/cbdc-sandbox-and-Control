import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "./redis.service";

describe("RedisService", () => {
  it("getHealthStatus ist disabled ohne REDIS_URL", async () => {
    const config = { get: jest.fn().mockReturnValue(undefined) };
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [RedisService, { provide: ConfigService, useValue: config }],
    }).compile();
    const service = moduleRef.get(RedisService);
    await service.onModuleInit();
    await expect(service.getHealthStatus()).resolves.toBe("disabled");
    await service.onModuleDestroy();
  });
});
