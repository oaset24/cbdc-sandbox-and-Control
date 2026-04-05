import { Test, TestingModule } from "@nestjs/testing";
import { ComplianceController } from "./compliance.controller";
import { PrismaService } from "../prisma/prisma.service";
import { ComplianceService } from "./compliance.service";

describe("ComplianceController", () => {
  let controller: ComplianceController;
  const prismaMock = {
    transaction: { findMany: jest.fn() },
    blacklist: { upsert: jest.fn(), findMany: jest.fn() },
    user: { count: jest.fn() },
  };
  const complianceMock = {
    accountMonitor: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComplianceController],
      providers: [
        { provide: PrismaService, useValue: prismaMock },
        { provide: ComplianceService, useValue: complianceMock },
      ],
    }).compile();
    controller = module.get(ComplianceController);
  });

  it("monitorAccounts nutzt ComplianceService", async () => {
    complianceMock.accountMonitor.mockResolvedValue([]);
    await expect(controller.monitorAccounts()).resolves.toEqual([]);
  });

  it("flagged nutzt Prisma", async () => {
    prismaMock.transaction.findMany.mockResolvedValue([]);
    await expect(controller.flagged()).resolves.toEqual([]);
  });
});
