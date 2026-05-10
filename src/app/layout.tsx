import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#050505",
};

export const metadata: Metadata = {
  title: "УБЕЖИЩЕ 18 — Приглашение | Vault-Tec",
  description: "Система приглашений Vault-Tec. Убежище №18. Криминальный Ростов-на-Дону. День Рождения Макарова Андрея — 29 лет.",
  icons: {
    icon: "/radiation-icon.png",
  },
  openGraph: {
    title: "УБЕЖИЩЕ 18 — Приглашение",
    description: "Vault-Tec приглашает вас в Убежище №18",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistMono.variable} antialiased bg-background text-foreground font-mono`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
