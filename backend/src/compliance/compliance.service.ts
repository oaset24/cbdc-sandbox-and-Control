import { Injectable } from "@nestjs/common";
import { KYCStatus } from "@prisma/client";
import { parseEther } from "ethers";
import { PrismaService } from "../prisma/prisma.service";
import { BlockchainService } from "../blockchain/blockchain.service";

export type ComplianceOk = { allowed: true; amlFlag: boolean };
export type ComplianceFail = { allowed: false; reasons: string[] };
export type ComplianceResult = ComplianceOk | ComplianceFail;

const AML_THRESHOLD = 10_000;

@Injectable()
export class ComplianceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blockchain: BlockchainService,
  ) {}

  /**
   * Automatische Checks laut CURSOR_TASK: KYC, Blacklist, Freeze, Limits (on-chain wo möglich), AML-Flag.
   */
  async validateUserTransfer(userId: string, toAddress: string, amountHuman: string): Promise<ComplianceResult> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      return { allowed: false, reasons: ["Benutzer nicht gefunden oder deaktiviert"] };
    }
    if (user.kycStatus !== KYCStatus.VERIFIED) {
      return { allowed: false, reasons: ["KYC-Status ist nicht VERIFIED"] };
    }
    if (!user.walletAddress) {
      return { allowed: false, reasons: ["Keine Wallet-Adresse hinterlegt"] };
    }

    const fromNorm = user.walletAddress.toLowerCase();
    const toNorm = toAddress.toLowerCase();

    const [blFrom, blTo] = await Promise.all([
      this.prisma.blacklist.findUnique({ where: { address: fromNorm } }),
      this.prisma.blacklist.findUnique({ where: { address: toNorm } }),
    ]);
    if (blFrom) return { allowed: false, reasons: ["Absenderadresse steht auf der Blacklist"] };
    if (blTo) return { allowed: false, reasons: ["Empfängeradresse steht auf der Blacklist"] };

    if (this.blockchain.isEnabled()) {
      const [frozenFrom, frozenTo] = await Promise.all([
        this.blockchain.isFrozen(user.walletAddress),
        this.blockchain.isFrozen(toAddress),
      ]);
      if (frozenFrom) return { allowed: false, reasons: ["Absenderkonto ist on-chain eingefroren"] };
      if (frozenTo) return { allowed: false, reasons: ["Empfängerkonto ist on-chain eingefroren"] };

      const txLimitWei = await this.blockchain.getTransactionLimitWei();
      if (txLimitWei > 0n) {
        const amt = parseEther(amountHuman);
        if (amt > txLimitWei) {
          return { allowed: false, reasons: ["On-Chain-Transaktionslimit überschritten"] };
        }
      }
      // Tageslimit wird im Smart Contract bei transfer durchgesetzt; hier kein separater State.
    }

    const amlFlag = Number.parseFloat(amountHuman) > AML_THRESHOLD;
    return { allowed: true, amlFlag };
  }

  /** Kontenübersicht für Compliance-Monitor (geflaggte Aktivität + on-chain Freeze). */
  async accountMonitor(): Promise<
    Array<{
      id: string;
      email: string;
      role: string;
      kycStatus: string;
      walletAddress: string | null;
      isActive: boolean;
      createdAt: Date;
      hasFlaggedActivity: boolean;
      isOnChainFrozen: boolean;
    }>
  > {
    const users = await this.prisma.user.findMany({
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

    const flaggedRows = await this.prisma.transaction.findMany({
      where: { OR: [{ flagged: true }, { status: "FLAGGED" }] },
      select: { userId: true },
      distinct: ["userId"],
    });
    const flaggedUserIds = new Set(flaggedRows.map((r) => r.userId));

    const rows = await Promise.all(
      users.map(async (u) => {
        let isOnChainFrozen = false;
        if (u.walletAddress && this.blockchain.isEnabled()) {
          isOnChainFrozen = await this.blockchain.isFrozen(u.walletAddress);
        }
        return {
          ...u,
          hasFlaggedActivity: flaggedUserIds.has(u.id),
          isOnChainFrozen,
        };
      }),
    );

    return rows;
  }

  async assertCustodialWalletMatchesUser(userWalletInDb: string | null): Promise<void> {
    const onChainUser = this.blockchain.getUserWalletAddress();
    if (!this.blockchain.isEnabled() || !onChainUser) return;
    if (!userWalletInDb || userWalletInDb.toLowerCase() !== onChainUser.toLowerCase()) {
      throw new Error("walletAddress muss mit BLOCKCHAIN_USER_WALLET_PRIVATE_KEY übereinstimmen (Custodial-Sandbox).");
    }
  }
}
