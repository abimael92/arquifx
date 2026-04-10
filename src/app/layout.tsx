import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { GlobalShortcuts } from "@/components/layout/GlobalShortcuts";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ArquiFX",
  description: "Aplicación de diseño arquitectónico 3D",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="min-h-full font-sans">
        <GlobalShortcuts />
        {children}
      </body>
    </html>
  );
}
