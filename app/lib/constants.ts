/**
 * Circuit — Constants & Program IDs
 * Source of Truth: Circuit-/INTEGRATION.md (backend-contracts branch)
 */

// ── Program IDs (Devnet) ─────────────────────────────────────────────
export const ESCROW_PROGRAM_ID = '8b866KXrU94jAEuZYNr8WTkuXJELPvu6eW1v89pSAUrN';
export const DROPS_PROGRAM_ID = '3i1KUa7S1FjRx34SzqRAKAYsp3S8AJkCB3x7odjua7kL';
export const GARMENT_MINT = 'G17eNpsCn4S2Xtr4f9t9fmgyf6ZVFEpdXnpqJBiBCFEo';

// ── Network ──────────────────────────────────────────────────────────
export const CLUSTER = 'devnet' as const;
export const RPC_ENDPOINT = 'https://api.devnet.solana.com';
export const SOLSCAN_BASE = 'https://solscan.io';

// ── Drop Config ──────────────────────────────────────────────────────
export const DROP_ID = 'DROP001';
export const DROP_NAME = 'Drop Zero';
export const GARMENT_NAME = 'The Wrap Dress';
export const DESIGNER_PUBKEY = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin';
export const PRICE_SOL = 0.5;
export const PRICE_DISPLAY = '$45';
export const MAX_SUPPLY = 40;
export const FABRIC = 'Nigerian Cotton';
export const PRODUCTION_DATE = 'May 2026';

// ── Simulation ───────────────────────────────────────────────────────
export const SIMULATION_MODE = true;
export const DEMO_START_COUNT = 36;

// ── Brand ────────────────────────────────────────────────────────────
export const BRAND = {
  name: 'Circuit',
  tagline: '...with the edge',
  symbol: 'CRCT',
  royaltyBps: 700,
  royaltyPercent: '7%',
} as const;
