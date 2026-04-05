import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { formatEther } from "ethers";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { JwtPayloadUser } from "../auth/interfaces/jwt-payload.interface";
import { PrismaService } from "../prisma/prisma.service";
import { BlockchainService } from "./blockchain.service";

@ApiTags("blockchain")
@ApiBearerAuth()
@Controller("blockchain")
export class BlockchainController {
  constructor(
    private readonly blockchain: BlockchainService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Get("balance/me")
  @ApiOperation({
    summary: "On-Chain-Saldo (eigene Wallet)",
    description: "Liest balanceOf für die im Profil hinterlegte walletAddress.",
  })
  @ApiResponse({ status: 200, description: "Wei, formatierter Betrag, Vertragsadresse" })
  async myBalance(@CurrentUser() user: JwtPayloadUser) {
    const row = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { walletAddress: true },
    });
    const contractAddress = this.config.get<string>("CBDC_CONTRACT_ADDRESS")?.trim() ?? null;
    if (!row?.walletAddress) {
      return {
        address: null,
        contractAddress,
        balanceWei: null,
        balanceFormatted: null,
        chainAvailable: this.blockchain.isEnabled(),
      };
    }
    const address = row.walletAddress;
    if (!this.blockchain.isEnabled()) {
      return {
        address,
        contractAddress,
        balanceWei: "0",
        balanceFormatted: "0.0",
        chainAvailable: false,
      };
    }
    const wei = await this.blockchain.getBalance(address);
    return {
      address,
      contractAddress,
      balanceWei: wei.toString(),
      balanceFormatted: formatEther(wei),
      chainAvailable: true,
    };
  }
}
