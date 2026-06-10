'use client'; // Menandakan bahwa ini adalah komponen Client-side

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';

// Import CSS bawaan UI untuk tombol Wallet
import '@solana/wallet-adapter-react-ui/styles.css';

export default function SolanaProvider({ children }) {
    // Targetkan jaringan devnet
    const endpoint = useMemo(() => clusterApiUrl('devnet'), []);

    // Daftar opsi Wallet yang bisa dipakai (Phantom)
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
        ],
        []
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}
