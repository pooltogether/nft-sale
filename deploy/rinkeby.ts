import { HardhatRuntimeEnvironment } from "hardhat/types";

export default async function deployToRinkeby(hardhat: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hardhat;
  const { utils } = ethers;
  const { parseEther: toWei } = utils;

  const { deploy } = deployments;
  const { getContractAt, provider } = ethers;
  const { deployer } = await getNamedAccounts();

  const currentTimestamp = (await provider.getBlock("latest")).timestamp;

  const poolyNFTResult = await deploy("PoolyNFT", {
    from: deployer,
    args: [
      "PoolTogether NFT",
      "PTNFT",
      toWei("0.1"),
      5,
      1,
      currentTimestamp + 60,
      currentTimestamp + 604800,
      deployer,
    ],
  });

  const poolyNFT = await getContractAt("PoolyNFT", poolyNFTResult.address);
  await poolyNFT.setBaseURI("ipfs://bafybeihzwpdekj7hgrnk5og63rb57omhyio24keuablji6kmp5biffcrpa");
}
