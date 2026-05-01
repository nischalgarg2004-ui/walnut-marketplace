import type { ReactNode } from "react";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import { cn } from "@/lib/cn";

type PublicMarketingShellProps = {
  children: ReactNode;
  /** Applied to the `<main>` wrapper (e.g. `landing-shell` or `main-content`). */
  mainClassName?: string;
};

export default function PublicMarketingShell({ children, mainClassName }: PublicMarketingShellProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      <PublicSiteHeader />
      <main className={cn("flex-1", mainClassName)}>{children}</main>
      <PublicSiteFooter />
    </div>
  );
}
