import { PublicKey } from "@solana/web3.js";
import { Pager } from "./pager";
import Big from "big.js";
import * as anchor from "@project-serum/anchor";
import * as sbv2 from "@switchboard-xyz/switchboard-v2";
import * as dotenv from "dotenv"; // should be loaded upon entry
dotenv.config();

async function main() {
  if (process.env.CLUSTER === "mainnet") {
    process.env.CLUSTER = "mainnet-beta";
  }
  const aggregatorPubkey: PublicKey = new PublicKey(
    process.env.AGGREGATOR_KEY!
  );
  const aggregatorAccount = new sbv2.AggregatorAccount({
    program,
    publicKey: aggregatorPubkey,
  });
  const pagerKey = process.env.PAGERDUTY_EVENT_KEY!;
  const pageThreshold: number = +process.env.PAGE_THRESHOLD!;
  const aggregator = await aggregatorAccount.loadData();
  const queueKey = aggregator.queuePubkey;
  const queueAccount = new sbv2.QueueAccount({
    program,
    publicKey: queueKey,
  });
  const leaseAccount = new sbv2.LeaseAccount.fromSeed(
    program,
    queueAccount,
    aggregatorAccount
  );
  while (true) {
    const balance = leaseAccount.getBalance();
    if (balance < pageThreshold) {
      await Pager.sendEvent(
        "critical",
        `Switchboard feed ${aggregatorPubkey.toBase58()} is running low on funds.`,
        {
          balance: balance,
        }
      );
    }
  }
}

main().then(
  () => {
    process.exit();
  },
  (err) => {
    logger.error(err);
    process.exit(0);
  }
);
