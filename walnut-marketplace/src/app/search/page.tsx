import Link from "next/link";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";

const commands = [
  "Go to creator opportunities",
  "Open business deals board",
  "Create campaign",
  "Release pending payouts",
  "Open admin operations"
];

export default function SearchPage() {
  return (
    <main className="main-content">
      <div className="mx-auto max-w-4xl">
        <PageScaffold
          eyebrow="Command"
          title="Search and commands"
          description="Use this surface as the global command center for rapid navigation and actions."
          actions={
            <Link className="btn ghost" href="/notifications">
              Back to notifications
            </Link>
          }
        >
          <PagePanel title="Quick command palette">
            <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="global-search-input">
              Search pages, creators, campaigns, and actions
            </label>
            <input id="global-search-input" type="search" placeholder="Type a command or route..." />
            <ul className="mt-4 space-y-2">
              {commands.map((command) => (
                <li key={command} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                  {command}
                </li>
              ))}
            </ul>
          </PagePanel>
        </PageScaffold>
      </div>
    </main>
  );
}
