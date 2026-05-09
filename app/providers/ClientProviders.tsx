'use client';

import { AuthProvider } from '@/lib/auth-context';
import SolanaWalletProvider from './WalletProvider';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SolanaWalletProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </SolanaWalletProvider>
  );
}
