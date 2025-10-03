// src/app/layout.tsx

import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

// AS ALTERAÇÕES ESTÃO AQUI DENTRO
export const metadata: Metadata = {
  // 1. Título alterado para o nome do seu projeto
  title: "Garage Wier - Agendamentos",
  description: "Sistema de Agendamentos para Lava-Car",
  icons: {
    // 2. Caminho do ícone alterado para a sua logo
    icon: "/logobarber.png", //
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}