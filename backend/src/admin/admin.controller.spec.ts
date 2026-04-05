import { Test, TestingModule } from "@nestjs/testing";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

describe("AdminController", () => {
  let controller: AdminController;
  const adminMock = {
    mint: jest.fn(),
    systemStats: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: adminMock }],
    }).compile();
    controller = module.get(AdminController);
  });

  it("systemStats", async () => {
    adminMock.systemStats.mockResolvedValue({ userCount: 1 });
    await expect(controller.systemStats()).resolves.toEqual({ userCount: 1 });
  });
});
