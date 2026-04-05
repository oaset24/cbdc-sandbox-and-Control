import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateKycDto } from "./dto/update-kyc.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        kycStatus: true,
        walletAddress: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string, actorRole: Role, actorId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        kycStatus: true,
        walletAddress: true,
        isActive: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException();
    if (actorRole === Role.USER && actorId !== id) {
      throw new ForbiddenException();
    }
    return user;
  }

  async updateKyc(id: string, dto: UpdateKycDto) {
    await this.ensureUser(id);
    return this.prisma.user.update({
      where: { id },
      data: { kycStatus: dto.status },
      select: {
        id: true,
        email: true,
        kycStatus: true,
      },
    });
  }

  async deactivate(id: string) {
    await this.ensureUser(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, email: true, isActive: true },
    });
  }

  private async ensureUser(id: string) {
    const u = await this.prisma.user.findUnique({ where: { id } });
    if (!u) throw new NotFoundException();
  }
}
