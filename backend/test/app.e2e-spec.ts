import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppController } from "../src/app.controller";
import { AppService } from "../src/app.service";
import { RedisService } from "../src/redis/redis.service";

/** Schlanke E2E ohne DB/Blockchain – volle App siehe manuell mit DATABASE_URL & JWT_SECRET. */
describe("Health (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: RedisService, useValue: { getHealthStatus: async () => "connected" as const } },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("GET / liefert Health-JSON", () => {
    return request(app.getHttpServer())
      .get("/")
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({ status: "ok", service: "cbdc-backend", redis: "connected" });
      });
  });
});
