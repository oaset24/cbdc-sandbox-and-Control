import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

describe("AuthController", () => {
  let controller: AuthController;
  const authMock = {
    register: jest.fn(),
    login: jest.fn(),
    me: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authMock }],
    }).compile();
    controller = module.get(AuthController);
  });

  it("register ruft AuthService auf", async () => {
    authMock.register.mockResolvedValue({ id: "1" });
    await expect(controller.register({ email: "a@b.de", password: "12345678" })).resolves.toEqual({ id: "1" });
  });

  it("login ruft AuthService auf", async () => {
    authMock.login.mockResolvedValue({ access_token: "t" });
    await expect(controller.login({ email: "a@b.de", password: "x" })).resolves.toEqual({ access_token: "t" });
  });
});
