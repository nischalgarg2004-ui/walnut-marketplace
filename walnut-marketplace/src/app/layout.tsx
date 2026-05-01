import "./globals.css";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Satisfy } from "next/font/google";
import React from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap"
});

const satisfy = Satisfy({
  subsets: ["latin"],
  variable: "--font-display",
  weight: "400",
  display: "swap"
});

export const metadata: Metadata = {
  title: "OnGram — Creator marketplace",
  description: "Collaborations that stay on brief. Paid and barter Instagram campaigns for creators and businesses.",
  icons: {
    icon: "/brand/ongram/logo-round-dark.png",
    shortcut: "/brand/ongram/logo-round-dark.png",
    apple: "/brand/ongram/logo-round-dark.png"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${satisfy.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var k='ongram_theme';var t=localStorage.getItem(k)||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();"
          }}
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
