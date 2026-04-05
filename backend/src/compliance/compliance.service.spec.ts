import { Test, TestingModule } from "@nestjs/testing";
import { KYCStatus } from "@prisma/client";
import { ComplianceService } from "./compliance.service";
import { PrismaService } from "../prisma/prisma.service";
import { BlockchainService } from "../blockchain/blockchain.service";

describe("ComplianceService", () => {
  let service: ComplianceService;
  const prismaMock = {
    user: { findUnique: jest.fn() },
    blacklist: { findUnique: jest.fn() },
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
});
