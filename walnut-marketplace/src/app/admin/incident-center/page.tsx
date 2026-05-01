import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";

const incidents = [
  { id: "INC-233", severity: "high", summary: "Payout queue delay in region ap-south", owner: "finance-ops" },
  { id: "INC-229", severity: "medium", summary: "Creator approval SLA breach", owner: "trust-ops" },
  { id: "INC-218", severity: "low", summary: "Campaign brief sync mismatch", owner: "product-ops" }
];

export default function AdminIncidentCenterPage() {
  return (
    <PageScaffold
      eyebrow="Admin"
      title="Incident center"
      description="Manage incident severity, ownership, and remediation progress from one operational board."
    >
      <PagePanel>
        <ul className="space-y-2">
          {incidents.map((incident) => (
            <li key={incident.id} className="rounded-lg border border-border bg-background px-4 py-3">
              <div className="item-head">
                <p className="item-title text-base">{incident.id}</p>
                <span className={`status ${incident.severity === "high" ? "rejected" : incident.severity === "medium" ? "waitlisted" : "applied"}`}>
                  {incident.severity}
                </span>
              </div>
              <p className="mt-1 text-sm text-foreground">{incident.summary}</p>
              <p className="mt-1 text-xs text-muted-foreground">Owner: {incident.owner}</p>
            </li>
          ))}
        </ul>
      </PagePanel>
    </PageScaffold>
  );
}
