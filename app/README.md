# Circuit Frontend (Next.js)

This is the core frontend application for the Circuit Protocol, built with Next.js.

## 🚀 Getting Started

### 1. Installation
Install dependencies from the root directory or the `/app` directory:
```bash
npm install
```

### 2. Environment Setup
Create a `.env.local` file based on `.env.example`. Required keys:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SOLANA_RPC_URL`

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🛠️ Implementation Details
- **Simulation Mode**: The app is currently configured to run in simulation mode (`NEXT_PUBLIC_SIMULATION_MODE=true`). This allows for end-to-end testing of the "Invisible Blockchain" flow without requiring actual wallet signatures or SOL on devnet.
- **State Management**: Uses a custom `AuthProvider` and `WalletProvider` to handle persistent user sessions and simulated wallet mappings.
- **Routing**:
  - `/drop`: Product selection and initial order escrow.
  - `/confirm`: Order confirmation and production initiation.
  - `/garment/[mint]`: Digital Product Passport interface for garment authentication.

## 📦 Deployment
The application is optimized for deployment on **Vercel**.
- **Root Directory**: `app`
- **Framework Preset**: Next.js
- **Environment Variables**: Must be configured in the Vercel dashboard.

---
For technical details regarding on-chain integration, refer to the `INTEGRATION.md` file in the project root.
