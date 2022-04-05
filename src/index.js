require("dotenv").config();

const { ethers } = require("ethers");
const { namehash } = require("ethers/lib/utils");

const config = require("../config.json");
const erc20Abi = require("../abi/erc20.json");
const ensResolverAbi = require("../abi/ensResolver.json");
const registryAbi = require("../abi/relayerRegistry.json");

const { RPC_URL, MAINNET_RELAYER_URL, BSC_RELAYER_URL } = process.env;

let whale;
let ensSigner;
let tornToken;
let ensResolver;

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

async function getSignerFromAddress(address) {
  await provider.send("hardhat_impersonateAccount", [address])

  let signer = await provider.getSigner(address)
  signer.address = signer._address
  return signer
}

function getToken(tokenAddress) {
  return new ethers.Contract(tokenAddress, erc20Abi)
}

function getEnsResolver(ensResolver) {
  return new ethers.Contract(ensResolver, ensResolverAbi)
}

function getRelayerRegistry() {
  return new ethers.Contract('0x58E8dCC13BE9780fC42E8723D8EaD4CF46943dF2', registryAbi)
}

async function setUrlRecord(subdomain, url) {
  await ensResolver
      .connect(ensSigner)
      .setText(namehash(`${subdomain}.${config.ensDomain}`), "url", url)
}

async function prepare() {
  whale = await getSignerFromAddress(config.whale)
  ensSigner = await getSignerFromAddress(config.relayer)

  tornToken = getToken(config.tokenAddresses.torn).connect(whale)

  ensResolver = getEnsResolver(config.ensResolver).connect(ensSigner)
}

function sleep(timeout = 5000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, timeout)
  })
}

async function register(subdomain) {
  try {
    const amount = ethers.utils.parseUnits('300')._hex
    const ensName = `${subdomain}.${config.ensDomain}`

    const token = getToken(config.tokenAddresses.torn).connect(ensSigner)

    const registryContract = getRelayerRegistry().connect(ensSigner)
    await token.approve(registryContract.address, amount)

    const tx = await registryContract.register(ensName, amount, [])

    console.log('Relayer registry txHash:', tx.hash)

    await sleep()

    const relayer = await registryContract.relayers(ensSigner.address)
    console.log("RELAYER -", relayer)
    return txHash
  } catch (err) {
    console.log(`Registry error: ${err.message}`)
  }
}

async function setup() {
  console.log("transfer torn to relayer");
  await tornToken.transfer(config.relayer, ethers.utils.parseEther("10000"))

  console.log("transfer ether to relayer")
  await whale.sendTransaction({
    to: config.relayer,
    value: ethers.utils.parseEther("1000"),
  });

  console.log("set mainnet url record");
  await setUrlRecord("mainnet-tornado", MAINNET_RELAYER_URL)
  await register("mainnet-tornado")

  console.log("set bsc url record");
  await setUrlRecord("bsc-tornado", BSC_RELAYER_URL)

}

async function main() {
  await prepare()
  await setup()
}

main()
