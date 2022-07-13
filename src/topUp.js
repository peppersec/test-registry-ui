import "dotenv/config";

import { parseUnits, parseEther } from "ethers/lib/utils";

import config from "../config";

import { getSignerFromAddress, getToken } from "./utils";

const { WALLET_ADDRESS } = process.env;

const stealMoney =
  (walletAddress) =>
  async ([name, tokenAddress]) => {
    try {
      console.log(`transfer ${name} to wallet`);

      const whale = await getSignerFromAddress(
        config.whales[name] || config.deflationaryWhales[name]
      );

      const token = getToken(tokenAddress).connect(whale);

      const decimals = await token.callStatic.decimals();

      await token.transfer(
        walletAddress || WALLET_ADDRESS,
        parseUnits(
          config.tokenAmount[name] || config.deflationaryTokenAmount[name],
          decimals
        )
      );
    } catch (e) {
      console.error("stealMoney", name, tokenAddress, e.message);
    }
  };

async function topUpEther(address, amount) {
  const ethWhale = await getSignerFromAddress(config.whales.eth);

  await ethWhale.sendTransaction({
    to: address || WALLET_ADDRESS,
    value: parseEther(amount || config.tokenAmount.eth),
  });
}

async function topUpTorn(address, amount) {
  const tornWhale = await getSignerFromAddress(config.whales.torn);
  const tornToken = getToken(config.tokenAddresses.torn).connect(tornWhale);

  await tornToken.transfer(
    address || WALLET_ADDRESS,
    parseEther(amount || config.tokenAmount.torn)
  );
}

async function topUpWallet(address) {
  console.log("transfer ether to wallet");
  await topUpEther(address);

  const promises = Object.entries(config.tokenAddresses).map(
    stealMoney(address)
  );

  await Promise.all(promises);
}

async function topUpDeflationary(address) {
  const promises = Object.entries(config.deflationaryTokenAddresses).map(
    stealMoney(address)
  );

  await Promise.all(promises);
}

export { topUpEther, topUpTorn, topUpWallet, topUpDeflationary };
