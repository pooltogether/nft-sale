import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { increaseTime as increaseTimeUtil } from "./utils/increaseTime";

const increaseTime = (time: number) => increaseTimeUtil(provider, time);

const { constants, provider, utils } = ethers;
const { AddressZero, Zero } = constants;
const { parseEther: toWei } = utils;

describe("PoolyNFT", () => {
  let owner: SignerWithAddress;
  let stranger: SignerWithAddress;

  let poolyNFT: Contract;

  const baseURI = "ipfs://pooltogether.com/nft/";

  const nftName = "PoolTogether NFT";
  const nftSymbol = "PTNFT";
  const nftPrice = toWei("75");
  const nftMaxNumber = 10;
  const nftMaxMint = 5;

  let constructorTest = false;

  const deployNFT = async (
    name = nftName,
    symbol = nftSymbol,
    deployer = owner.address,
    price = nftPrice,
    maxNFT = nftMaxNumber,
    maxMint = nftMaxMint,
    startTimestamp: number | null = null,
    endTimestamp: number | null = null
  ) => {
    const poolyNFTFactory: ContractFactory = await ethers.getContractFactory("PoolyNFT");

    const currentTimestamp = (await provider.getBlock("latest")).timestamp;

    startTimestamp ? startTimestamp : (startTimestamp = currentTimestamp + 100);
    endTimestamp ? endTimestamp : (endTimestamp = startTimestamp + 100);

    return await poolyNFTFactory.deploy(
      name,
      symbol,
      price,
      maxNFT,
      maxMint,
      startTimestamp,
      endTimestamp,
      deployer
    );
  };

  beforeEach(async () => {
    [owner, stranger] = await ethers.getSigners();

    if (!constructorTest) {
      poolyNFT = await deployNFT();
    }
  });

  describe("constructor()", () => {
    beforeEach(() => {
      constructorTest = true;
    });

    afterEach(() => {
      constructorTest = false;
    });

    it("should deploy", async () => {
      const currentTimestamp = (await provider.getBlock("latest")).timestamp;
      const poolyNFT = await deployNFT();

      await expect(poolyNFT.deployTransaction)
        .to.emit(poolyNFT, "NFTInitialized")
        .withArgs(
          nftName,
          nftSymbol,
          nftPrice,
          nftMaxNumber,
          nftMaxMint,
          currentTimestamp + 100,
          currentTimestamp + 200,
          owner.address
        );
    });

    it("should fail to deploy if owner is address zero", async () => {
      await expect(deployNFT(nftName, nftSymbol, AddressZero)).to.be.revertedWith(
        "PTNFT/owner-not-zero-address"
      );
    });

    it("should fail to deploy if NFT price is not greater than zero", async () => {
      await expect(deployNFT(nftName, nftSymbol, owner.address, Zero)).to.be.revertedWith(
        "PTNFT/price-gt-zero"
      );
    });

    it("should fail to deploy if max NFT is not greater than zero", async () => {
      await expect(deployNFT(nftName, nftSymbol, owner.address, nftPrice, 0)).to.be.revertedWith(
        "PTNFT/max-nft-gt-zero"
      );
    });

    it("should fail to deploy if max mint is not greater than zero", async () => {
      await expect(
        deployNFT(nftName, nftSymbol, owner.address, nftPrice, nftMaxNumber, 0)
      ).to.be.revertedWith("PTNFT/max-mint-gt-zero");
    });

    it("should fail to deploy if startTimestamp is before block timestamp", async () => {
      const currentTimestamp = (await provider.getBlock("latest")).timestamp;

      await expect(
        deployNFT(
          nftName,
          nftSymbol,
          owner.address,
          nftPrice,
          nftMaxNumber,
          nftMaxMint,
          currentTimestamp - 100
        )
      ).to.be.revertedWith("PTNFT/startTimestamp-gt-block");
    });

    it("should fail to deploy if endTimestamp is before startTimestamp", async () => {
      const currentTimestamp = (await provider.getBlock("latest")).timestamp;

      await expect(
        deployNFT(
          nftName,
          nftSymbol,
          owner.address,
          nftPrice,
          nftMaxNumber,
          nftMaxMint,
          currentTimestamp + 100,
          currentTimestamp
        )
      ).to.be.revertedWith("PTNFT/endTimestamp-gt-start");
    });
  });

  describe("mintNFT()", () => {
    it("should mint a Pooly NFT", async () => {
      await increaseTime(100);

      await expect(
        poolyNFT.mintNFT(1, {
          value: nftPrice,
        })
      )
        .to.emit(poolyNFT, "NFTMinted")
        .withArgs(owner.address, 1, nftPrice);
    });

    it("should mint 5 Pooly NFTs in one go", async () => {
      await increaseTime(100);

      await poolyNFT.mintNFT(5, {
        value: nftPrice.mul(5),
      });

      expect(await poolyNFT.totalSupply()).to.equal(5);
    });

    it("should fail to mint a Pooly NFT if NFT sale has not started yet", async () => {
      await expect(
        poolyNFT.mintNFT(1, {
          value: nftPrice,
        })
      ).to.be.revertedWith("PTNFT/sale-inactive");
    });

    it("should fail to mint a Pooly NFT if NFT sale is over", async () => {
      await increaseTime(200);

      await expect(
        poolyNFT.mintNFT(1, {
          value: nftPrice,
        })
      ).to.be.revertedWith("PTNFT/sale-inactive");
    });

    it("should fail to mint a Pooly NFT if NFTs are sold out", async () => {
      await increaseTime(100);

      for (let index = 0; index < 10; index++) {
        poolyNFT.mintNFT(1, {
          value: nftPrice,
        });
      }

      await expect(
        poolyNFT.mintNFT(1, {
          value: nftPrice,
        })
      ).to.be.revertedWith("PTNFT/nfts-sold-out");
    });

    it("should fail to mint a Pooly NFT if minting more than the max number of NFTs per transaction", async () => {
      await increaseTime(100);

      await expect(
        poolyNFT.mintNFT(6, {
          value: nftPrice.mul(6),
        })
      ).to.be.revertedWith("PTNFT/exceeds-max-mint");
    });

    it("should fail to mint a Pooly NFT if not enough ETH has been supplied", async () => {
      await increaseTime(100);

      await expect(
        poolyNFT.mintNFT(1, {
          value: nftPrice.div(2),
        })
      ).to.be.revertedWith("PTNFT/insufficient-funds");
    });
  });

  describe("setBaseURI()", () => {
    it("should set base URI if owner", async () => {
      await poolyNFT.setBaseURI(baseURI);

      expect(await poolyNFT.baseURI()).to.equal(baseURI);
    });

    it("should fail to set base URI if not owner", async () => {
      await expect(poolyNFT.connect(stranger).setBaseURI(baseURI)).to.be.revertedWith(
        "Ownable/caller-not-owner"
      );
    });
  });

  describe("royaltyInfo()", () => {
    it("should retrieve infos about royalty fees", async () => {
      await increaseTime(100);

      await poolyNFT.mintNFT(1, {
        value: nftPrice,
      });

      const result = await poolyNFT.royaltyInfo(0, toWei("75"));

      expect(result[0]).to.equal(AddressZero);
      expect(result[1]).to.equal(toWei("0"));
    });
  });

  describe("setRoyaltyFee()", () => {
    it("should set royalty fee", async () => {
      await increaseTime(100);

      await poolyNFT.mintNFT(1, {
        value: nftPrice,
      });

      const fee = 1000; // 10%

      await expect(poolyNFT.setRoyaltyFee(owner.address, fee))
        .to.emit(poolyNFT, "RoyaltyFeeSet")
        .withArgs(owner.address, owner.address, fee);

      const result = await poolyNFT.royaltyInfo(0, toWei("75"));

      expect(result[0]).to.equal(owner.address);
      expect(result[1]).to.equal(toWei("7.5"));
    });
  });

  describe("withdraw()", () => {
    it("should withdraw ETH stored in contract if owner", async () => {
      const amount = nftPrice.mul(5);

      await increaseTime(100);

      for (let index = 0; index < 5; index++) {
        await poolyNFT.connect(stranger).mintNFT(1, {
          value: nftPrice,
        });
      }

      expect(await provider.getBalance(poolyNFT.address)).to.equal(amount);

      await expect(poolyNFT.withdraw(amount))
        .to.emit(poolyNFT, "Withdrawn")
        .withArgs(owner.address, amount);

      expect(await provider.getBalance(poolyNFT.address)).to.equal(Zero);
    });

    it("should fail to withdraw if not owner", async () => {
      await expect(poolyNFT.connect(stranger).withdraw(nftPrice)).to.be.revertedWith(
        "Ownable/caller-not-owner"
      );
    });

    it("should fail to withdraw if amount withdrawn is not greater than zero", async () => {
      await expect(poolyNFT.withdraw(toWei("0"))).to.be.revertedWith(
        "PTNFT/withdraw-amount-gt-zero"
      );
    });
  });
});
