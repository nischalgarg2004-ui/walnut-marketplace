import Link from "next/link";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";

const notifications = [
  { id: "n1", type: "Deal", title: "Contract #A91 requires your review", time: "2m ago", unread: true },
  { id: "n2", type: "Payout", title: "Payout batch is queued for release", time: "15m ago", unread: true },
  { id: "n3", type: "Campaign", title: "New creator application matched your filters", time: "48m ago", unread: false },
  { id: "n4", type: "System", title: "Instagram connection token refreshed", time: "2h ago", unread: false }
];

export default function NotificationsPage() {
  return (
    <main className="main-content">
      <div className="mx-auto max-w-5xl">
        <PageScaffold
          eyebrow="Notifications"
          title="Unified updates"
          description="Track decisions, payouts, and system events from one inbox."
          actions={
            <>
              <button type="button" className="btn ghost">
                Mark all as read
              </button>
              <Link className="btn primary" href="/search">
                Open command palette
              </Link>
            </>
          }
        >
          <PagePanel>
            <ul className="space-y-2">
              {notifications.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background px-4 py-3"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.type}</p>
                    <p className="text-sm text-foreground">{item.title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.unread ? <span className="pill border-primary/40 text-primary">Unread</span> : null}
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  </div>
                </li>
              ))}
            </ul>
          </PagePanel>
        </PageScaffold>
      </div>
    </main>
  );
}
