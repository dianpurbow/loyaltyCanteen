import { Keypair, Connection, clusterApiUrl } from '@solana/web3.js';
import { createMint } from '@solana/spl-token';
import fs from 'fs';

async function createIndraCoin() {
    console.log("Menghubungkan ke Solana Devnet...");
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    console.log("Membuat dompet Admin baru...");
    const payer = Keypair.generate();

    console.log("Meminta Airdrop SOL untuk biaya transaksi...");
    const airdropSignature = await connection.requestAirdrop(payer.publicKey, 1000000000); // 1 SOL
    
    // Tunggu hingga transaksi airdrop dikonfirmasi
    const latestBlockHash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: airdropSignature,
    });

    console.log("✅ Wallet Admin:", payer.publicKey.toBase58());
    console.log("Private Key Admin (Simpan ini baik-baik!):", "[" + payer.secretKey.toString() + "]");

    console.log("Mencetak token Indra Coin...");
    const mint = await createMint(
        connection,
        payer, // Payer of the transaction
        payer.publicKey, // Account that will control the minting
        null, // Freeze authority
        0 // Decimals (0 berarti 1 token = 1 coin bulat)
    );

    console.log("✅ Alamat Token (Mint Address) Indra Coin:", mint.toBase58());

    // Menyimpan Mint Address ke file config agar mudah dibaca frontend
    fs.writeFileSync('.env.local', `NEXT_PUBLIC_INDRA_COIN_MINT_ADDRESS=${mint.toBase58()}\n`, { flag: 'a' });
    console.log("Mint Address berhasil disimpan di .env.local!");
}

createIndraCoin().catch(console.error);
