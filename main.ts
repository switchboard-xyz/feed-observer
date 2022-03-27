import { PublicKey } from "@solana/web3.js";
import { Pager } from "./pager";
import Big from "big.js";
import * as dotenv from "dotenv"; // should be loaded upon entry
dotenv.config();

async function main() {
  if (process.env.CLUSTER === "mainnet") {
    process.env.CLUSTER = "mainnet-beta";
  }
  let aggregatorPubkey: PublicKey = new PublicKey(process.env.AGGREGATOR_KEY!);
  while (true) {}
}

main().then(
  () => {
    logger.info("Ran node successfully.");
    process.exit();
  },
  (err) => {
    logger.error("Node failure.");
    logger.error(err);
    process.exit(0);
  }
);
