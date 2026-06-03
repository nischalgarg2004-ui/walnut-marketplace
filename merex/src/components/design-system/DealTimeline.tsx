import { cn } from "@/lib/cn";

export type TimelineStep = {
  id: string;
  label: string;
  description?: string;
  state: "complete" | "current" | "upcoming" | "warning";
};

type Role = "creator" | "business";

export function DealTimeline({ steps, role = "creator" }: { steps: TimelineStep[]; role?: Role }) {
  return (
    <ol className="relative grid gap-0" aria-label={role === "creator" ? "Your deal progress" : "Deal progress"}>
      {steps.map((step, i) => (
        <li key={step.id} className="relative flex gap-3 pb-6 last:pb-0">
          {i < steps.length - 1 ? (
            <span
              className="absolute left-[15px] top-8 z-0 h-[calc(100%-0.5rem)] w-px bg-border"
              aria-hidden
            />
          ) : null}
          <span
            className={cn(
              "relative z-[1] mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
              step.state === "complete" && "border-emerald-500 bg-emerald-500 text-white",
              step.state === "current" && "border-primary bg-primary text-primary-foreground",
              step.state === "upcoming" && "border-border bg-muted text-muted-foreground",
              step.state === "warning" && "border-amber-500 bg-amber-100 text-amber-900"
            )}
          >
            {step.state === "complete" ? "✓" : i + 1}
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="font-medium text-foreground">{step.label}</p>
            {step.description ? (
              <p className="text-sm text-muted-foreground">{step.description}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
