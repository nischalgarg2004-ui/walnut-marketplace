"use client";

import { useEffect, useState } from "react";

type PreviewData = {
  fullName: string;
  bio: string | null;
  niches: string[];
  followerCount: number;
  postCount: number;
  avgEngagement: number;
  instagramHandle: string | null;
  instagramUsername: string | null;
  instagramProfilePictureUrl: string | null;
  city: string | null;
  state: string | null;
};

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return (p[0]![0]! + p[p.length - 1]![0]!).toUpperCase();
}

export function CreatorPreviewSheet({
  creatorId,
  open,
  onClose
}: {
  creatorId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !creatorId) {
      setData(null);
      setError("");
      return;
    }
    setLoading(true);
    void (async () => {
      const res = await fetch(`/api/business/creators/${creatorId}/preview`);
      const json = await res.json();
      setLoading(false);
      if (!res.ok) {
        setError(json.error ?? "Unable to load");
        setData(null);
        return;
      }
      setData(json.data);
      setError("");
    })();
  }, [open, creatorId]);

  if (!open) return null;

  const handle = data?.instagramUsername ?? data?.instagramHandle ?? "";

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-[101] max-h-[85vh] overflow-y-auto rounded-t-2xl border border-border bg-card shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:max-h-[90vh] sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <p className="m-0 text-sm font-semibold text-foreground">Creator</p>
          <button type="button" className="btn ghost text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="p-5">
          {loading ? (
            <p className="muted m-0">Loading…</p>
          ) : error ? (
            <p className="m-0 text-sm text-destructive">{error}</p>
          ) : data ? (
            <div className="flex flex-col items-center text-center">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-card ring-2 ring-border">
                {data.instagramProfilePictureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.instagramProfilePictureUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted text-xl font-semibold text-muted-foreground">
                    {initials(data.fullName)}
                  </div>
                )}
              </div>
              <p className="mt-4 m-0 text-lg font-semibold text-foreground">{data.fullName}</p>
              {handle ? (
                <a
                  href={`https://instagram.com/${handle.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-sm font-medium text-primary hover:underline"
                >
                  @{handle.replace(/^@/, "")}
                </a>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">No Instagram handle</p>
              )}
              <div className="mt-4 flex gap-6 text-sm">
                <div>
                  <span className="font-semibold tabular-nums">{data.followerCount}</span>
                  <span className="ml-1 text-muted-foreground">followers</span>
                </div>
                <div>
                  <span className="font-semibold tabular-nums">{data.postCount}</span>
                  <span className="ml-1 text-muted-foreground">posts</span>
                </div>
              </div>
              {data.bio ? (
                <p className="mt-4 m-0 max-w-sm whitespace-pre-wrap text-left text-sm text-muted-foreground">
                  {data.bio}
                </p>
              ) : null}
              {data.niches?.length ? (
                <div className="mt-3 flex flex-wrap justify-center gap-1">
                  {data.niches.map((n) => (
                    <span key={n} className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
                      {n}
                    </span>
                  ))}
                </div>
              ) : null}
              {(data.city || data.state) && (
                <p className="mt-3 m-0 text-xs text-muted-foreground">
                  {[data.city, data.state].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
