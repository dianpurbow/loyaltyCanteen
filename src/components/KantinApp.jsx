'use client';

import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import { 
    getAssociatedTokenAddress, 
    createTransferInstruction,
    MINT_SIZE,
    TOKEN_PROGRAM_ID,
    createInitializeMintInstruction,
    createAssociatedTokenAccountInstruction,
    createMintToInstruction
} from '@solana/spl-token';

export default function KantinApp() {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    
    const [recipientAddress, setRecipientAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [newMintAddress, setNewMintAddress] = useState(null);

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
            const recipientATA = await getAssociatedTokenAddress(INDRA_COIN_MINT_ADDRESS, recipientPubKey);

            const transaction = new Transaction();

            // Cek apakah Mahasiswa sudah punya "brankas" (ATA) untuk koin ini
            // Jika belum, Kantin akan membayarkan biaya pembuatannya secara otomatis
            const recipientAccountInfo = await connection.getAccountInfo(recipientATA);
            if (!recipientAccountInfo) {
                transaction.add(
                    createAssociatedTokenAccountInstruction(
                        publicKey,      // Payer (Kantin)
                        recipientATA,   // ATA Mahasiswa
                        recipientPubKey,// Pemilik ATA (Mahasiswa)
                        INDRA_COIN_MINT_ADDRESS
                    )
                );
            }

            // 3. Buat Instruksi Transfer
            const transferIx = createTransferInstruction(
                senderATA,
                recipientATA,
                publicKey,
                transferAmount,
                [] 
            );

            // 4. Tambahkan ke transaksi dan Kirim
            transaction.add(transferIx);
            
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

    const handleCreateNewToken = async () => {
        if (!publicKey) return;
        try {
            setIsLoading(true);
            setStatus('Sedang mencetak koin baru ke Blockchain...');

            const mintKeypair = Keypair.generate();
            const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
            
            const transaction = new Transaction().add(
                SystemProgram.createAccount({
                    fromPubkey: publicKey,
                    newAccountPubkey: mintKeypair.publicKey,
                    space: MINT_SIZE,
                    lamports,
                    programId: TOKEN_PROGRAM_ID,
                }),
                createInitializeMintInstruction(
                    mintKeypair.publicKey,
                    0, // 0 desimal
                    publicKey, // mint authority
                    publicKey, // freeze authority
                    TOKEN_PROGRAM_ID
                )
            );

            // Langsung berikan 1 Juta Koin ke Kantin
            const ata = await getAssociatedTokenAddress(mintKeypair.publicKey, publicKey);
            transaction.add(
                createAssociatedTokenAccountInstruction(
                    publicKey,
                    ata,
                    publicKey,
                    mintKeypair.publicKey
                ),
                createMintToInstruction(
                    mintKeypair.publicKey,
                    ata,
                    publicKey,
                    1000000 
                )
            );

            const latestBlockHash = await connection.getLatestBlockhash();
            transaction.recentBlockhash = latestBlockHash.blockhash;
            transaction.feePayer = publicKey;
            
            // Tanda tangan transaksi dengan keypair mint baru
            transaction.partialSign(mintKeypair);

            const signature = await sendTransaction(transaction, connection);
            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: signature,
            });

            const newMint = mintKeypair.publicKey.toBase58();
            setNewMintAddress(newMint);
            setStatus(`✅ Token Dibuat! Mint: ${newMint}`);
        } catch (error) {
            console.error(error);
            setStatus(`❌ Gagal mencetak: ${error.message}`);
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

                        {newMintAddress && (
                            <div className="status-message success" style={{marginTop: '10px', wordBreak: 'break-all'}}>
                                <strong>⚠️ SIMPAN MINT ADDRESS INI:</strong><br/>
                                {newMintAddress}<br/><br/>
                                <em>Masukkan ini ke Vercel Environment Variables sebagai NEXT_PUBLIC_INDRA_COIN_MINT_ADDRESS</em>
                            </div>
                        )}

                        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>Setup Awal (Khusus Demo):</p>
                            <button 
                                onClick={handleCreateNewToken}
                                className="action-btn"
                                style={{ background: 'transparent', border: '1px solid #f472b6', width: '100%' }}
                                disabled={isLoading}
                            >
                                🌟 Inisialisasi 1 Juta Koin Baru
                            </button>
                        </div>
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
