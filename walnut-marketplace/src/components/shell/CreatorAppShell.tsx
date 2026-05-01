"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import ThemeToggle from "@/components/ThemeToggle";

const NAV: { href: Route; label: string }[] = [
  { href: "/creator", label: "Home" },
  { href: "/creator/opportunities", label: "Opportunities" },
  { href: "/creator/clips", label: "Clips" },
  { href: "/creator/applications", label: "Applications" },
  { href: "/creator/deals", label: "Deals" },
  { href: "/creator/earnings", label: "Earnings" },
  { href: "/creator/profile", label: "Profile" },
  { href: "/creator/settings", label: "Settings" }
];

export function CreatorAppShell({
  children,
  userEmail
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/creator") return pathname === "/creator";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="flex min-h-[100dvh] bg-background">
      <aside
        id="creator-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-modal flex w-60 flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-transform lg:static lg:z-0 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-primary/20">
            <img src="/brand/ongram/logo-round-light.png" alt="OnGram" className="h-full w-full object-cover" />
          </span>
          <span className="font-semibold">OnGram</span>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3 pb-24" aria-label="Creator">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-sidebar-accent text-white" : "text-sidebar-foreground/80 hover:bg-white/5"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-3 text-xs text-sidebar-foreground/70">
          <p className="truncate">{userEmail}</p>
          <div className="mt-2 flex items-center gap-2">
            <ThemeToggle compact />
          </div>
          <button type="button" className="mt-2 text-sm font-medium text-white hover:underline" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-modal-backdrop bg-black/50 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col lg:ml-0">
        <header className="sticky top-0 z-sticky flex h-14 min-h-touch items-center justify-between gap-3 border-b border-border bg-card/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-lg border border-border bg-card lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-expanded={mobileOpen}
              aria-controls="creator-sidebar"
            >
              <span className="sr-only">Open menu</span>
              <span aria-hidden className="text-lg">
                ☰
              </span>
            </button>
            <span className="truncate text-sm font-medium text-muted-foreground lg:hidden">Creator</span>
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <span className="max-w-[200px] truncate text-xs text-muted-foreground">{userEmail}</span>
            <button type="button" className="btn ghost text-sm" onClick={logout}>
              Log out
            </button>
          </div>
        </header>

        <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-5 md:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
