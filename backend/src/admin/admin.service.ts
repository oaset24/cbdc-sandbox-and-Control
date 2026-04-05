import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { BlockchainService } from "../blockchain/blockchain.service";
import { MintDto } from "./dto/mint.dto";
import { BurnDto } from "./dto/burn.dto";
import { ForceTransferDto } from "./dto/force-transfer.dto";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchain: BlockchainService,
    private readonly config: ConfigService,
  ) {}

  private async audit(actorId: string, action: string, details: Prisma.InputJsonValue) {
    await this.prisma.auditLog.create({
      data: {
        action,
        userId: actorId,
        details,
      },
    });
  }

  async mint(actorId: string, dto: MintDto) {
    if (!this.blockchain.isEnabled()) {
      throw new BadRequestException("Blockchain nicht konfiguriert");
    }
    const hash = await this.blockchain.mint(dto.to, dto.amount);
    await this.audit(actorId, "MINT", { to: dto.to, amount: dto.amount, txHash: hash });
    return { txHash: hash };
  }

  async burn(actorId: string, dto: BurnDto) {
    if (!this.blockchain.isEnabled()) {
      throw new BadRequestException("Blockchain nicht konfiguriert");
    }
    const hash = await this.blockchain.burn(dto.from, dto.amount);
    await this.audit(actorId, "BURN", { from: dto.from, amount: dto.amount, txHash: hash });
    return { txHash: hash };
  }

  async freeze(actorId: string, address: string) {
    if (!this.blockchain.isEnabled()) {
      throw new BadRequestException("Blockchain nicht konfiguriert");
    }
    const hash = await this.blockchain.freezeAccount(address);
    await this.audit(actorId, "FREEZE", { address, txHash: hash });
    return { txHash: hash };
  }

  async unfreeze(actorId: string, address: string) {
    if (!this.blockchain.isEnabled()) {
      throw new BadRequestException("Blockchain nicht konfiguriert");
    }
    const hash = await this.blockchain.unfreezeAccount(address);
    await this.audit(actorId, "UNFREEZE", { address, txHash: hash });
    return { txHash: hash };
  }

  async forceTransfer(actorId: string, dto: ForceTransferDto) {
    if (!this.blockchain.isEnabled()) {
      throw new BadRequestException("Blockchain nicht konfiguriert");
    }
    const hash = await this.blockchain.forceTransfer(dto.from, dto.to, dto.amount);
    await this.audit(actorId, "FORCE_TRANSFER", {
      from: dto.from,
      to: dto.to,
      amount: dto.amount,
      txHash: hash,
    });
    return { txHash: hash };
  }

  auditLogs(skip = 0, take = 100) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });
  }

  async systemStats() {
    const [users, activeUsers, txs, vol, blacklist, pendingKyc] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.transaction.count(),
      this.prisma.transaction.aggregate({ _sum: { amount: true } }),
      this.prisma.blacklist.count(),
      this.prisma.user.count({ where: { kycStatus: "PENDING" } }),
    ]);
    let totalSupply: string | null = null;
    if (this.blockchain.isEnabled()) {
      const wei = await this.blockchain.getTotalSupply();
      totalSupply = wei.toString();
    }
    const cbdcContractAddress = this.config.get<string>("CBDC_CONTRACT_ADDRESS")?.trim() || null;
    return {
      userCount: users,
      activeUsers,
      transactionCount: txs,
      totalVolume: vol._sum.amount ?? 0,
      blacklistCount: blacklist,
      pendingKycUsers: pendingKyc,
      totalSupplyWei: totalSupply,
      cbdcContractAddress,
    };
  }
}
