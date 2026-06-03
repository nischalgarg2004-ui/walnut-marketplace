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
            <span className="pill">GET</span> `/api/admin/metrics` — platform KPIs (wired on `/admin`)
          </li>
          <li>
            <span className="pill">GET</span> `/api/admin/audit-log` — paginated audit trail
          </li>
          <li>
            <span className="pill">GET</span> `/api/admin/moderation/requirements` — published requirements queue
          </li>
          <li>
            <span className="pill">GET</span> `/api/admin/flags` — optional <code>?status=OPEN</code>
          </li>
          <li>
            <span className="pill">POST</span> `/api/admin/flags` — create flag (+ audit)
          </li>
          <li>
            <span className="pill">PATCH</span> `/api/admin/flags/[id]` — body <code>{`{ "status": "OPEN"|"RESOLVED"|"DISMISSED" }`}</code>
          </li>
          <li>
            <span className="pill">GET</span> `/api/admin/payouts` — pending / processing / failed queue
          </li>
          <li>
            <span className="pill">POST</span> `/api/admin/payouts/[id]/reconcile` — payout exception control (+ audit)
          </li>
          <li>
            <span className="pill">GET</span> `/api/admin/users` — <code>mode=creator|business</code>, optional <code>q</code> (email), <code>page</code>, <code>limit</code> (10–100, default 50); response includes <code>meta</code> (total, page, pageSize, totalPages)
          </li>
          <li>
            <span className="pill">PATCH</span> `/api/admin/users/[id]` — <code>userStatus</code>, <code>creatorKycStatus</code>, or{" "}
            <code>businessVerificationStatus</code> (audited)
          </li>
          <li>
            <span className="pill">GET</span> `/api/analytics/overview` — admin-only analytics JSON
          </li>
          <li>
            <span className="pill">UI</span> `/admin/tools/instagram-tester` — Instagram Graph probe
          </li>
        </ul>
      </PagePanel>
    </PageScaffold>
  );
}
