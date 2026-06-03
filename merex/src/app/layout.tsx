import "./globals.css";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Tilt_Warp, Instrument_Serif, Geist } from "next/font/google";
import React from "react";

import { BRAND_NAME, LOGO_ROUND_DARK } from "@/lib/brand";

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

const tiltWarp = Tilt_Warp({
  subsets: ["latin"],
  variable: "--font-tilt-warp",
  weight: "400",
  display: "swap"
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: "400",
  display: "swap"
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap"
});

export const metadata: Metadata = {
  title: `${BRAND_NAME} — Creator marketplace`,
  description: "Collaborations that stay on brief. Paid and barter Instagram campaigns for creators and businesses.",
  icons: {
    icon: LOGO_ROUND_DARK,
    shortcut: LOGO_ROUND_DARK,
    apple: LOGO_ROUND_DARK
  }
};

const themeBootstrapScript = `(function(){try{var k='merex_theme';var lk='ongram_theme';var t=localStorage.getItem(k)||localStorage.getItem(lk)||'system';if(!localStorage.getItem(k)&&localStorage.getItem(lk))localStorage.setItem(k,t);var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${tiltWarp.variable} ${instrumentSerif.variable} ${geist.variable}`} suppressHydrationWarning>
      <head>
          <link rel="icon" type="image/png" href="/logo-favicon.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/site.webmanifest" />
          <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
