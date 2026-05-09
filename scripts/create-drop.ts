import { createUmi }     from "@metaplex-foundation/umi-bundle-defaults";
import * as anchor        from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Connection, clusterApiUrl } from "@solana/web3.js";
import * as fs            from "fs";
import * as os            from "os";
import * as path          from "path";

const PROGRAM_ID = new PublicKey("3i1KUa7S1FjRx34SzqRAKAYsp3S8AJkCB3x7odjua7kL");
const DROP_ID    = "drop-zero";
const MAX_SUPPLY = 40;

const IDL = {
  address:  "3i1KUa7S1FjRx34SzqRAKAYsp3S8AJkCB3x7odjua7kL",
  metadata: { name: "circuit_drops", version: "0.1.0", spec: "0.1.0" },
  instructions: [{
    name: "create_drop",
    discriminator: [157, 142, 145, 247, 92, 73, 59, 48],
    accounts: [
      { name: "designer",      writable: true, signer: true },
      { name: "drop_account",  writable: true },
      { name: "system_program", address: "11111111111111111111111111111111" },
    ],
    args: [
      { name: "drop_id",    type: "string" },
      { name: "max_supply", type: "u64"    },
    ],
  }],
  accounts: [{ name: "DropAccount", discriminator: [173, 242, 121, 245, 229, 150, 14, 87] }],
  types: [{
    name: "DropAccount",
    type: {
      kind: "struct",
      fields: [
        { name: "designer",      type: "pubkey" },
        { name: "max_supply",    type: "u64"    },
        { name: "current_count", type: "u64"    },
        { name: "drop_id",       type: "string" },
        { name: "active",        type: "bool"   },
        { name: "bump",          type: "u8"     },
      ],
    },
  }],
  errors: [],
};

async function main() {
  const keypairPath = path.join(os.homedir(), ".config", "solana", "id.json");
  const secretKey   = Uint8Array.from(JSON.parse(fs.readFileSync(keypairPath, "utf-8")));

  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const wallet     = new anchor.Wallet(anchor.web3.Keypair.fromSecretKey(secretKey));
  const provider   = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });

  const program = new anchor.Program(IDL as anchor.Idl, provider);

  const [dropPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("drop"), Buffer.from(DROP_ID)],
    PROGRAM_ID
  );

  // Check if already exists
  const existing = await connection.getAccountInfo(dropPda);
  if (existing) {
    console.log("Drop already exists on-chain:");
    console.log(`  PDA      : ${dropPda.toBase58()}`);
    const data = await (program.account as any)["dropAccount"].fetch(dropPda) as any;
    console.log(`  drop_id  : ${data.dropId}`);
    console.log(`  supply   : ${data.currentCount}/${data.maxSupply}`);
    console.log(`  active   : ${data.active}`);
    return;
  }

  console.log(`Creating drop '${DROP_ID}' with max_supply=${MAX_SUPPLY} on devnet...`);

  const sig = await program.methods
    .createDrop(DROP_ID, new anchor.BN(MAX_SUPPLY))
    .accounts({
      designer:      wallet.publicKey,
      dropAccount:   dropPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("════════════════════════════════════════════════");
  console.log("  Drop created successfully");
  console.log("════════════════════════════════════════════════");
  console.log(`  drop_id  : ${DROP_ID}`);
  console.log(`  PDA      : ${dropPda.toBase58()}`);
  console.log(`  tx       : ${sig}`);
  console.log(`  Explorer : https://explorer.solana.com/tx/${sig}?cluster=devnet`);
}

main().catch((err: unknown) => {
  console.error("Failed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
