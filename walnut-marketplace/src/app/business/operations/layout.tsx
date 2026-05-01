"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS: { href: Route; label: string }[] = [
  { href: "/business/operations/deliverables", label: "Deliverables" },
  { href: "/business/operations/payouts", label: "Payouts" }
];

export default function OperationsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="stack">
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {TABS.map((t) => {
          const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
