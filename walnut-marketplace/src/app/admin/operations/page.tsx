import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";

export default function AdminOperationsPage() {
  return (
    <PageScaffold
      eyebrow="Admin"
      title="Operations API map"
      description="Reference endpoints used by moderation and payout operations."
    >
      <PagePanel>
        <p className="section-subtitle">
          Reference endpoints used by moderation and payout operations.
        </p>
        <ul className="clean">
          <li>
            <span className="pill">GET</span> `/api/admin/metrics` for KPI dashboards
          </li>
          <li>
            <span className="pill">GET</span> `/api/admin/moderation/requirements` for moderation queues
          </li>
          <li>
            <span className="pill">POST</span> `/api/admin/flags` to flag suspicious entities
          </li>
          <li>
            <span className="pill">POST</span> `/api/admin/payouts/[id]/reconcile` for payout exception control
          </li>
          <li>
            <span className="pill">UI</span> `/admin/tools/instagram-tester` for live-domain Instagram Graph capability probe
          </li>
        </ul>
      </PagePanel>
    </PageScaffold>
  );
}
