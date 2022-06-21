import { providers, Contract } from "ethers";

import { erc20Abi } from "../abi";

const { RPC_URL } = process.env;

const provider = new providers.JsonRpcProvider(RPC_URL);

async function getSignerFromAddress(address) {
  await provider.send("hardhat_impersonateAccount", [address]);

  return provider.getUncheckedSigner(address);
}

function getToken(tokenAddress) {
  return new Contract(tokenAddress, erc20Abi);
}

export { getSignerFromAddress, getToken };
