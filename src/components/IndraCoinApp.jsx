'use client';

import React, { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';

export default function IndraCoinApp() {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const [balance, setBalance] = useState(0);

    const INDRA_COIN_MINT_ADDRESS = new PublicKey(
        process.env.NEXT_PUBLIC_INDRA_COIN_MINT_ADDRESS || "11111111111111111111111111111111" // Dummy address default
    );

    const fetchBalance = async () => {
        if (!publicKey) return;

        try {
            const tokenAccountAddress = await getAssociatedTokenAddress(
                INDRA_COIN_MINT_ADDRESS,
                publicKey
            );

            const tokenAccountInfo = await connection.getTokenAccountBalance(tokenAccountAddress);
            setBalance(tokenAccountInfo.value.uiAmount);
        } catch (error) {
            console.warn("Gagal mengambil saldo (atau token account belum ada):", error.message);
            setBalance(0);
        }
    };

    useEffect(() => {
        fetchBalance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [publicKey, connection]);

    return (
        <div className="app-container">
            <div className="glass-card">
                <div className="header">
                    <h1>Indra Coin 🎓🪙</h1>
                    <p>Sistem Reward Poin Kampus Web3</p>
                </div>
                
                <div className="wallet-section">
                    <WalletMultiButton className="wallet-btn" />
                </div>

                {publicKey ? (
                    <div className="dashboard-section slide-up">
                        <div className="status-badge connected">
                            <span className="dot"></span> Wallet Terhubung
                        </div>
                        
                        <div className="info-group">
                            <label>Alamat Wallet</label>
                            <div className="address-box">
                                {publicKey.toBase58().substring(0, 8)}...{publicKey.toBase58().slice(-8)}
                            </div>
                        </div>

                        <div className="balance-card">
                            <h2>Saldo Anda</h2>
                            <div className="balance-amount">
                                {balance} <span className="currency">INDC</span>
                            </div>
                        </div>

                        <p className="hint">
                            *Kumpulkan lebih banyak koin dengan berbelanja di Kantin untuk ditukar dengan voucher menarik!
                        </p>
                    </div>
                ) : (
                    <div className="dashboard-section empty-state">
                        <p>Hubungkan Phantom Wallet Anda untuk memulai pengumpulan koin.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
