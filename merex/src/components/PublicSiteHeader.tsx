"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BRAND_NAME, LOGO_ROUND_DARK, LOGO_ROUND_LIGHT } from "@/lib/brand";

export default function PublicSiteHeader() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <header className="topbar bg-background/70 dark:bg-card/70 border-b border-border/40 backdrop-blur-md">
      <div className="topbar-inner flex items-center justify-between py-3 px-6 max-w-7xl mx-auto">
        <Link href={"/" as Route} className="brand flex items-center gap-2.5 font-semibold text-foreground">
          <span className="brand-badge w-8 h-8 flex items-center justify-center overflow-hidden bg-transparent p-0">
            <img src={LOGO_ROUND_LIGHT} alt={BRAND_NAME} className="h-full w-full object-contain block dark:hidden" />
            <img src={LOGO_ROUND_DARK} alt={BRAND_NAME} className="h-full w-full object-contain hidden dark:block" />
          </span>
          <span className="text-[16px] tracking-tight font-geist-custom font-semibold">{BRAND_NAME}</span>
        </Link>
        <nav className="topnav flex items-center gap-1.5" aria-label="Marketing">
          <Link
            className={`px-4 py-1.5 text-sm font-medium font-geist-custom transition-all rounded-full ${
              pathname === "/"
                ? "bg-foreground/[0.08] dark:bg-white/[0.12] text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] dark:hover:bg-white/[0.06]"
            }`}
            href={"/" as Route}
          >
            Home
          </Link>
          <Link
            className={`px-4 py-1.5 text-sm font-medium font-geist-custom transition-all rounded-full ${
              pathname === "/login/creator"
                ? "bg-foreground/[0.08] dark:bg-white/[0.12] text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] dark:hover:bg-white/[0.06]"
            }`}
            href={"/login/creator" as Route}
          >
            Creator
          </Link>
          <Link
            className={`px-4 py-1.5 text-sm font-medium font-geist-custom transition-all rounded-full ${
              pathname === "/login/business"
                ? "bg-foreground/[0.08] dark:bg-white/[0.12] text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] dark:hover:bg-white/[0.06]"
            }`}
            href={"/login/business" as Route}
          >
            Business
          </Link>
        </nav>
      </div>
    </header>
  );
}
