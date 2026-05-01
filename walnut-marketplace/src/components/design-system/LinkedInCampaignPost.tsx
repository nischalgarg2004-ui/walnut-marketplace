"use client";

import Link from "next/link";
import type { Route } from "next";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type CommentRow = {
  id: string;
  body: string;
  createdAt: string;
  author: { name: string; handle: string | null };
};

export type LinkedInCampaignPostData = {
  id: string;
  title: string;
  postText: string;
  postImageUrl: string | null;
  brandName: string;
  authorHref: string;
  createdAt: string;
  spentAmount?: number | null;
  criteriaNarrative?: string | null;
  reactionCount: number;
  commentCount: number;
  shareCount: number;
  viewerReaction: "LIKE" | null;
  applyHref: string;
  applyLabel: string;
  postHref?: string;
};

export function LinkedInCampaignPost({ post }: { post: LinkedInCampaignPostData }) {
  const [expanded, setExpanded] = useState(false);
  const [reactionCount, setReactionCount] = useState(post.reactionCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [shareCount, setShareCount] = useState(post.shareCount);
  const [viewerReaction, setViewerReaction] = useState<"LIKE" | null>(post.viewerReaction);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [busy, setBusy] = useState<"reaction" | "comment" | "share" | null>(null);
  const [interactionHint, setInteractionHint] = useState<string | null>(null);
  const hintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commentInputRef = useRef<HTMLInputElement | null>(null);

  const text = [post.postText?.trim() || post.title, post.criteriaNarrative?.trim() || ""]
    .filter(Boolean)
    .join(" ");
  const shouldClamp = text.length > 240;
  const previewText = shouldClamp && !expanded ? `${text.slice(0, 237)}...` : text;
  const spentAmount = Number(post.spentAmount ?? 0);
  const spentSubhead =
    spentAmount > 0 ? `₹${spentAmount.toLocaleString("en-IN")} spent on creators` : "No payouts released yet";
  const shareTarget = post.postHref ?? post.applyHref;

  const statsLine = useMemo(() => {
    return `${reactionCount} likes · ${commentCount} comments · ${shareCount} shares`;
  }, [reactionCount, commentCount, shareCount]);

  async function fetchComments() {
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/requirements/${post.id}/comments`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load comments");
      setComments(json.data ?? []);
    } finally {
      setCommentsLoading(false);
    }
  }

  function showHint(message: string) {
    if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    setInteractionHint(message);
    hintTimeoutRef.current = setTimeout(() => setInteractionHint(null), 1400);
  }

  useEffect(
    () => () => {
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    },
    []
  );

  async function toggleReaction() {
    if (busy) return;
    setBusy("reaction");
    const optimisticLiked = viewerReaction === "LIKE" ? null : "LIKE";
    setViewerReaction(optimisticLiked);
    setReactionCount((prev) => Math.max(0, prev + (optimisticLiked ? 1 : -1)));
    try {
      const res = await fetch(`/api/requirements/${post.id}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "LIKE" })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to react");
      setViewerReaction(json.data.viewerReaction);
      setReactionCount(json.data.reactionCount);
      showHint(json.data.viewerReaction === "LIKE" ? "Post liked" : "Like removed");
    } catch {
      setViewerReaction(post.viewerReaction);
      setReactionCount(post.reactionCount);
    } finally {
      setBusy(null);
    }
  }

  async function openComments() {
    setCommentsOpen((v) => !v);
    if (commentsOpen || comments.length > 0) return;
    await fetchComments();
  }

  async function submitComment(e: FormEvent) {
    e.preventDefault();
    const body = commentBody.trim();
    if (!body || busy) return;
    setBusy("comment");
    try {
      const res = await fetch(`/api/requirements/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to comment");
      setCommentCount(json.data.commentCount);
      setCommentBody("");
      if (!commentsOpen) setCommentsOpen(true);
      await fetchComments();
    } finally {
      setBusy(null);
    }
  }

  function startReply(authorName: string, handle: string | null) {
    const mention = handle ? `@${handle}` : `@${authorName.replace(/\s+/g, "").toLowerCase()}`;
    setCommentBody((prev) => (prev.trim().length > 0 ? `${prev} ` : "") + `${mention} `);
    setCommentsOpen(true);
    setTimeout(() => commentInputRef.current?.focus(), 0);
  }

  async function registerShare() {
    if (busy) return;
    setBusy("share");
    setShareCount((prev) => prev + 1);
    try {
      await fetch(`/api/requirements/${post.id}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "copy_link" })
      });
      if (typeof window !== "undefined") {
        const absolute = `${window.location.origin}${shareTarget}`;
        await navigator.clipboard.writeText(absolute);
      }
      showHint("Link copied");
    } catch {
      setShareCount(post.shareCount);
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {interactionHint ? (
        <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background animate-pulse">
          {interactionHint}
        </div>
      ) : null}
      <div className="px-4 py-3 border-b border-border/70">
        <div className="flex items-start gap-3">
          <Link
            href={post.authorHref as Route}
            className="mt-0.5 grid h-10 w-10 place-items-center rounded-full bg-muted text-sm font-semibold text-foreground hover:bg-muted/80"
            aria-label={`Open ${post.brandName} profile`}
          >
            {post.brandName.slice(0, 1).toUpperCase()}
          </Link>
          <div className="min-w-0">
            <Link href={post.authorHref as Route} className="m-0 block truncate text-sm font-semibold text-foreground hover:underline">
              {post.brandName}
            </Link>
            <p className="m-0 text-xs text-muted-foreground">{spentSubhead}</p>
            <p className="m-0 text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-3 space-y-3">
        <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{previewText}</p>
        {shouldClamp ? (
          <button type="button" className="text-xs text-primary" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Show less" : "Read more"}
          </button>
        ) : null}
        {post.postImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.postImageUrl} alt={post.title} className="w-full rounded-xl border border-border object-cover max-h-[420px]" />
        ) : null}
      </div>
      <div className="px-4 py-2 border-t border-border/70 text-xs text-muted-foreground">{statsLine}</div>
      <div className="grid grid-cols-4 border-t border-border/70">
        <button type="button" className="py-2 text-sm hover:bg-muted/30" onClick={() => void toggleReaction()} disabled={busy !== null}>
          {viewerReaction === "LIKE" ? "👍 Liked" : "👍 Like"}
        </button>
        <button type="button" className="py-2 text-sm hover:bg-muted/30" onClick={() => void openComments()}>
          💬 Comment
        </button>
        <button type="button" className="py-2 text-sm hover:bg-muted/30" onClick={() => void registerShare()} disabled={busy !== null}>
          🔗 Share
        </button>
        <Link href={post.applyHref as Route} className="py-2 text-sm text-center hover:bg-muted/30">
          📩 {post.applyLabel}
        </Link>
      </div>
      {commentsOpen ? (
        <div className="border-t border-border/70 px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Most relevant</span>
          </div>
          <form onSubmit={submitComment} className="flex gap-2">
            <input
              ref={commentInputRef}
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1"
            />
            <button type="submit" className="btn primary" disabled={busy !== null}>
              Post
            </button>
          </form>
          {commentsLoading ? (
            <p className="m-0 text-xs text-muted-foreground">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="m-0 text-xs text-muted-foreground">No comments yet.</p>
          ) : (
            <ul className="m-0 list-none space-y-2 p-0">
              {comments.slice(0, 8).map((c) => (
                <li key={c.id} className="rounded-lg bg-muted/25 px-3 py-2">
                  <p className="m-0 text-xs font-medium text-foreground">
                    {c.author.name}
                    {c.author.handle ? ` · @${c.author.handle}` : ""}
                  </p>
                  <p className="m-0 text-sm text-foreground">{c.body}</p>
                  <button
                    type="button"
                    className="mt-1 border-none bg-transparent p-0 text-xs font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => startReply(c.author.name, c.author.handle)}
                  >
                    Reply
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </article>
  );
}
