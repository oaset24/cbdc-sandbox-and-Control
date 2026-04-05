import { Test, TestingModule } from "@nestjs/testing";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Role, KYCStatus } from "@prisma/client";
import { UsersService } from "./users.service";
import { PrismaService } from "../prisma/prisma.service";

describe("UsersService", () => {
  let service: UsersService;
  const prismaMock = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get(UsersService);
  });

  it("findAll delegiert an Prisma", async () => {
    prismaMock.user.findMany.mockResolvedValue([]);
    await expect(service.findAll()).resolves.toEqual([]);
  });

  it("findOne wirft NotFoundException", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(service.findOne("id", Role.CENTRAL_BANK, "x")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("findOne verbietet USER fremde IDs", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "other",
      email: "x@y.de",
      role: Role.USER,
      kycStatus: KYCStatus.PENDING,
      walletAddress: null,
      isActive: true,
      createdAt: new Date(),
    });
    await expect(service.findOne("other", Role.USER, "self")).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("updateKyc aktualisiert Status", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "u" });
    prismaMock.user.update.mockResolvedValue({
      id: "u",
      email: "e@e.de",
      kycStatus: KYCStatus.VERIFIED,
    });
    const r = await service.updateKyc("u", { status: KYCStatus.VERIFIED });
    expect(r.kycStatus).toBe(KYCStatus.VERIFIED);
  });

  it("deactivate setzt isActive false", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "u" });
    prismaMock.user.update.mockResolvedValue({ id: "u", email: "e@e.de", isActive: false });
    const r = await service.deactivate("u");
    expect(r.isActive).toBe(false);
  });
});
