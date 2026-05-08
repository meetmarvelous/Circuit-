# Backend & On-Chain Handover Guide

This document outlines the technical steps required to transition the Circuit frontend from **Simulation Mode** to a fully integrated **Production** environment.

## 1. Database Setup (Supabase)
The frontend uses `lib/db.ts` to interact with the data layer. It is currently configured with a LocalStorage fallback, but is ready for a real Supabase instance.

### SQL Schema
Run the following SQL in your Supabase SQL Editor to initialize the required tables:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table: Maps emails to Solana wallets
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  wallet_address TEXT UNIQUE NOT NULL,
  private_key TEXT NOT NULL, -- CRITICAL: Must be encrypted before storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table: Tracks on-chain transactions and statuses
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  email TEXT NOT NULL, -- Helpful for quick lookups
  drop_id TEXT NOT NULL,
  tx_signature TEXT UNIQUE NOT NULL,
  escrow_pda TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'delivered', 'cancelled'
  amount_sol DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 2. Encryption Requirements
In the current `lib/db.ts`, the `private_key` for the "Invisible Wallet" is stored as plain text for demonstration purposes. 
- **Requirement**: Implement a server-side or secure client-side encryption/decryption module before storing or retrieving the `private_key`.
- **Note**: The user's password or a secondary secure salt should be used as the encryption key to ensure even the database admin cannot access user funds.

## 3. Solana On-Chain Integration
The technical blueprint for all on-chain calls (Escrow, Drop Registry, and NFT Metadata) is located in **`INTEGRATION.md`** in the project root.

### Steps to "Go Live":
1. **Disable Simulation**: Set `NEXT_PUBLIC_SIMULATION_MODE=false` in `.env.local`.
2. **Update RPC**: Replace the public devnet RPC with a production-grade endpoint (Helius, Alchemy, etc.).
3. **Wire Instructions**: Replace the mock success responses in the UI components (e.g., in `/drop` and `/confirm` pages) with the Anchor RPC calls detailed in `INTEGRATION.md`.

## 4. Environment Variables
Ensure the following variables are set in your deployment environment (Vercel):

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your Supabase Anon/Public Key |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Solana Cluster URL (Devnet/Mainnet) |
| `NEXT_PUBLIC_SIMULATION_MODE` | `true` for demo, `false` for live transactions |

## 5. Authentication Flow
- **Provider**: `lib/auth-context.tsx`.
- **Mechanism**: The `SignInModal` handles the email-to-wallet mapping. If a user exists, it retrieves their existing wallet; if not, it generates a new Keypair and saves the mapping via `saveUserMapping`.

---
**Handover Point**: The UI is 100% complete and verified. The state management and routing are robust. The project is ready for the "live" wiring of the database and blockchain services.
