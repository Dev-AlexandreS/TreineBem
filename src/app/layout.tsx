import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/navigation/BottomNav";
import SideNav from "@/components/navigation/SideNav";
import { StorageProvider } from "@/lib/storage/storage.provider";
import { createClient } from "@/lib/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Treine Bem",
  description: "Controle de treino e evolução física",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} dark`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <StorageProvider userId={user?.id ?? null}>
          {/* Sidebar: visible on desktop (md+) */}
          <SideNav />

          {/* Main content area:
              - pb-16 on mobile to clear the fixed BottomNav (h ~64px)
              - md:pl-56 on desktop to clear the fixed SideNav (w-56) */}
          <main className="pb-16 md:pb-0 md:pl-56">
            {children}
          </main>

          {/* Bottom nav: visible on mobile only (hidden on md+) */}
          <BottomNav />
        </StorageProvider>
      </body>
    </html>
  );
}
