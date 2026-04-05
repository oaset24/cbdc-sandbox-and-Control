import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { PrismaService } from "../prisma/prisma.service";
import { BlockchainService } from "../blockchain/blockchain.service";

describe("AdminService", () => {
  let service: AdminService;
  const prismaMock = {
    auditLog: { create: jest.fn() },
    user: { count: jest.fn() },
    transaction: { count: jest.fn(), aggregate: jest.fn() },
    blacklist: { count: jest.fn() },
  };
  const blockchainMock = {
    isEnabled: jest.fn(),
    mint: jest.fn(),
    burn: jest.fn(),
    freezeAccount: jest.fn(),
    unfreezeAccount: jest.fn(),
    forceTransfer: jest.fn(),
    getTotalSupply: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: BlockchainService, useValue: blockchainMock },
      ],
    }).compile();
    service = module.get(AdminService);
  });

  it("mint ohne Blockchain wirft BadRequestException", async () => {
    blockchainMock.isEnabled.mockReturnValue(false);
    await expect(
      service.mint("a1", { to: "0x1111111111111111111111111111111111111111", amount: "1" }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("mint mit Blockchain schreibt AuditLog", async () => {
    blockchainMock.isEnabled.mockReturnValue(true);
    blockchainMock.mint.mockResolvedValue("0xhash");
    prismaMock.auditLog.create.mockResolvedValue({});
    const r = await service.mint("a1", { to: "0x1111111111111111111111111111111111111111", amount: "10" });
    expect(r.txHash).toBe("0xhash");
    expect(prismaMock.auditLog.create).toHaveBeenCalled();
  });

  it("systemStats aggregiert Prisma (Reihenfolge der user.count-Aufrufe)", async () => {
    blockchainMock.isEnabled.mockReturnValue(false);
    prismaMock.user.count
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2);
    prismaMock.transaction.count.mockResolvedValue(20);
    prismaMock.transaction.aggregate.mockResolvedValue({ _sum: { amount: 1000 } });
    prismaMock.blacklist.count.mockResolvedValue(1);

    const stats = await service.systemStats();
    expect(stats.userCount).toBe(5);
    expect(stats.activeUsers).toBe(4);
    expect(stats.transactionCount).toBe(20);
    expect(stats.totalVolume).toBe(1000);
    expect(stats.blacklistCount).toBe(1);
    expect(stats.pendingKycUsers).toBe(2);
    expect(stats.totalSupplyWei).toBeNull();
  });
});
