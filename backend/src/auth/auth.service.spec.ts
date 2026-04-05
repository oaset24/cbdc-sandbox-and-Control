import { Test, TestingModule } from "@nestjs/testing";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { Role, KYCStatus } from "@prisma/client";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";

describe("AuthService", () => {
  let service: AuthService;
  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({ JWT_SECRET: "unit_test_jwt_secret_key_min_32_chars" })],
        }),
        JwtModule.register({
          secret: "unit_test_jwt_secret_key_min_32_chars",
          signOptions: { expiresIn: "1h" },
        }),
      ],
      providers: [AuthService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get(AuthService);
  });

  it("register wirft ConflictException bei doppelter E-Mail", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "x" });
    await expect(service.register({ email: "a@b.de", password: "password12" })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it("register legt USER an", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "u1",
      email: "n@b.de",
      role: Role.USER,
      kycStatus: KYCStatus.PENDING,
      createdAt: new Date(),
    });
    const r = await service.register({ email: "n@b.de", password: "password12" });
    expect(r.email).toBe("n@b.de");
    expect(prismaMock.user.create).toHaveBeenCalled();
  });

  it("login wirft bei falschem Passwort", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "a@b.de",
      password: await bcrypt.hash("richtig", 4),
      isActive: true,
      role: Role.USER,
      kycStatus: KYCStatus.PENDING,
      walletAddress: null,
    });
    await expect(service.login({ email: "a@b.de", password: "falsch" })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("login liefert access_token", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "a@b.de",
      password: await bcrypt.hash("secret1234", 4),
      isActive: true,
      role: Role.USER,
      kycStatus: KYCStatus.VERIFIED,
      walletAddress: "0x1234567890123456789012345678901234567890",
    });
    const r = await service.login({ email: "a@b.de", password: "secret1234" });
    expect(r.access_token).toBeDefined();
    expect(r.user.email).toBe("a@b.de");
  });

  it("me wirft ohne Nutzer", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(service.me("missing")).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
