import { HardhatRuntimeEnvironment } from "hardhat/types";

export default async function deployToMainnet(hardhat: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hardhat;
  const { utils } = ethers;
  const { parseEther: toWei } = utils;

  const { deploy } = deployments;
  const { getContractAt } = ethers;
  const { deployer } = await getNamedAccounts();

  const gnosisSafeAddress = '0x3927E0642C432A934a4EAA64C79bC8a1D8ac5Fb7';

  const maxMint = 20;
  const startTimestamp = 1653429600; // May 24, 2022, 10:00:00 PM UTC
  const endTimestamp = 1655956800; // Jun 23, 2022, 4:00:00 AM UTC

  const poolyOneResult = await deploy("PoolyNFT-1", {
    contract: 'PoolyNFT',
    from: deployer,
    args: [
      "Pooly - Supporter",
      "POOLY1",
      toWei("0.1"),
      10000,
      maxMint,
      startTimestamp,
      endTimestamp,
      deployer,
    ],
    skipIfAlreadyDeployed: true,
  });

  const poolyTwoResult = await deploy("PoolyNFT-2", {
    contract: 'PoolyNFT',
    from: deployer,
    args: [
      "Pooly - Lawyer",
      "POOLY2",
      toWei("1"),
      1000,
      maxMint,
      startTimestamp,
      endTimestamp,
      deployer,
    ],
    skipIfAlreadyDeployed: true,
  });

  const poolyThreeResult = await deploy("PoolyNFT-3", {
    contract: 'PoolyNFT',
    from: deployer,
    args: [
      "Pooly - Judge",
      "POOLY3",
      toWei("75"),
      10,
      10,
      startTimestamp,
      endTimestamp,
      deployer,
    ],
    skipIfAlreadyDeployed: true,
  });

  const poolyOne = await getContractAt("PoolyNFT", poolyOneResult.address);
  await poolyOne.transferOwnership(gnosisSafeAddress);

  const poolyTwo = await getContractAt("PoolyNFT", poolyTwoResult.address);
  await poolyTwo.transferOwnership(gnosisSafeAddress);

  const poolyThree = await getContractAt("PoolyNFT", poolyThreeResult.address);
  await poolyThree.transferOwnership(gnosisSafeAddress);
}
