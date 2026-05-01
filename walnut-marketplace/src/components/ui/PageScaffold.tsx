import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type PageScaffoldProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
};

export function PageScaffold({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
  headerClassName
}: PageScaffoldProps) {
  return (
    <section className={cn("space-y-6", className)}>
      <header className={cn("rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6", headerClassName)}>
        {eyebrow ? <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</p> : null}
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
            {description ? <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </header>
      {children}
    </section>
  );
}

type PanelProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PagePanel({ title, description, actions, children, className }: PanelProps) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6", className)}>
      {title || description || actions ? (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            {title ? <h2 className="text-base font-semibold text-foreground sm:text-lg">{title}</h2> : null}
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
