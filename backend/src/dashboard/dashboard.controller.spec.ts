import { Test, TestingModule } from "@nestjs/testing";
import { Role } from "@prisma/client";
import { Reflector } from "@nestjs/core";
import { DashboardController } from "./dashboard.controller";
import { AdminService } from "../admin/admin.service";
import { ROLES_KEY } from "../auth/decorators/roles.decorator";

describe("DashboardController", () => {
  let controller: DashboardController;
  const adminMock = { systemStats: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: AdminService, useValue: adminMock }],
    }).compile();
    controller = module.get(DashboardController);
  });

  it("systemStats delegiert an AdminService", async () => {
    adminMock.systemStats.mockResolvedValue({ userCount: 3 });
    await expect(controller.systemStats()).resolves.toEqual({ userCount: 3 });
  });

  it("GET system-stats ist für BANK und CENTRAL_BANK freigegeben (Metadaten)", () => {
    const reflector = new Reflector();
    const roles = reflector.get<Role[] | undefined>(ROLES_KEY, DashboardController.prototype.systemStats);
    expect(roles).toEqual(expect.arrayContaining([Role.BANK, Role.CENTRAL_BANK]));
    expect(roles).toHaveLength(2);
  });
});
