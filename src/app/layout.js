import { Inter } from "next/font/google";
import "./globals.css";
import SolanaProvider from "@/components/SolanaProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Indra Coin - Sistem Poin Kampus",
  description: "Dapatkan reward Indra Coin dari kantin kampus",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SolanaProvider>
          {children}
        </SolanaProvider>
      </body>
    </html>
  );
}
