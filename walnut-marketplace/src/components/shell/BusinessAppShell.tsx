"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import ThemeToggle from "@/components/ThemeToggle";

type NavItem = { href: Route; label: string; icon: string };

const NAV: NavItem[] = [
  { href: "/business/home", label: "Home", icon: "⌂" },
  { href: "/business/campaigns", label: "Campaigns", icon: "◫" },
  { href: "/business/applications", label: "Applications", icon: "≣" },
  { href: "/business/deals/board", label: "Deals", icon: "⇅" },
  { href: "/business/clips", label: "Clips Ops", icon: "✂" },
  { href: "/business/campaigns/create", label: "Create Campaign", icon: "+" },
  { href: "/business/database", label: "Database Manager", icon: "▦" },
  { href: "/business/funds", label: "Funds", icon: "₹" },
  { href: "/notifications", label: "Notifications", icon: "•" },
  { href: "/business/profile", label: "Profile", icon: "◉" },
  { href: "/business/settings", label: "Settings", icon: "⚙" }
];

export function BusinessAppShell({
  children,
  userEmail
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [railHovered, setRailHovered] = useState(false);
  const [railPinned, setRailPinned] = useState(false);
  const isExpanded = mobileOpen || railPinned || railHovered;
  const isDataHeavyRoute =
    pathname.startsWith("/business/database") || pathname.startsWith("/business/deals/board");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function isActive(href: string) {
    if (href === "/business/home") return pathname === "/business/home" || pathname === "/business";
    if (href === "/business/campaigns/create") {
      return pathname === href || pathname === "/business/campaigns/new";
    }
    if (href === "/business/campaigns") {
      return pathname === href || pathname.startsWith("/business/campaigns/");
    }
    if (href === "/business/database") {
      return (
        pathname === href ||
        pathname === "/business/applications" ||
        pathname.startsWith("/business/applications/") ||
        pathname.startsWith("/business/deals")
      );
    }
    if (href === "/business/funds") {
      return (
        pathname === href ||
        pathname === "/business/payouts" ||
        pathname.startsWith("/business/operations/payouts")
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <aside
        id="business-sidebar"
        onMouseEnter={() => setRailHovered(true)}
        onMouseLeave={() => setRailHovered(false)}
        className={cn(
          "fixed inset-y-0 left-0 z-modal flex w-60 flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-200 ease-out",
          "lg:w-20",
          isExpanded && "lg:w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-primary/20">
            <img src="/brand/ongram/logo-round-light.png" alt="OnGram" className="h-full w-full object-cover" />
          </span>
          <span className={cn("font-semibold", !isExpanded && "sr-only")}>OnGram</span>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3 pb-24" aria-label="Business">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={!isExpanded ? item.label : undefined}
                aria-label={item.label}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                  active ? "bg-sidebar-accent text-white" : "text-sidebar-foreground/80 hover:bg-white/5"
                )}
              >
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-base" aria-hidden>
                  {item.icon}
                </span>
                <span className={cn("truncate", !isExpanded && "sr-only")}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-3 text-xs text-sidebar-foreground/70">
          <p className={cn("truncate", !isExpanded && "sr-only")}>{userEmail}</p>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              title={railPinned ? "Unpin sidebar" : "Pin sidebar"}
              aria-label={railPinned ? "Unpin sidebar" : "Pin sidebar"}
              className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-md border border-white/10 px-2 text-sm hover:bg-white/10"
              onClick={() => setRailPinned((prev) => !prev)}
            >
              {railPinned ? "📌" : "📍"}
            </button>
            <button
              type="button"
              title="Help"
              aria-label="Help"
              className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-md border border-white/10 px-2 text-sm hover:bg-white/10"
            >
              ?
            </button>
            <ThemeToggle compact />
            <button
              type="button"
              title="Log out"
              aria-label="Log out"
              className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-md border border-white/10 px-2 text-sm hover:bg-white/10"
              onClick={logout}
            >
              ⎋
            </button>
          </div>
          <button
            type="button"
            className={cn("mt-2 text-xs hover:underline", !isExpanded && "sr-only")}
            onClick={logout}
          >
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

      <div className="flex min-w-0 flex-1 flex-col lg:pl-20">
        <header className="sticky top-0 z-sticky flex h-14 min-h-touch items-center justify-between gap-3 border-b border-border bg-card/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-lg border border-border bg-card lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-expanded={mobileOpen}
              aria-controls="business-sidebar"
            >
              <span className="sr-only">Open menu</span>
              <span aria-hidden className="text-lg">
                ☰
              </span>
            </button>
            <span className="truncate text-sm font-medium text-muted-foreground lg:hidden">OnGram Business</span>
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <span className="max-w-[200px] truncate text-xs text-muted-foreground">{userEmail}</span>
            <button type="button" className="btn ghost text-sm" onClick={logout}>
              Log out
            </button>
          </div>
        </header>

        <main
          className={cn(
            "w-full flex-1 px-4 py-6 sm:px-5 md:px-6",
            isDataHeavyRoute ? "max-w-none" : "mx-auto max-w-[1400px]"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
