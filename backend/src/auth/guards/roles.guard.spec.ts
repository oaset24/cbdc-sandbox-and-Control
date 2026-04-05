import { Reflector } from "@nestjs/core";
import { ExecutionContext } from "@nestjs/common";
import { Role } from "@prisma/client";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { RolesGuard } from "./roles.guard";

function mockContext(user: { role: Role } | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext;
}

describe("RolesGuard", () => {
  it("erlaubt ohne @Roles-Metadaten", () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(undefined) };
    const guard = new RolesGuard(reflector as unknown as Reflector);
    expect(guard.canActivate(mockContext({ role: Role.USER }))).toBe(true);
  });

  it("erlaubt BANK wenn erforderlich", () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue([Role.BANK, Role.CENTRAL_BANK]) };
    const guard = new RolesGuard(reflector as unknown as Reflector);
    expect(guard.canActivate(mockContext({ role: Role.BANK }))).toBe(true);
  });

  it("verweigert bei falscher Rolle", () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue([Role.CENTRAL_BANK]) };
    const guard = new RolesGuard(reflector as unknown as Reflector);
    expect(guard.canActivate(mockContext({ role: Role.BANK }))).toBe(false);
  });

  it("verweigert ohne eingeloggten User", () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue([Role.USER]) };
    const guard = new RolesGuard(reflector as unknown as Reflector);
    expect(guard.canActivate(mockContext(undefined))).toBe(false);
  });

  it("nutzt ROLES_KEY für Reflector", () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue([Role.USER]) };
    const guard = new RolesGuard(reflector as unknown as Reflector);
    guard.canActivate(mockContext({ role: Role.USER }));
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, expect.any(Array));
  });
});
