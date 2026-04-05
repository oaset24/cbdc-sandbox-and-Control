import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { TxStatus } from "@prisma/client";
import { parseEther } from "ethers";
import { PrismaService } from "../prisma/prisma.service";
import { ComplianceService } from "../compliance/compliance.service";
import { BlockchainService } from "../blockchain/blockchain.service";
import { TransferDto } from "./dto/transfer.dto";

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly compliance: ComplianceService,
    private readonly blockchain: BlockchainService,
  ) {}

  async transfer(userId: string, dto: TransferDto) {
    const result = await this.compliance.validateUserTransfer(userId, dto.to, dto.amount);
    if (!result.allowed) {
      throw new BadRequestException({ message: "Compliance-Prüfung fehlgeschlagen", reasons: result.reasons });
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.walletAddress) {
      throw new BadRequestException("Keine Wallet-Adresse");
    }

    if (this.blockchain.isEnabled()) {
      try {
        await this.compliance.assertCustodialWalletMatchesUser(user.walletAddress);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Wallet-Konfiguration ungültig";
        throw new BadRequestException(msg);
      }
    }

    const amountFloat = Number.parseFloat(dto.amount);
    let status: TxStatus = result.amlFlag ? TxStatus.FLAGGED : TxStatus.COMPLETED;

    if (this.blockchain.isEnabled()) {
      const bal = await this.blockchain.getBalance(user.walletAddress);
      const need = parseEther(dto.amount);
      if (bal < need) {
        throw new BadRequestException("On-Chain-Saldo zu niedrig");
      }
      try {
        await this.blockchain.transferFromUserWallet(dto.to, dto.amount);
        status = result.amlFlag ? TxStatus.FLAGGED : TxStatus.COMPLETED;
      } catch (err) {
        const rec = await this.prisma.transaction.create({
          data: {
            from: user.walletAddress,
            to: dto.to,
            amount: amountFloat,
            purpose: dto.purpose ?? null,
            status: TxStatus.FAILED,
            flagged: result.amlFlag,
            userId,
          },
        });
        throw new BadRequestException({
          message: "On-Chain-Transfer fehlgeschlagen",
          transactionId: rec.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return this.prisma.transaction.create({
      data: {
        from: user.walletAddress,
        to: dto.to,
        amount: amountFloat,
        purpose: dto.purpose ?? null,
        status,
        flagged: result.amlFlag,
        userId,
      },
    });
  }

  findAll() {
    return this.prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, email: true, role: true } } },
    });
  }

  async findOne(id: string) {
    const t = await this.prisma.transaction.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, role: true } } },
    });
    if (!t) throw new NotFoundException();
    return t;
  }

  async findByUser(userId: string, actorId: string, actorRole: string) {
    if (actorId !== userId && actorRole !== "BANK" && actorRole !== "CENTRAL_BANK" && actorRole !== "COMPLIANCE") {
      throw new ForbiddenException();
    }
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
}
