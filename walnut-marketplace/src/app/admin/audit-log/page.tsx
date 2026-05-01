import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";

const events = [
  { actor: "ops@walnut", action: "Released payout batch", target: "Batch P-44", at: "09:42" },
  { actor: "moderator@walnut", action: "Flagged creator profile", target: "creator_129", at: "09:10" },
  { actor: "system", action: "Campaign status update", target: "cmp_7bd", at: "08:55" }
];

export default function AdminAuditLogPage() {
  return (
    <PageScaffold eyebrow="Admin" title="Audit log" description="Track operational changes and actor activity across the platform.">
      <PagePanel>
        <div className="table-scroller">
          <table className="dense-table min-w-full">
            <thead>
              <tr>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={`${event.actor}-${event.action}-${event.at}`} className="border-t border-border">
                  <td>{event.actor}</td>
                  <td>{event.action}</td>
                  <td>{event.target}</td>
                  <td className="tabular-nums text-muted-foreground">{event.at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PagePanel>
    </PageScaffold>
  );
}
