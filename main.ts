import { PublicKey, Connection, Cluster, clusterApiUrl } from "@solana/web3.js";
import { Pager } from "./pager";
import Big from "big.js";
import * as anchor from "@project-serum/anchor";
import * as sbv2 from "@switchboard-xyz/switchboard-v2";
import * as dotenv from "dotenv"; // should be loaded upon entry
dotenv.config();

async function main() {
  const program = await getProgram(process.env.CLUSTER! as Cluster);
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
  const queueAccount = new sbv2.OracleQueueAccount({
    program,
    publicKey: queueKey,
  });
  const [leaseAccount] = sbv2.LeaseAccount.fromSeed(
    program,
    queueAccount,
    aggregatorAccount
  );
  while (true) {
    const balance = await leaseAccount.getBalance();
    if (balance < pageThreshold) {
      await Pager.sendEvent(
        pagerKey,
        "critical",
        `Switchboard feed ${aggregatorPubkey.toBase58()} is running low on funds.`,
        {
          balance,
        }
      );
    }
  }
}

async function getProgram(cluster: Cluster): Promise<anchor.Program> {
  switch (cluster) {
    case "devnet": {
      const connection = new Connection(clusterApiUrl(cluster));
      const dummyKeypair = anchor.web3.Keypair.generate();
      const wallet = new anchor.Wallet(dummyKeypair);
      const provider = new anchor.Provider(connection, wallet, {
        commitment: "processed",
        preflightCommitment: "processed",
      });
      const anchorIdl = await anchor.Program.fetchIdl(
        sbv2.SBV2_DEVNET_PID,
        provider
      );
      return new anchor.Program(anchorIdl!, sbv2.SBV2_DEVNET_PID, provider);
    }
    case "mainnet-beta": {
      {
        const connection = new Connection(clusterApiUrl(cluster));
        const dummyKeypair = anchor.web3.Keypair.generate();
        const wallet = new anchor.Wallet(dummyKeypair);
        const provider = new anchor.Provider(connection, wallet, {
          commitment: "processed",
          preflightCommitment: "processed",
        });
        const anchorIdl = await anchor.Program.fetchIdl(
          sbv2.SBV2_MAINNET_PID,
          provider
        );
        return new anchor.Program(anchorIdl!, sbv2.SBV2_MAINNET_PID, provider);
      }
    }
    default:
      throw new Error(`not implemented for cluster ${cluster}`);
  }
}

main().then(
  () => {
    process.exit();
  },
  (err) => {
    console.error(err);
    process.exit(0);
  }
);
