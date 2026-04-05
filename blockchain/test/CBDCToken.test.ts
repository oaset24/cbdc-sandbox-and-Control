import { expect } from "chai";
import { ethers } from "hardhat";
import type { BaseContract } from "ethers";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import "@nomicfoundation/hardhat-chai-matchers";

describe("CBDCToken", function () {
  let token: BaseContract;
  let centralBank: HardhatEthersSigner;
  let bank: HardhatEthersSigner;
  let compliance: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;
  let stranger: HardhatEthersSigner;

  const CENTRAL_BANK_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CENTRAL_BANK_ROLE"));
  const BANK_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BANK_ROLE"));
  const COMPLIANCE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("COMPLIANCE_ROLE"));
  const USER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("USER_ROLE"));

  async function deployFixture() {
    const signers = await ethers.getSigners();
    centralBank = signers[0]!;
    bank = signers[1]!;
    compliance = signers[2]!;
    alice = signers[3]!;
    bob = signers[4]!;
    stranger = signers[5]!;

    const factory = await ethers.getContractFactory("CBDCToken");
    const deployed = await factory.deploy("Central Bank Digital Currency", "CBDC", centralBank.address);
    await deployed.waitForDeployment();
    token = deployed;

    await token.connect(centralBank).grantRole(BANK_ROLE, bank.address);
    await token.connect(centralBank).grantRole(COMPLIANCE_ROLE, compliance.address);
    await token.connect(centralBank).grantRole(USER_ROLE, alice.address);
    await token.connect(centralBank).grantRole(USER_ROLE, bob.address);
  }

  beforeEach(async function () {
    await deployFixture();
  });

  describe("Rollen & Mint/Burn", function () {
    it("vergibt DEFAULT_ADMIN_ROLE und CENTRAL_BANK_ROLE an die Zentralbank", async function () {
      expect(await token.hasRole(await token.DEFAULT_ADMIN_ROLE(), centralBank.address)).to.equal(true);
      expect(await token.hasRole(CENTRAL_BANK_ROLE, centralBank.address)).to.equal(true);
    });

    it("erlaubt Mint nur mit CENTRAL_BANK_ROLE", async function () {
      await expect(token.connect(stranger).mint(alice.address, 100n)).to.be.reverted;
      await token.connect(centralBank).mint(alice.address, 1000n);
      expect(await token.balanceOf(alice.address)).to.equal(1000n);
    });

    it("emittiert TokensMinted beim Mint", async function () {
      await expect(token.connect(centralBank).mint(alice.address, 500n))
        .to.emit(token, "TokensMinted")
        .withArgs(alice.address, 500n, centralBank.address);
    });

    it("erlaubt Burn nur mit CENTRAL_BANK_ROLE", async function () {
      await token.connect(centralBank).mint(alice.address, 500n);
      await expect(token.connect(stranger).burn(alice.address, 100n)).to.be.reverted;
      await token.connect(centralBank).burn(alice.address, 200n);
      expect(await token.balanceOf(alice.address)).to.equal(300n);
    });

    it("emittiert TokensBurned beim Burn", async function () {
      await token.connect(centralBank).mint(alice.address, 400n);
      await expect(token.connect(centralBank).burn(alice.address, 100n))
        .to.emit(token, "TokensBurned")
        .withArgs(alice.address, 100n, centralBank.address);
    });

    it("lehnt Mint mit Betrag 0 ab", async function () {
      await expect(token.connect(centralBank).mint(alice.address, 0n)).to.be.revertedWith("CBDC: zero amount");
    });
  });

  describe("Transfer & USER_ROLE", function () {
    beforeEach(async function () {
      await token.connect(centralBank).mint(alice.address, 10_000n);
    });

    it("erfordert USER_ROLE für transfer", async function () {
      await token.connect(centralBank).mint(stranger.address, 100n);
      await expect(token.connect(stranger).transfer(bob.address, 10n)).to.be.revertedWithCustomError(token, "CBDC__NotUserRole");
    });

    it("erlaubt Transfer mit USER_ROLE", async function () {
      await token.connect(alice).transfer(bob.address, 1000n);
      expect(await token.balanceOf(bob.address)).to.equal(1000n);
    });

    it("erfordert USER_ROLE für transferFrom (Spender)", async function () {
      await token.connect(alice).approve(stranger.address, 500n);
      await expect(
        token.connect(stranger).transferFrom(alice.address, bob.address, 100n)
      ).to.be.revertedWithCustomError(token, "CBDC__NotUserRole");
      await token.connect(centralBank).grantRole(USER_ROLE, stranger.address);
      await token.connect(stranger).transferFrom(alice.address, bob.address, 100n);
      expect(await token.balanceOf(bob.address)).to.equal(100n);
    });
  });

  describe("Freeze & Unfreeze", function () {
    beforeEach(async function () {
      await token.connect(centralBank).mint(alice.address, 1000n);
    });

    it("erlaubt freeze für Zentralbank und Compliance", async function () {
      await token.connect(compliance).freezeAccount(alice.address);
      expect(await token.isAccountFrozen(alice.address)).to.equal(true);
      await token.connect(compliance).unfreezeAccount(alice.address);
      await token.connect(centralBank).freezeAccount(alice.address);
      expect(await token.isAccountFrozen(alice.address)).to.equal(true);
    });

    it("blockiert normale Transfers bei eingefrorenem Sender", async function () {
      await token.connect(centralBank).freezeAccount(alice.address);
      await expect(token.connect(alice).transfer(bob.address, 10n)).to.be.revertedWith("CBDC: sender frozen");
    });

    it("blockiert Transfers an eingefrorenen Empfänger", async function () {
      await token.connect(centralBank).freezeAccount(bob.address);
      await expect(token.connect(alice).transfer(bob.address, 10n)).to.be.revertedWith("CBDC: recipient frozen");
    });

    it("emittiert AccountFrozen / AccountUnfrozen", async function () {
      await expect(token.connect(compliance).freezeAccount(alice.address))
        .to.emit(token, "AccountFrozen")
        .withArgs(alice.address, compliance.address);
      await expect(token.connect(compliance).unfreezeAccount(alice.address))
        .to.emit(token, "AccountUnfrozen")
        .withArgs(alice.address, compliance.address);
    });

    it("Randfall: doppeltes Freeze schlägt fehl", async function () {
      await token.connect(compliance).freezeAccount(alice.address);
      await expect(token.connect(compliance).freezeAccount(alice.address)).to.be.revertedWith("CBDC: already frozen");
    });

    it("Randfall: Unfreeze ohne Freeze schlägt fehl", async function () {
      await expect(token.connect(compliance).unfreezeAccount(alice.address)).to.be.revertedWith("CBDC: not frozen");
    });

    it("Stranger kann nicht einfrieren", async function () {
      await expect(token.connect(stranger).freezeAccount(bob.address)).to.be.reverted;
    });
  });

  describe("forceTransfer", function () {
    beforeEach(async function () {
      await token.connect(centralBank).mint(alice.address, 500n);
    });

    it("bewegt Token trotz Freeze (Zentralbank)", async function () {
      await token.connect(centralBank).freezeAccount(alice.address);
      await token.connect(centralBank).forceTransfer(alice.address, bob.address, 200n);
      expect(await token.balanceOf(alice.address)).to.equal(300n);
      expect(await token.balanceOf(bob.address)).to.equal(200n);
    });

    it("emittiert ForceTransfer", async function () {
      await expect(token.connect(centralBank).forceTransfer(alice.address, bob.address, 50n))
        .to.emit(token, "ForceTransfer")
        .withArgs(alice.address, bob.address, 50n);
    });

    it("funktioniert während Pause (Notfall)", async function () {
      await token.connect(centralBank).pause();
      await token.connect(centralBank).forceTransfer(alice.address, bob.address, 100n);
      expect(await token.balanceOf(bob.address)).to.equal(100n);
    });

    it("Randfall: nur CENTRAL_BANK_ROLE", async function () {
      await expect(token.connect(bank).forceTransfer(alice.address, bob.address, 10n)).to.be.reverted;
    });
  });

  describe("Limits", function () {
    beforeEach(async function () {
      await token.connect(centralBank).mint(alice.address, 1_000_000n);
    });

    it("setTransactionLimit begrenzt Einzeltransfers (0 = aus)", async function () {
      await token.connect(centralBank).setTransactionLimit(100n);
      expect(await token.transactionLimit()).to.equal(100n);
      await expect(token.connect(alice).transfer(bob.address, 101n)).to.be.revertedWith("CBDC: exceeds transaction limit");
      await token.connect(alice).transfer(bob.address, 100n);
    });

    it("emittiert LimitSet für globales Tx-Limit", async function () {
      await expect(token.connect(centralBank).setTransactionLimit(999n))
        .to.emit(token, "LimitSet")
        .withArgs(ethers.ZeroAddress, 999n);
    });

    it("setDailyLimit nur BANK_ROLE", async function () {
      await expect(token.connect(stranger).setDailyLimit(alice.address, 50n)).to.be.reverted;
      await token.connect(bank).setDailyLimit(alice.address, 200n);
      await token.connect(alice).transfer(bob.address, 150n);
      await expect(token.connect(alice).transfer(bob.address, 100n)).to.be.revertedWith("CBDC: exceeds daily limit");
    });

    it("emittiert LimitSet für Tageslimit", async function () {
      await expect(token.connect(bank).setDailyLimit(alice.address, 300n))
        .to.emit(token, "LimitSet")
        .withArgs(alice.address, 300n);
    });

    it("nächster Tag setzt Tageslimit-Verbrauch zurück", async function () {
      await token.connect(bank).setDailyLimit(alice.address, 100n);
      await token.connect(alice).transfer(bob.address, 100n);
      await ethers.provider.send("evm_increaseTime", [86401]);
      await ethers.provider.send("evm_mine", []);
      await token.connect(alice).transfer(bob.address, 100n);
    });
  });

  describe("Programmierbares Geld", function () {
    it("mintWithExpiry verlangt zukünftigen Zeitstempel", async function () {
      const past = (await ethers.provider.getBlock("latest"))!.timestamp - 10;
      await expect(token.connect(centralBank).mintWithExpiry(alice.address, 100n, past)).to.be.revertedWith(
        "CBDC: expiry not in future"
      );
    });

    it("entfernt abgelaufene Beträge bei Transfer (verbrennt)", async function () {
      const latest = (await ethers.provider.getBlock("latest"))!.timestamp;
      const expiry = latest + 3600;
      await token.connect(centralBank).grantRole(USER_ROLE, alice.address);
      await token.connect(centralBank).mintWithExpiry(alice.address, 500n, expiry);
      expect(await token.balanceOf(alice.address)).to.equal(500n);

      await ethers.provider.send("evm_setNextBlockTimestamp", [expiry + 1]);
      await ethers.provider.send("evm_mine", []);

      await token.connect(centralBank).mint(alice.address, 100n);
      await token.connect(alice).transfer(bob.address, 1n);
      expect(await token.balanceOf(alice.address)).to.equal(99n);
    });

    it("mintWithPurpose lehnt leeren Zweck ab", async function () {
      await expect(token.connect(centralBank).mintWithPurpose(alice.address, 100n, ethers.ZeroHash)).to.be.revertedWith(
        "CBDC: empty purpose"
      );
    });

    it("propagiert Zweck-Batch per FIFO bei Transfer", async function () {
      const purpose = ethers.keccak256(ethers.toUtf8Bytes("tax-refund"));
      await token.connect(centralBank).mintWithPurpose(alice.address, 300n, purpose);
      await token.connect(centralBank).mint(alice.address, 200n);
      await token.connect(alice).transfer(bob.address, 250n);
      const b0 = await token.batchAt(bob.address, 0n);
      expect(b0.amount).to.equal(250n);
      expect(b0.purpose).to.equal(purpose);
    });
  });

  describe("Pause", function () {
    beforeEach(async function () {
      await token.connect(centralBank).mint(alice.address, 100n);
    });

    it("blockiert normale Transfers bei Pause", async function () {
      await token.connect(centralBank).pause();
      await expect(token.connect(alice).transfer(bob.address, 10n)).to.be.revertedWithCustomError(token, "EnforcedPause");
    });

    it("Zentralbank kann pausieren und fortsetzen", async function () {
      await token.connect(centralBank).pause();
      await token.connect(centralBank).unpause();
      await token.connect(alice).transfer(bob.address, 10n);
    });
  });

  describe("Burn von eingefrorenem Konto", function () {
    it("erlaubt Burn durch Zentralbank trotz Freeze", async function () {
      await token.connect(centralBank).mint(alice.address, 400n);
      await token.connect(compliance).freezeAccount(alice.address);
      await token.connect(centralBank).burn(alice.address, 100n);
      expect(await token.balanceOf(alice.address)).to.equal(300n);
    });
  });

  describe("Konstruktor", function () {
    it("lehnt address(0) als Zentralbank ab", async function () {
      const factory = await ethers.getContractFactory("CBDCToken");
      await expect(factory.deploy("X", "Y", ethers.ZeroAddress)).to.be.revertedWithCustomError(factory, "CBDC__ZeroAddress");
    });
  });
});
