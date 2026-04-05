/**
 * Aufgabe 6 (CURSOR_TASK): Test-Accounts in PostgreSQL + On-Chain CBDC (Mint, Freeze, USER_ROLE).
 *
 * Nutzt `pg` (kein zweiter Prisma-Client im blockchain-Ordner).
 *
 * Voraussetzungen:
 * - DATABASE_URL in backend/.env
 * - Optional: CBDC_CONTRACT_ADDRESS — sonst wird der Token neu deployed
 *
 * Aufruf: npm run seed
 */

import { randomUUID } from "crypto";
import { config as loadEnv } from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { Contract, keccak256, toUtf8Bytes, parseEther } from "ethers";
import hre from "hardhat";
import * as bcrypt from "bcrypt";
import { Pool } from "pg";

const backendEnv = path.resolve(__dirname, "../../backend/.env");
if (fs.existsSync(backendEnv)) {
  loadEnv({ path: backendEnv });
}
loadEnv();

const SEED_EMAILS = [
  "centralbank@cbdc.gov",
  "bank@sparkasse.de",
  "user1@cbdc.demo",
  "user2@cbdc.demo",
  "user3@cbdc.demo",
  "frozen@cbdc.demo",
  "flagged@cbdc.demo",
] as const;

const USER_ROLE = keccak256(toUtf8Bytes("USER_ROLE"));

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL fehlt (z. B. in backend/.env setzen).");
  }

  const pool = new Pool({ connectionString: dbUrl });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `DELETE FROM "Transaction" WHERE "userId" IN (SELECT id FROM "User" WHERE email = ANY($1::text[]))`,
      [SEED_EMAILS],
    );
    await client.query(`DELETE FROM "User" WHERE email = ANY($1::text[])`, [SEED_EMAILS]);
    console.log("Vorherige Seed-Datensätze entfernt.");

    const signers = await hre.ethers.getSigners();
    if (signers.length < 7) {
      throw new Error("Mindestens 7 Hardhat-Signer erforderlich (Index 0–6).");
    }

    const [centralSigner, bankSigner, u1, u2, u3, frozenSigner, flaggedSigner] = signers;

    let tokenAddress = process.env.CBDC_CONTRACT_ADDRESS?.trim();
    let token: Contract;

    if (tokenAddress) {
      token = await hre.ethers.getContractAt("CBDCToken", tokenAddress, centralSigner);
      console.log("Verwende bestehenden Vertrag:", tokenAddress);
    } else {
      const Factory = await hre.ethers.getContractFactory("CBDCToken");
      const deployed = await Factory.deploy("Central Bank Digital Currency", "CBDC", centralSigner.address);
      await deployed.waitForDeployment();
      tokenAddress = await deployed.getAddress();
      token = deployed as Contract;
      console.log("CBDCToken deployed:", tokenAddress);
    }

    for (const w of [u1, u2, u3, frozenSigner, flaggedSigner]) {
      const tx = await token.grantRole(USER_ROLE, w.address);
      await tx.wait();
      console.log("USER_ROLE:", w.address);
    }

    const mint = async (to: string, human: string) => {
      const tx = await token.mint(to, parseEther(human));
      await tx.wait();
    };

    await mint(u1.address, "1000");
    await mint(u2.address, "1000");
    await mint(u3.address, "1000");
    console.log("3 × 1000 CBDC an Standard-User gemint.");

    await mint(frozenSigner.address, "500");
    const freezeTx = await token.freezeAccount(frozenSigner.address);
    await freezeTx.wait();
    console.log("Demo eingefroren (on-chain):", frozenSigner.address);

    await mint(flaggedSigner.address, "2000");
    console.log("Demo geflaggte Wallet:", flaggedSigner.address);

    const hashPw = (pw: string) => bcrypt.hash(pw, 12);

    const insertUser = async (
      email: string,
      password: string,
      role: "CENTRAL_BANK" | "BANK" | "USER",
      kyc: "PENDING" | "VERIFIED" | "REJECTED",
      wallet: string,
    ) => {
      const id = randomUUID();
      const passwordHash = await hashPw(password);
      await client.query(
        `INSERT INTO "User" (id, email, password, role, "kycStatus", "walletAddress", "isActive", "createdAt")
         VALUES ($1, $2, $3, $4::"Role", $5::"KYCStatus", $6, true, NOW())`,
        [id, email, passwordHash, role, kyc, wallet],
      );
      return id;
    };

    const centralId = await insertUser(
      "centralbank@cbdc.gov",
      "Admin1234!",
      "CENTRAL_BANK",
      "VERIFIED",
      centralSigner.address,
    );
    const bankId = await insertUser("bank@sparkasse.de", "Bank1234!", "BANK", "VERIFIED", bankSigner.address);

    const demoPw = "User1234!";
    const userDemoHash = await hashPw(demoPw);

    const insUserFixed = async (email: string, wallet: string) => {
      const id = randomUUID();
      await client.query(
        `INSERT INTO "User" (id, email, password, role, "kycStatus", "walletAddress", "isActive", "createdAt")
         VALUES ($1, $2, $3, 'USER'::"Role", 'VERIFIED'::"KYCStatus", $4, true, NOW())`,
        [id, email, userDemoHash, wallet],
      );
      return id;
    };

    const ua = await insUserFixed("user1@cbdc.demo", u1.address);
    const ub = await insUserFixed("user2@cbdc.demo", u2.address);
    const uc = await insUserFixed("user3@cbdc.demo", u3.address);
    const frozenId = await insUserFixed("frozen@cbdc.demo", frozenSigner.address);
    const flaggedId = await insUserFixed("flagged@cbdc.demo", flaggedSigner.address);

    const burnAddr = "0x000000000000000000000000000000000000dEaD";
    await client.query(
      `INSERT INTO "Transaction" (id, "from", "to", amount, purpose, status, flagged, "createdAt", "userId")
       VALUES ($1, $2, $3, $4, $5, 'FLAGGED'::"TxStatus", true, NOW(), $6)`,
      [randomUUID(), flaggedSigner.address, burnAddr, 15_000, "Demo AML-Flag", flaggedId],
    );

    await client.query("COMMIT");

    console.log("\nSeed abgeschlossen.");
    console.table([
      { Rolle: "Zentralbank", Email: "centralbank@cbdc.gov", Wallet: centralSigner.address, DbId: centralId },
      { Rolle: "Bank", Email: "bank@sparkasse.de", Wallet: bankSigner.address, DbId: bankId },
      { Rolle: "User", Email: "user1@cbdc.demo", Wallet: u1.address, DbId: ua },
      { Rolle: "User", Email: "user2@cbdc.demo", Wallet: u2.address, DbId: ub },
      { Rolle: "User", Email: "user3@cbdc.demo", Wallet: u3.address, DbId: uc },
      { Rolle: "Frozen", Email: "frozen@cbdc.demo", Wallet: frozenSigner.address, DbId: frozenId },
      { Rolle: "Flagged", Email: "flagged@cbdc.demo", Wallet: flaggedSigner.address, DbId: flaggedId },
    ]);
    console.log("\nPasswörter: Zentralbank Admin1234! | Bank Bank1234! | Demo-User User1234!");
    console.log(
      "Custodial-Backend: BLOCKCHAIN_USER_WALLET_PRIVATE_KEY auf einen User-Signer (Hardhat-Account 2–4) setzen.",
    );
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
