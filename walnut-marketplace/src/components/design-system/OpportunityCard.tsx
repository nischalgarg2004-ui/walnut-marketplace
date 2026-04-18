import type { Route } from "next";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const cardVariants = cva(
  "group flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
  {
    variants: {
      state: {
        default: "",
        closing: "border-amber-200/80 bg-amber-50/40",
        applied: "border-primary/25 bg-accent/30",
        closed: "opacity-70"
      }
    },
    defaultVariants: { state: "default" }
  }
);

export type OpportunityCardProps = {
  id: string;
  title: string;
  briefExcerpt: string;
  brandName?: string;
  metaLine?: string;
  href: string;
  ctaLabel?: string;
} & VariantProps<typeof cardVariants>;

export function OpportunityCard({
  id,
  title,
  briefExcerpt,
  brandName,
  metaLine,
  href,
  ctaLabel = "View opportunity",
  state
}: OpportunityCardProps) {
  return (
    <article className={cn(cardVariants({ state }), "min-h-0")} data-opportunity-id={id}>
      <div className="min-w-0">
        {brandName ? (
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{brandName}</p>
        ) : null}
        <h3 className="text-lg font-semibold leading-snug text-foreground">{title}</h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{briefExcerpt}</p>
        {metaLine ? <p className="text-xs text-muted-foreground tabular-nums">{metaLine}</p> : null}
      </div>
      <div>
        <Link
          className="btn primary inline-flex min-h-touch w-full justify-center sm:w-auto"
          href={href as Route}
        >
          {ctaLabel}
        </Link>
      </div>
    </article>
  );
}
