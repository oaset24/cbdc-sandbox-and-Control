import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { RedisService } from "./redis/redis.service";

describe("AppController", () => {
  let appController: AppController;
  const redisMock = { getHealthStatus: jest.fn().mockResolvedValue("connected" as const) };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: RedisService, useValue: redisMock }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe("root", () => {
    it("should return health payload with redis status", async () => {
      await expect(appController.health()).resolves.toEqual({
        status: "ok",
        service: "cbdc-backend",
        redis: "connected",
      });
    });
  });
});
