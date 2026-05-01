"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";

export default function GlobalErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="main-content">
      <div className="mx-auto max-w-2xl">
        <PageScaffold
          eyebrow="Something went wrong"
          title="Unexpected application error"
          description="The action could not be completed. Try again or navigate back to a stable workspace."
        >
          <PagePanel>
            <div className="row">
              <button type="button" className="btn primary" onClick={reset}>
                Retry
              </button>
              <Link className="btn ghost" href="/search">
                Open command search
              </Link>
              <Link className="btn ghost" href="/">
                Home
              </Link>
            </div>
          </PagePanel>
        </PageScaffold>
      </div>
    </main>
  );
}
