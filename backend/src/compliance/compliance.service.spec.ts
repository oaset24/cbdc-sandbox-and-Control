import { Test, TestingModule } from "@nestjs/testing";
import { KYCStatus } from "@prisma/client";
import { ComplianceService } from "./compliance.service";
import { PrismaService } from "../prisma/prisma.service";
import { BlockchainService } from "../blockchain/blockchain.service";

describe("ComplianceService", () => {
  let service: ComplianceService;
  const prismaMock = {
    user: { findUnique: jest.fn(), findMany: jest.fn() },
    blacklist: { findUnique: jest.fn() },
    transaction: { findMany: jest.fn() },
  };
  const blockchainMock = {
    isEnabled: jest.fn(),
    isFrozen: jest.fn(),
    getTransactionLimitWei: jest.fn(),
    getDailyLimitWei: jest.fn(),
    getUserWalletAddress: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplianceService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: BlockchainService, useValue: blockchainMock },
      ],
    }).compile();
    service = module.get(ComplianceService);
  });

  it("lehnt ab bei nicht verifiziertem KYC", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      isActive: true,
      kycStatus: KYCStatus.PENDING,
      walletAddress: "0x1234567890123456789012345678901234567890",
    });
    const r = await service.validateUserTransfer("u1", "0x2222222222222222222222222222222222222222", "10");
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.reasons.length).toBeGreaterThan(0);
  });

  it("setzt amlFlag bei Betrag über 10.000", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      isActive: true,
      kycStatus: KYCStatus.VERIFIED,
      walletAddress: "0x1234567890123456789012345678901234567890",
    });
    prismaMock.blacklist.findUnique.mockResolvedValue(null);
    blockchainMock.isEnabled.mockReturnValue(false);
    const r = await service.validateUserTransfer("u1", "0x2222222222222222222222222222222222222222", "10001");
    expect(r.allowed).toBe(true);
    if (r.allowed) expect(r.amlFlag).toBe(true);
  });

  it("Randfall: inaktiver Nutzer", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const r = await service.validateUserTransfer("missing", "0x2222222222222222222222222222222222222222", "1");
    expect(r.allowed).toBe(false);
  });

  it("accountMonitor markiert geflaggte Nutzer und on-chain Freeze", async () => {
    prismaMock.user.findMany.mockResolvedValue([
      {
        id: "u1",
        email: "a@x.de",
        role: "USER",
        kycStatus: "VERIFIED",
        walletAddress: "0x1111111111111111111111111111111111111111",
        isActive: true,
        createdAt: new Date(),
      },
    ]);
    prismaMock.transaction.findMany.mockResolvedValue([{ userId: "u1" }]);
    blockchainMock.isEnabled.mockReturnValue(true);
    blockchainMock.isFrozen.mockResolvedValue(true);
    const rows = await service.accountMonitor();
    expect(rows).toHaveLength(1);
    expect(rows[0].hasFlaggedActivity).toBe(true);
    expect(rows[0].isOnChainFrozen).toBe(true);
  });
});
