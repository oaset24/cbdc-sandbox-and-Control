import { ArgumentMetadata, ValidationPipe } from "@nestjs/common";
import { MintDto } from "./mint.dto";

describe("MintDto + ValidationPipe (globale Regeln)", () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  });

  const meta: ArgumentMetadata = { type: "body", metatype: MintDto, data: "" };

  it("akzeptiert gültige Mint-Payload", async () => {
    const out = await pipe.transform(
      { to: "0x1111111111111111111111111111111111111111", amount: "1000.5" },
      meta,
    );
    expect(out).toMatchObject({
      to: "0x1111111111111111111111111111111111111111",
      amount: "1000.5",
    });
  });

  it("lehnt unbekannte Felder ab (forbidNonWhitelisted)", async () => {
    await expect(
      pipe.transform(
        { to: "0x1111111111111111111111111111111111111111", amount: "1", extra: "hack" },
        meta,
      ),
    ).rejects.toThrow();
  });
});
