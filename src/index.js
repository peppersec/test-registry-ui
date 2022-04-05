require("dotenv").config();

const { ethers } = require("ethers");
const { namehash } = require("ethers/lib/utils");

const config = require("../config.json");

const erc20Abi = require("../abi/erc20.json");
const ensResolverAbi = require("../abi/ensResolver.json");
const registryAbi = require("../abi/relayerRegistry.json");

const { RPC_URL, WALLET_ADDRESS, MAINNET_RELAYER_URL, BSC_RELAYER_URL } =
  process.env;

let ethWhale;
let tornWhale;
let ensSigner;
let tornToken;
let ensResolver;

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

async function getSignerFromAddress(address) {
  await provider.send("hardhat_impersonateAccount", [address]);

  let signer = await provider.getSigner(address);
  signer.address = signer._address;
  return signer;
}

function getToken(tokenAddress) {
  return new ethers.Contract(tokenAddress, erc20Abi);
}

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
  ethWhale = await getSignerFromAddress(config.whales.eth);
  tornWhale = await getSignerFromAddress(config.whales.torn);
  ensSigner = await getSignerFromAddress(config.relayer);

  tornToken = getToken(config.tokenAddresses.torn).connect(tornWhale);

  ensResolver = getEnsResolver(config.ensResolver).connect(ensSigner);
}

async function register() {
  try {
    console.log("register relayer in registry");
    const amount = ethers.utils.parseUnits("300")._hex;

    const token = getToken(config.tokenAddresses.torn).connect(ensSigner);

    const registryContract = getRelayerRegistry().connect(ensSigner);
    await token.approve(registryContract.address, amount);

    const tx = await registryContract.register(
      config.ensDomain,
      amount,
      config.workers
    );
  } catch (err) {
    console.log(`Registry error: ${err.message}`);
  }
}

async function setup() {
  console.log("transfer torn to relayer");
  await tornToken.transfer(
    config.relayer,
    ethers.utils.parseEther(config.tokenAmount.torn)
  );

  console.log("transfer ether to relayer");
  await ethWhale.sendTransaction({
    to: config.relayer,
    value: ethers.utils.parseEther(config.tokenAmount.eth),
  });

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

const stealMoney = async ([name, address]) => {
  try {
    console.log(`transfer ${name} to wallet`);

    const whale = await getSignerFromAddress(config.whales[name]);

    const token = getToken(address).connect(whale);

    const decimals = await token.callStatic.decimals();

    await token.transfer(
      WALLET_ADDRESS,
      ethers.utils.parseUnits(config.tokenAmount[name], decimals)
    );
  } catch (e) {
    console.error("stealMoney", name, address, e.message);
  }
};

async function topUpWallet() {
  console.log("transfer ether to wallet");
  await ethWhale.sendTransaction({
    to: WALLET_ADDRESS,
    value: ethers.utils.parseEther(config.tokenAmount.eth),
  });

  const promises = Object.entries(config.tokenAddresses).map(stealMoney);

  await Promise.all(promises);
}

async function main() {
  await prepare();
  await setup();
  await register();

  await topUpWallet();
}

main();
