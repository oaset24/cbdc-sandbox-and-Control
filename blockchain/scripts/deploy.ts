import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deployt CBDCToken und schreibt Adresse + ABI-Pfad für das Backend in eine JSON-Datei.
 *
 * Aufruf:
 *   npx hardhat run scripts/deploy.ts --network hardhat
 *   npx hardhat run scripts/deploy.ts --network localhost
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Factory = await ethers.getContractFactory("CBDCToken");
  const token = await Factory.deploy("Central Bank Digital Currency", "CBDC", deployer.address);
  await token.waitForDeployment();

  const address = await token.getAddress();
  console.log("CBDCToken deployed to:", address);

  const artifactPath = path.join(__dirname, "../artifacts/contracts/CBDCToken.sol/CBDCToken.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8")) as { abi: unknown[] };

  const outDir = path.join(__dirname, "../deployments");
  fs.mkdirSync(outDir, { recursive: true });

  const record = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    contractAddress: address,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: artifact.abi,
  };

  const outFile = path.join(outDir, "cbdctoken.json");
  fs.writeFileSync(outFile, JSON.stringify(record, null, 2), "utf8");
  console.log("Deployment record written to:", outFile);
  console.log("");
  console.log("Backend .env (Beispiel):");
  console.log(`BLOCKCHAIN_RPC_URL=<dein-RPC>`);
  console.log(`CBDC_CONTRACT_ADDRESS=${address}`);
  console.log(`BLOCKCHAIN_ADMIN_PRIVATE_KEY=<Private Key des Deployers / Zentralbank-Signers>`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
