import { Test, TestingModule } from "@nestjs/testing";
import { ComplianceController } from "./compliance.controller";
import { PrismaService } from "../prisma/prisma.service";

describe("ComplianceController", () => {
  let controller: ComplianceController;
  const prismaMock = {
    transaction: { findMany: jest.fn() },
    blacklist: { upsert: jest.fn(), findMany: jest.fn() },
    user: { count: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComplianceController],
      providers: [{ provide: PrismaService, useValue: prismaMock }],
    }).compile();
    controller = module.get(ComplianceController);
  });

  it("flagged nutzt Prisma", async () => {
    prismaMock.transaction.findMany.mockResolvedValue([]);
    await expect(controller.flagged()).resolves.toEqual([]);
  });
});
