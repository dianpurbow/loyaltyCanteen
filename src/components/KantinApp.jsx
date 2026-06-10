'use client';

import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';

export default function KantinApp() {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    
    const [recipientAddress, setRecipientAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const INDRA_COIN_MINT_ADDRESS = new PublicKey(
        process.env.NEXT_PUBLIC_INDRA_COIN_MINT_ADDRESS || "11111111111111111111111111111111"
    );

    const handleSendPoin = async (e) => {
        e.preventDefault();
        
        if (!publicKey) {
            setStatus('Error: Hubungkan dompet Kantin terlebih dahulu.');
            return;
        }

        try {
            setIsLoading(true);
            setStatus('Memproses transaksi...');

            const recipientPubKey = new PublicKey(recipientAddress);
            const transferAmount = parseInt(amount);

            if (isNaN(transferAmount) || transferAmount <= 0) {
                throw new Error("Jumlah poin harus berupa angka lebih dari 0");
            }

            // 1. Cari ATA pengirim (Kantin)
            const senderATA = await getAssociatedTokenAddress(INDRA_COIN_MINT_ADDRESS, publicKey);
            
            // 2. Cari ATA penerima (Mahasiswa)
            // Catatan: Asumsinya ATA penerima sudah ada. Jika belum, dalam skenario nyata
            // Kantin harus mensubsidi biaya pembuatan ATA (createAssociatedTokenAccountInstruction)
            const recipientATA = await getAssociatedTokenAddress(INDRA_COIN_MINT_ADDRESS, recipientPubKey);

            // 3. Buat Instruksi Transfer
            const transferIx = createTransferInstruction(
                senderATA,
                recipientATA,
                publicKey,
                transferAmount,
                [] // tidak ada multisig
            );

            // 4. Buat dan Kirim Transaksi
            const transaction = new Transaction().add(transferIx);
            
            const signature = await sendTransaction(transaction, connection);
            setStatus(`Berhasil! Menunggu konfirmasi jaringan...`);

            // 5. Konfirmasi dari Blockchain
            const latestBlockHash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: signature,
            });

            setStatus(`✅ Transfer Sukses! Signature: ${signature.substring(0, 15)}...`);
            setRecipientAddress('');
            setAmount('');
        } catch (error) {
            console.error(error);
            setStatus(`❌ Gagal: ${error.message || "Pastikan dompet Mahasiswa valid dan Kantin memiliki cukup saldo."}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="app-container">
            <div className="glass-card admin-card">
                <div className="header">
                    <h1>Dashboard Kantin 🏪</h1>
                    <p>Kirim Indra Coin ke Mahasiswa</p>
                </div>
                
                <div className="wallet-section">
                    <WalletMultiButton className="wallet-btn" />
                </div>

                {publicKey ? (
                    <div className="dashboard-section slide-up">
                        <div className="status-badge connected">
                            <span className="dot"></span> Kantin Online
                        </div>

                        <form onSubmit={handleSendPoin} className="send-form">
                            <div className="input-group">
                                <label>Alamat Wallet Mahasiswa</label>
                                <input 
                                    type="text" 
                                    placeholder="Contoh: 7VANwMbmP7pns8Et..." 
                                    value={recipientAddress}
                                    onChange={(e) => setRecipientAddress(e.target.value)}
                                    required
                                    className="glass-input"
                                />
                            </div>

                            <div className="input-group">
                                <label>Jumlah Poin (INDC)</label>
                                <input 
                                    type="number" 
                                    placeholder="Contoh: 5" 
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                    min="1"
                                    className="glass-input"
                                />
                            </div>

                            <button 
                                type="submit" 
                                className="action-btn"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Mengirim...' : 'Kirim Poin'}
                            </button>
                        </form>

                        {status && (
                            <div className={`status-message ${status.includes('❌') ? 'error' : 'success'}`}>
                                {status}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="dashboard-section empty-state">
                        <p>Hubungkan Dompet Kantin untuk mulai membagikan poin reward.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
