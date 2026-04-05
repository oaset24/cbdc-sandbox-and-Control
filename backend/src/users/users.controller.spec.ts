import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

describe("UsersController", () => {
  let controller: UsersController;
  const usersMock = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateKyc: jest.fn(),
    deactivate: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersMock }],
    }).compile();
    controller = module.get(UsersController);
  });

  it("findAll", async () => {
    usersMock.findAll.mockResolvedValue([]);
    await expect(controller.findAll()).resolves.toEqual([]);
  });
});
