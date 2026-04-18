import "./globals.css";
import type { Metadata } from "next";
import AppHeader from "@/components/AppHeader";
import React from "react";

export const metadata: Metadata = {
  title: "Project Walnut",
  description: "India Creator Marketplace MVP"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <AppHeader />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
