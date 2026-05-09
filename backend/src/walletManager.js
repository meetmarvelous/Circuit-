'use strict';

const { DatabaseSync } = require('node:sqlite');
const CryptoJS  = require('crypto-js');
const {
  Keypair,
  Connection,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} = require('@solana/web3.js');
const path = require('path');
const fs   = require('fs');
const os   = require('os');

const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) throw new Error('SECRET_KEY is not set in environment');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(path.join(__dirname, '../data/wallets.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS wallets (
    user_id     TEXT PRIMARY KEY,
    enc_key     TEXT NOT NULL,
    public_key  TEXT NOT NULL,
    created_at  TEXT NOT NULL
  )
`);

// Encrypt a byte array → AES ciphertext string
function encrypt(secretKeyArray) {
  return CryptoJS.AES.encrypt(JSON.stringify(secretKeyArray), SECRET_KEY).toString();
}

// Decrypt ciphertext → Keypair
function decrypt(ciphertext) {
  const bytes   = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  const decoded = bytes.toString(CryptoJS.enc.Utf8);
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(decoded)));
}

/**
 * Create a new Solana keypair for userId and persist it encrypted.
 * Idempotent — returns existing wallet if already created.
 * New wallets are auto-funded with 0.5 SOL from the deployer wallet.
 */
async function createWallet(userId) {
  const existing = db.prepare('SELECT public_key FROM wallets WHERE user_id = ?').get(userId);
  if (existing) {
    return { publicKey: existing.public_key, created: false };
  }

  const keypair = Keypair.generate();
  const encKey  = encrypt(Array.from(keypair.secretKey));

  db.prepare(`
    INSERT INTO wallets (user_id, enc_key, public_key, created_at)
    VALUES (?, ?, ?, ?)
  `).run(userId, encKey, keypair.publicKey.toBase58(), new Date().toISOString());

  const connection = new Connection(clusterApiUrl('devnet'));

  // Load deployer keypair - try env var first (Railway), then file (local)
  let deployerKeypair;
  if (process.env.DEPLOYER_KEYPAIR) {
    deployerKeypair = Keypair.fromSecretKey(
      Buffer.from(process.env.DEPLOYER_KEYPAIR, 'base64')
    );
  } else {
    const keypairData = JSON.parse(fs.readFileSync(os.homedir() + '/.config/solana/id.json', 'utf-8'));
    deployerKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
  }

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: deployerKeypair.publicKey,
      toPubkey:   keypair.publicKey,
      lamports:   2 * LAMPORTS_PER_SOL,
    })
  );

  await sendAndConfirmTransaction(connection, transaction, [deployerKeypair]);

  return { publicKey: keypair.publicKey.toBase58(), created: true };
}

/**
 * Return the decrypted Keypair for userId (used internally for signing).
 * Never expose the Keypair or secret key over the API.
 */
function getKeypair(userId) {
  const row = db.prepare('SELECT enc_key FROM wallets WHERE user_id = ?').get(userId);
  if (!row) throw new Error(`No wallet found for user: ${userId}`);
  return decrypt(row.enc_key);
}

/**
 * Return the public key (safe to expose over API).
 */
function getWallet(userId) {
  const row = db.prepare('SELECT public_key FROM wallets WHERE user_id = ?').get(userId);
  if (!row) return null;
  return { publicKey: row.public_key };
}

module.exports = { createWallet, getKeypair, getWallet };
