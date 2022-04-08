import "dotenv/config";

import { ethers } from "ethers";
import { namehash } from "ethers/lib/utils";

import config from "../config";
import { ensResolverAbi, registryAbi } from "../abi";

import { topUpEther, topUpTorn } from "./topUp";
import { getSignerFromAddress, getToken } from "./utils";

const { MAINNET_RELAYER_URL, BSC_RELAYER_URL } = process.env;

let ensSigner;
let ensResolver;

function getEnsResolver(ensResolver) {
  return new ethers.Contract(ensResolver, ensResolverAbi);
}

function getRelayerRegistry() {
  return new ethers.Contract(
    "0x58E8dCC13BE9780fC42E8723D8EaD4CF46943dF2",
    registryAbi
  );
}

async function setUrlRecord(subdomain, url) {
  await ensResolver
    .connect(ensSigner)
    .setText(namehash(`${subdomain}.${config.ensDomain}`), "url", url);
}

async function prepare() {
  ensSigner = await getSignerFromAddress(config.relayer);

  ensResolver = getEnsResolver(config.ensResolver).connect(ensSigner);
}

async function register() {
  try {
    console.log("register relayer in registry");
    const amount = ethers.utils.parseUnits("300")._hex;

    const token = getToken(config.tokenAddresses.torn).connect(ensSigner);

    const registryContract = getRelayerRegistry().connect(ensSigner);
    await token.approve(registryContract.address, amount);

    await registryContract.register(config.ensDomain, amount, config.workers);
  } catch (err) {
    console.log(`Registry error: ${err.message}`);
  }
}

async function setup() {
  console.log("transfer torn to relayer");
  await topUpTorn(config.relayer);

  console.log("transfer ether to relayer");
  await topUpEther(config.relayer);

  console.log("set mainnet url record");
  await setUrlRecord(
    "mainnet-tornado",
    MAINNET_RELAYER_URL || config.ensSubdomains.mainnet
  );

  console.log("set bsc url record");
  await setUrlRecord(
    "bsc-tornado",
    BSC_RELAYER_URL || config.ensSubdomains.bsc
  );
}

async function main() {
  await prepare();
  await setup();
  await register();
}

main();
