require("dotenv").config();

const { ethers } = require("ethers");
const { namehash } = require("ethers/lib/utils");

const config = require("../config.json");
const erc20Abi = require("../abi/erc20.json");
const ensResolverAbi = require("../abi/ensResolver.json");

const { RPC_URL, MAINNET_RELAYER_URL, BSC_RELAYER_URL } = process.env;

let whale;
let ensSigner;
let tornToken;
let ensResolver;

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

const getSignerFromAddress = async (address) => {
  await provider.send("hardhat_impersonateAccount", [address]);

  let signer = await provider.getSigner(address);
  signer.address = signer._address;
  return signer;
};

const getToken = (tokenAddress) => {
  return new ethers.Contract(tokenAddress, erc20Abi);
};

const getEnsResolver = (ensResolver) => {
  return new ethers.Contract(ensResolver, ensResolverAbi);
};

const setUrlRecord = async (subdomain, url) => {
  await ensResolver
    .connect(ensSigner)
    .setText(namehash(`${subdomain}.${config.ensDomain}`), "url", url);
};

async function prepare() {
  whale = await getSignerFromAddress(config.whale);
  ensSigner = await getSignerFromAddress(config.relayer);

  tornToken = getToken(config.tokenAddresses.torn).connect(whale);

  ensResolver = getEnsResolver(config.ensResolver).connect(ensSigner);
}

async function setup() {
  console.log("transfer torn to relayer");
  await tornToken.transfer(config.relayer, ethers.utils.parseEther("10000"));

  console.log("transfer ether to relayer");
  await whale.sendTransaction({
    to: config.relayer,
    value: ethers.utils.parseEther("1000"),
  });

  console.log("set mainnet url record");
  await setUrlRecord("mainnet-tornado", MAINNET_RELAYER_URL);

  console.log("set bsc url record");
  await setUrlRecord("bsc-tornado", BSC_RELAYER_URL);
}

async function main() {
  await prepare();
  await setup();
}

main();
