import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { TxStatus } from "@prisma/client";
import { TransactionsService } from "./transactions.service";
import { PrismaService } from "../prisma/prisma.service";
import { ComplianceService } from "../compliance/compliance.service";
import { BlockchainService } from "../blockchain/blockchain.service";

describe("TransactionsService", () => {
  let service: TransactionsService;
  const prismaMock = {
    user: { findUnique: jest.fn() },
    transaction: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
  };
  const complianceMock = {
    validateUserTransfer: jest.fn(),
    assertCustodialWalletMatchesUser: jest.fn(),
  };
  const blockchainMock = {
    isEnabled: jest.fn(),
    getBalance: jest.fn(),
    transferFromUserWallet: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ComplianceService, useValue: complianceMock },
        { provide: BlockchainService, useValue: blockchainMock },
      ],
    }).compile();
    service = module.get(TransactionsService);
  });

  it("transfer bricht bei Compliance-Fail ab", async () => {
    complianceMock.validateUserTransfer.mockResolvedValue({
      allowed: false,
      reasons: ["KYC-Status ist nicht VERIFIED"],
    });
    await expect(
      service.transfer("u1", { to: "0x2222222222222222222222222222222222222222", amount: "1" }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("transfer ohne Wallet-Adresse", async () => {
    complianceMock.validateUserTransfer.mockResolvedValue({ allowed: true, amlFlag: false });
    prismaMock.user.findUnique.mockResolvedValue({ walletAddress: null });
    await expect(
      service.transfer("u1", { to: "0x2222222222222222222222222222222222222222", amount: "1" }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("transfer nur DB wenn Blockchain aus", async () => {
    complianceMock.validateUserTransfer.mockResolvedValue({ allowed: true, amlFlag: false });
    prismaMock.user.findUnique.mockResolvedValue({
      walletAddress: "0x1111111111111111111111111111111111111111",
    });
    blockchainMock.isEnabled.mockReturnValue(false);
    prismaMock.transaction.create.mockResolvedValue({
      id: "t1",
      status: TxStatus.COMPLETED,
      flagged: false,
    });
    const r = await service.transfer("u1", {
      to: "0x2222222222222222222222222222222222222222",
      amount: "10",
    });
    expect(r.id).toBe("t1");
    expect(blockchainMock.transferFromUserWallet).not.toHaveBeenCalled();
  });

  it("findOne wirft NotFoundException", async () => {
    prismaMock.transaction.findUnique.mockResolvedValue(null);
    await expect(service.findOne("missing")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("findByUser verbietet fremde USER", async () => {
    await expect(service.findByUser("u2", "u1", "USER")).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("findByUser erlaubt BANK", async () => {
    prismaMock.transaction.findMany.mockResolvedValue([]);
    await expect(service.findByUser("u2", "u1", "BANK")).resolves.toEqual([]);
  });
});
