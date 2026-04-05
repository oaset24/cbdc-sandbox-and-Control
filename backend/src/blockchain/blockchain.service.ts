import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Contract, JsonRpcProvider, Wallet, formatEther, parseEther } from "ethers";
import { CBDC_TOKEN_ABI } from "./cbdctoken.abi";

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: JsonRpcProvider | null = null;
  private adminWallet: Wallet | null = null;
  private userWallet: Wallet | null = null;
  private contractRead: Contract | null = null;

  constructor(private readonly config: ConfigService) {}

  isEnabled(): boolean {
    const rpc = this.config.get<string>("BLOCKCHAIN_RPC_URL");
    const addr = this.config.get<string>("CBDC_CONTRACT_ADDRESS");
    return Boolean(rpc && addr);
  }

  async onModuleInit(): Promise<void> {
    if (!this.isEnabled()) {
      this.logger.warn("Blockchain deaktiviert: BLOCKCHAIN_RPC_URL oder CBDC_CONTRACT_ADDRESS fehlt.");
      return;
    }
    const rpc = this.config.getOrThrow<string>("BLOCKCHAIN_RPC_URL");
    const contractAddress = this.config.getOrThrow<string>("CBDC_CONTRACT_ADDRESS");
    this.provider = new JsonRpcProvider(rpc);
    this.contractRead = new Contract(contractAddress, CBDC_TOKEN_ABI, this.provider);

    const adminPk = this.config.get<string>("BLOCKCHAIN_ADMIN_PRIVATE_KEY");
    if (adminPk) {
      this.adminWallet = new Wallet(adminPk, this.provider);
    }
    const userPk = this.config.get<string>("BLOCKCHAIN_USER_WALLET_PRIVATE_KEY");
    if (userPk) {
      this.userWallet = new Wallet(userPk, this.provider);
    }

    this.attachEventListeners(contractAddress);
  }

  private attachEventListeners(contractAddress: string): void {
    if (!this.provider) return;
    const c = new Contract(contractAddress, CBDC_TOKEN_ABI, this.provider);
    c.on("TokensMinted", (to: string, amount: bigint, by: string) => {
      this.logger.log(`On-chain TokensMinted to=${to} amount=${formatEther(amount)} by=${by}`);
    });
    c.on("TokensBurned", (from: string, amount: bigint, by: string) => {
      this.logger.log(`On-chain TokensBurned from=${from} amount=${formatEther(amount)} by=${by}`);
    });
    c.on("AccountFrozen", (user: string, by: string) => {
      this.logger.log(`On-chain AccountFrozen user=${user} by=${by}`);
    });
    c.on("AccountUnfrozen", (user: string, by: string) => {
      this.logger.log(`On-chain AccountUnfrozen user=${user} by=${by}`);
    });
    c.on("ForceTransfer", (from: string, to: string, amount: bigint) => {
      this.logger.log(`On-chain ForceTransfer ${from} -> ${to} ${formatEther(amount)}`);
    });
  }

  getUserWalletAddress(): string | null {
    return this.userWallet?.address ?? null;
  }

  getAdminWalletAddress(): string | null {
    return this.adminWallet?.address ?? null;
  }

  async isFrozen(address: string): Promise<boolean> {
    if (!this.contractRead) return false;
    return (await this.contractRead.isAccountFrozen(address)) as boolean;
  }

  async getTransactionLimitWei(): Promise<bigint> {
    if (!this.contractRead) return 0n;
    return (await this.contractRead.transactionLimit()) as bigint;
  }

  async getDailyLimitWei(address: string): Promise<bigint> {
    if (!this.contractRead) return 0n;
    return (await this.contractRead.dailyLimit(address)) as bigint;
  }

  async getBalance(address: string): Promise<bigint> {
    if (!this.contractRead) return 0n;
    return (await this.contractRead.balanceOf(address)) as bigint;
  }

  async getTotalSupply(): Promise<bigint> {
    if (!this.contractRead) return 0n;
    return (await this.contractRead.totalSupply()) as bigint;
  }

  async mint(to: string, amountHuman: string): Promise<string> {
    this.requireAdmin();
    const c = this.contractWithAdmin();
    const tx = await c.mint(to, parseEther(amountHuman));
    const receipt = await tx.wait();
    return receipt?.hash ?? tx.hash;
  }

  async burn(from: string, amountHuman: string): Promise<string> {
    this.requireAdmin();
    const c = this.contractWithAdmin();
    const tx = await c.burn(from, parseEther(amountHuman));
    const receipt = await tx.wait();
    return receipt?.hash ?? tx.hash;
  }

  async freezeAccount(address: string): Promise<string> {
    this.requireAdmin();
    const c = this.contractWithAdmin();
    const tx = await c.freezeAccount(address);
    const receipt = await tx.wait();
    return receipt?.hash ?? tx.hash;
  }

  async unfreezeAccount(address: string): Promise<string> {
    this.requireAdmin();
    const c = this.contractWithAdmin();
    const tx = await c.unfreezeAccount(address);
    const receipt = await tx.wait();
    return receipt?.hash ?? tx.hash;
  }

  async forceTransfer(from: string, to: string, amountHuman: string): Promise<string> {
    this.requireAdmin();
    const c = this.contractWithAdmin();
    const tx = await c.forceTransfer(from, to, parseEther(amountHuman));
    const receipt = await tx.wait();
    return receipt?.hash ?? tx.hash;
  }

  /** USER_ROLE-Transfer vom Custodial-Wallet */
  async transferFromUserWallet(to: string, amountHuman: string): Promise<string> {
    if (!this.userWallet) {
      throw new Error("BLOCKCHAIN_USER_WALLET_PRIVATE_KEY nicht gesetzt");
    }
    const contractAddress = this.config.getOrThrow<string>("CBDC_CONTRACT_ADDRESS");
    const c = new Contract(contractAddress, CBDC_TOKEN_ABI, this.userWallet);
    const tx = await c.transfer(to, parseEther(amountHuman));
    const receipt = await tx.wait();
    return receipt?.hash ?? tx.hash;
  }

  private requireAdmin(): void {
    if (!this.adminWallet) {
      throw new Error("BLOCKCHAIN_ADMIN_PRIVATE_KEY nicht gesetzt");
    }
  }

  private contractWithAdmin(): Contract {
    const contractAddress = this.config.getOrThrow<string>("CBDC_CONTRACT_ADDRESS");
    if (!this.adminWallet) {
      throw new Error("Admin-Wallet fehlt");
    }
    return new Contract(contractAddress, CBDC_TOKEN_ABI, this.adminWallet);
  }
}
