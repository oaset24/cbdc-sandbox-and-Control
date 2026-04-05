import { Test, TestingModule } from "@nestjs/testing";
import { Role } from "@prisma/client";
import { TransactionsController } from "./transactions.controller";
import { TransactionsService } from "./transactions.service";

describe("TransactionsController", () => {
  let controller: TransactionsController;
  const txMock = {
    transfer: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [{ provide: TransactionsService, useValue: txMock }],
    }).compile();
    controller = module.get(TransactionsController);
  });

  it("transfer delegiert an Service", async () => {
    txMock.transfer.mockResolvedValue({ id: "t1" });
    const user = { sub: "u1", email: "a@b.de", role: Role.USER };
    await expect(
      controller.transfer(user as never, { to: "0x2222222222222222222222222222222222222222", amount: "1" }),
    ).resolves.toEqual({ id: "t1" });
  });
});
