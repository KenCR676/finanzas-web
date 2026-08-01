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
  title: {
    default: "Finanzas claras",
    template: "%s | Finanzas claras",
  },
  description:
    "Una billetera sencilla para controlar tu saldo, ingresos, gastos y sobres de ahorro.",
  appleWebApp: {
    capable: true,
    title: "Finanzas claras",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        {children}
        <footer className="creator-footer">
          <strong>Creado por Kendall Muñoz</strong>
          <span>Ingeniero Informático</span>
        </footer>
      </body>
    </html>
  );
}
