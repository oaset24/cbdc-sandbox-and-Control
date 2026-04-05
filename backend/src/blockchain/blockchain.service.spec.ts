import { ConfigService } from "@nestjs/config";
import { BlockchainService } from "./blockchain.service";

function makeConfig(partial: Record<string, string | undefined>): ConfigService {
  return {
    get: (key: string) => partial[key],
    getOrThrow: (key: string) => {
      const v = partial[key];
      if (v === undefined) throw new Error(`missing ${key}`);
      return v;
    },
  } as unknown as ConfigService;
}

describe("BlockchainService", () => {
  it("isEnabled ist false ohne Konfiguration", () => {
    const service = new BlockchainService(makeConfig({}));
    expect(service.isEnabled()).toBe(false);
  });

  it("isEnabled ist true mit RPC und Vertragsadresse", () => {
    const service = new BlockchainService(
      makeConfig({
        BLOCKCHAIN_RPC_URL: "http://127.0.0.1:8545",
        CBDC_CONTRACT_ADDRESS: "0x1111111111111111111111111111111111111111",
      }),
    );
    expect(service.isEnabled()).toBe(true);
  });

  it("getUserWalletAddress null vor onModuleInit", () => {
    const service = new BlockchainService(makeConfig({}));
    expect(service.getUserWalletAddress()).toBeNull();
  });
});
