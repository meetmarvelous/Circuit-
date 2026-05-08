# Project Technical Documentation: Circuit MVP

This document provides a comprehensive overview of the Circuit Protocol frontend development, features implemented, and the technical architecture.

## 1. Project Vision: "Invisible Blockchain"

The core goal of this phase was to implement a world-class luxury UX that abstracts away the complexities of blockchain interaction while maintaining decentralization and trustless security.

## 2. Key Features Implemented

### 🛡️ Authentication & Identity

- **Email-to-Wallet Mapping**: A seamless onboarding flow where users sign in with an email/social account.
- **Background Wallet Creation**: Automated Solana wallet generation for new users, stored securely in the database/localStorage.
- **Persistent Sessions**: Custom `AuthProvider` ensuring users stay logged in across page refreshes and browser sessions.
- **Private Key Export**: A UI feature in the profile dropdown allowing advanced users to export their auto-generated private key for self-custody.

### 📦 Product & Order Flow

- **Product Drop (`/drop`)**: A high-fidelity interface for exploring the current collection (Drop Zero). Includes size selection and initial order simulation.
- **Order Confirmation (`/confirm`)**: A step-by-step verification flow for delivery details and payment authorization.
- **Digital Product Passport (`/garment/[mint]`)**: A dedicated page for authenticating physical garments. Fetches on-chain metadata (Metaplex) and displays provenance, production details, and ownership history.

### 🎨 Design System

- **Aesthetic**: Monochrome, high-contrast, luxury fashion aesthetic using "Outfit" and "Montserrat" typography.
- **Responsive Layouts**: Fully audited for Mobile, Tablet, and Desktop viewports.
- **Components**: Custom library of reusable components (Buttons, Modals, Toasts, Cards) styled with Vanilla CSS for maximum performance and design fidelity.

## 3. Technical Architecture

### Tech Stack

- **Framework**: Next.js 15 (App Router).
- **Styling**: Vanilla CSS (Global variables + Modules).
- **Data Layer**: Supabase (JS Client) with a robust LocalStorage fallback mechanism.
- **Solana Integration**: `@solana/web3.js` and `@coral-xyz/anchor` for program interaction.

### State Management

- **Auth Context**: Manages user identity, session state, and wallet mapping.
- **Simulation Engine**: Controlled via `NEXT_PUBLIC_SIMULATION_MODE`, allowing the entire app to run without real SOL/signatures for demo stability.

## 4. Current Progress Summary

| Category                 | Status  | Details                                                        |
| :----------------------- | :------ | :------------------------------------------------------------- |
| **UI/UX Implementation** | ✅ 100% | All pages, modals, and responsive states completed.            |
| **Routing & Navigation** | ✅ 100% | Seamless SPA transitions and deep linking.                     |
| **Auth Infrastructure**  | ✅ 100% | User-to-wallet mapping and persistence active.                 |
| **On-Chain Blueprint**   | ✅ 100% | Integration guide (IDLs/RPC) documented.                       |
| **Database Wiring**      | ⏳ 80%  | `lib/db.ts` ready; requires final keys for live Supabase sync. |

## 5. Deployment Status

- **Target Platform**: Vercel.
- **Build Status**: Verified (npm run build) with zero errors/warnings.
- **Environment**: Configured for `vercel.json` with optimized headers and performance settings.
