import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nigerian Tax Calculator - Calculate Your PAYE & CGT | Free Tool",
  description: "Free Nigerian income tax calculator. Calculate your PAYE (Pay As You Earn), Capital Gains Tax for crypto, and see your take-home pay. Accurate 2024/2025 tax rates based on FIRS guidelines.",
  keywords: ["Nigerian tax calculator", "PAYE calculator", "Nigeria income tax", "crypto tax Nigeria", "CGT calculator", "tax calculator 2024"],
  authors: [{ name: "mysucesstory", url: "https://x.com/mysucesstory" }],
  openGraph: {
    title: "Nigerian Tax Calculator - Calculate Your PAYE & CGT",
    description: "Free tool to calculate Nigerian personal income tax, crypto CGT, and take-home pay.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
