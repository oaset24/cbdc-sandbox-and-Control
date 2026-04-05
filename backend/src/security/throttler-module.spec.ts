import { Test } from "@nestjs/testing";
import { ThrottlerModule } from "@nestjs/throttler";

describe("ThrottlerModule (Rate Limit)", () => {
  it("kompiliert mit 100 Anfragen / 60 s wie in AppModule", async () => {
    const mod = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [{ ttl: 60_000, limit: 100 }],
        }),
      ],
    }).compile();
    expect(mod).toBeDefined();
  });
});
