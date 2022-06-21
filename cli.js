import { program } from "commander";

import {
  topUpEther,
  topUpTorn,
  topUpWallet,
  topUpDeflationary,
} from "./src/topUp";

async function main() {
  program
    .command("ether")
    .description("Send Ether")
    .option("-w, --wallet <address>", "Wallet that will receive ether")
    .option("-a, --amount <number>", "Amount to send")
    .action(async (options) => {
      console.log("transfer ether");
      await topUpEther(options.wallet, options.amount);
    });

  program
    .command("torn")
    .description("Send TORN")
    .option("-w, --wallet <address>", "Wallet that will receive TORN")
    .option("-a, --amount <number>", "Amount to send")
    .action(async (options) => {
      console.log("transfer torn");
      await topUpTorn(options.wallet, options.amount);
    });

  program
    .command("wallet")
    .description("Send pre-configured test tokens")
    .option("-w, --wallet <address>", "Wallet that will receive tokens")
    .action(async (options) => {
      await topUpWallet(options.wallet);
    });

  program
    .command("deflationary")
    .description("Send pre-configured deflationary test tokens")
    .option("-w, --wallet <address>", "Wallet that will receive tokens")
    .action(async (options) => {
      await topUpDeflationary(options.wallet);
    });

  try {
    await program.parseAsync(process.argv);
    process.exit(0);
  } catch (e) {
    console.log("Error:", e);
    process.exit(1);
  }
}

main();
