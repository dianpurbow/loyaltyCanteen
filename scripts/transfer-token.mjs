import { Keypair, Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, transfer } from '@solana/spl-token';

// Fungsi transfer koin dari Kantin ke Mahasiswa
async function transferIndraCoin() {
    // Parameter Statis untuk contoh
    const mintAddress = process.env.NEXT_PUBLIC_INDRA_COIN_MINT_ADDRESS || "MASUKKAN_MINT_ADDRESS";
    // Admin Secret Key (Harusnya diambil dari env var di production)
    // Ganti array di bawah ini dengan secretKey yang didapat dari create-token.js
    const adminSecretKey = new Uint8Array([/* masukkan angka secret key admin di sini */]); 
    const receiverPublicKeyStr = "ALAMAT_DOMPET_PENERIMA"; // Ganti dengan dompet mahasiswa
    const amount = 5;

    if (adminSecretKey.length === 0) {
        console.error("❌ Silakan masukkan admin secret key di skrip ini terlebih dahulu.");
        return;
    }

    const senderKeypair = Keypair.fromSecretKey(adminSecretKey);
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    const mint = new PublicKey(mintAddress);
    const toPublicKey = new PublicKey(receiverPublicKeyStr);

    console.log("Mendapatkan token account pengirim...");
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        senderKeypair,          // Fee payer
        mint,                   // Mint address dari Indra Coin
        senderKeypair.publicKey // Alamat pemilik ATA (Pengirim)
    );

    console.log("Mendapatkan token account penerima...");
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        senderKeypair, // Pengirim (Kantin) mensubsidi biaya pembuatan ATA jika mhs belum punya
        mint,
        toPublicKey    // Alamat wallet Penerima (Mahasiswa)
    );

    console.log("Melakukan transfer token...");
    const signature = await transfer(
        connection,
        senderKeypair,                  // Pembayar biaya transaksi Solana (SOL)
        fromTokenAccount.address,       // Dari: ATA Pengirim
        toTokenAccount.address,         // Ke: ATA Penerima
        senderKeypair.publicKey,        // Otorisasi dari pemilik wallet pengirim
        amount                          // Jumlah Indra Coin yang ditransfer (misal: 5)
    );

    console.log("✅ Transfer Berhasil! Transaction Signature:", signature);
}

// Menjalankan fungsi
// transferIndraCoin().catch(console.error); // Di-comment agar tidak error jika tidak diisi parameternya
