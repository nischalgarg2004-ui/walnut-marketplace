import { ApplicationStatus, ContractStatus, RequirementStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getRequiredSessionUser, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

const VIEW_MILESTONES = [100000, 50000, 10000];

type HomeNotification = {
  id: string;
  type: "APPLICATION" | "DELIVERABLE" | "REEL_MILESTONE" | "PAYOUT" | "SYSTEM";
  title: string;
  body: string;
  href: string;
  actor: {
    name: string;
    handle: string | null;
    avatarUrl: string | null;
  } | null;
  createdAt: string;
  readAt: string | null;
};

function resolveLinkToExternalOrCampaign(params: { externalUrl?: string | null; requirementId?: string | null; creatorId?: string | null }) {
  if (params.externalUrl?.startsWith("http")) return params.externalUrl;
  if (params.requirementId) {
    const creatorQuery = params.creatorId ? `?creator=${params.creatorId}` : "";
    return `/business/campaigns/${params.requirementId}${creatorQuery}`;
  }
  return "/business/home";
}

function compactViews(v: number) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${v}`;
}

function getNestedNumber(value: unknown, path: string[]): number | null {
  let cur: unknown = value;
  for (const key of path) {
    if (!cur || typeof cur !== "object" || !(key in cur)) return null;
    cur = (cur as Record<string, unknown>)[key];
  }
  return typeof cur === "number" ? cur : null;
}

function parseEngagement(raw: unknown): { likes: number | null; comments: number | null; shares: number | null } {
  const likes =
    getNestedNumber(raw, ["summary", "likes"]) ??
    getNestedNumber(raw, ["engagement", "likes"]) ??
    getNestedNumber(raw, ["likes_count"]);
  const comments =
    getNestedNumber(raw, ["summary", "comments"]) ??
    getNestedNumber(raw, ["engagement", "comments"]) ??
    getNestedNumber(raw, ["comments_count"]);
  const shares =
    getNestedNumber(raw, ["summary", "shares"]) ??
    getNestedNumber(raw, ["engagement", "shares"]) ??
    getNestedNumber(raw, ["shares_count"]);
  return { likes, comments, shares };
}

function buildManagerName(params: {
  settingsAccountData: unknown;
  representativeFullName: string | null;
  brandName: string;
  userEmail: string;
}) {
  const fromSettings =
    params.settingsAccountData &&
    typeof params.settingsAccountData === "object" &&
    typeof (params.settingsAccountData as Record<string, unknown>).contactName === "string"
      ? ((params.settingsAccountData as Record<string, unknown>).contactName as string).trim()
      : "";
  if (fromSettings) return fromSettings;
  if (params.representativeFullName?.trim()) return params.representativeFullName.trim();
  const emailPrefix = params.userEmail.split("@")[0]?.trim();
  if (emailPrefix) return emailPrefix;
  return params.brandName;
}

export async function GET(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    requireRole(user, [UserRole.BUSINESS, UserRole.ADMIN]);

    const [business, settings, userRecord] = await Promise.all([
      db.businessProfile.findUnique({
        where: { userId: user.userId }
      }),
      db.businessSettings.findUnique({
        where: { userId: user.userId },
        select: { accountData: true }
      }),
      db.user.findUnique({
        where: { id: user.userId },
        select: { email: true }
      })
    ]);
    if (!business || !userRecord) {
      return NextResponse.json({ error: "Business profile not found" }, { status: 400 });
    }

    const managerName = buildManagerName({
      settingsAccountData: settings?.accountData,
      representativeFullName: business.representativeFullName ?? null,
      brandName: business.brandName,
      userEmail: userRecord.email
    });

    const [
      activeCampaigns,
      openApplications,
      activeDeals,
      recentApplications,
      topReelContracts,
      submittedDeliverables,
      recentPayouts,
      rawNotifications
    ] = await Promise.all([
      db.requirement.count({
        where: { businessId: business.id, status: RequirementStatus.PUBLISHED }
      }),
      db.application.count({
        where: {
          requirement: { businessId: business.id },
          status: { in: [ApplicationStatus.APPLIED, ApplicationStatus.WAITLISTED] }
        }
      }),
      db.contract.count({
        where: {
          businessId: business.id,
          status: { in: [ContractStatus.PENDING, ContractStatus.ACTIVE] }
        }
      }),
      db.application.findMany({
        where: { requirement: { businessId: business.id } },
        orderBy: { appliedAt: "desc" },
        take: 8,
        include: {
          requirement: { select: { id: true, title: true } },
          creator: {
            select: {
              id: true,
              fullName: true,
              instagramUsername: true,
              instagramHandle: true,
              instagramProfilePictureUrl: true
            }
          }
        }
      }),
      db.contract.findMany({
        where: {
          businessId: business.id,
          status: { in: [ContractStatus.ACTIVE, ContractStatus.COMPLETED] }
        },
        orderBy: [{ acceptedAt: "desc" }],
        take: 24,
        include: {
          requirement: { select: { id: true, title: true } },
          creator: {
            select: {
              id: true,
              fullName: true,
              instagramUsername: true,
              instagramHandle: true,
              instagramProfilePictureUrl: true
            }
          },
          performanceReport: { select: { viewsCount: true, source: true, submittedAt: true } },
          metricSnapshots: {
            orderBy: { capturedAt: "desc" },
            take: 1,
            select: { views: true, rawJson: true, capturedAt: true }
          },
          deliverables: {
            where: {
              OR: [{ externalUrl: { not: null } }, { fileUrl: { not: "" } }]
            },
            orderBy: [{ submittedAt: "desc" }],
            take: 1,
            select: { id: true, externalUrl: true, fileUrl: true, instagramMediaId: true, submittedAt: true }
          }
        }
      }),
      db.deliverable.findMany({
        where: {
          contract: { businessId: business.id },
          submittedAt: { not: null }
        },
        orderBy: { submittedAt: "desc" },
        take: 10,
        select: {
          id: true,
          externalUrl: true,
          submittedAt: true,
          contractId: true,
          contract: {
            select: {
              requirement: { select: { id: true, title: true } },
              creator: {
                select: {
                  id: true,
                  fullName: true,
                  instagramUsername: true,
                  instagramHandle: true,
                  instagramProfilePictureUrl: true
                }
              }
            }
          }
        }
      }),
      db.payout.findMany({
        where: { contract: { businessId: business.id } },
        orderBy: [{ releasedAt: "desc" }],
        take: 8,
        select: {
          id: true,
          status: true,
          netAmount: true,
          releasedAt: true,
          contract: {
            select: {
              id: true,
              requirement: { select: { id: true, title: true } },
              creator: {
                select: {
                  id: true,
                  fullName: true,
                  instagramUsername: true,
                  instagramHandle: true,
                  instagramProfilePictureUrl: true
                }
              }
            }
          }
        }
      }),
      db.notification.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: "desc" },
        take: 20
      })
    ]);

    const topReels = topReelContracts
      .map((c) => {
        const latestDeliverable = c.deliverables[0];
        if (!latestDeliverable) return null;
        const latestSnapshot = c.metricSnapshots[0];
        const views = latestSnapshot?.views ?? c.performanceReport?.viewsCount ?? 0;
        const engagement = parseEngagement(latestSnapshot?.rawJson);
        return {
          contractId: c.id,
          deliverableId: latestDeliverable.id,
          requirementId: c.requirement.id,
          requirementTitle: c.requirement.title,
          creatorId: c.creator.id,
          creatorName: c.creator.fullName,
          creatorHandle: c.creator.instagramUsername ?? c.creator.instagramHandle ?? null,
          creatorAvatarUrl: c.creator.instagramProfilePictureUrl ?? null,
          previewUrl: latestDeliverable.externalUrl ?? latestDeliverable.fileUrl,
          instagramMediaId: latestDeliverable.instagramMediaId ?? null,
          views,
          likes: engagement.likes,
          comments: engagement.comments,
          shares: engagement.shares,
          updatedAt: (latestSnapshot?.capturedAt ?? c.performanceReport?.submittedAt ?? latestDeliverable.submittedAt ?? new Date()).toISOString()
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
      .sort((a, b) => {
        const engagementA = (a.likes ?? 0) + (a.comments ?? 0) + (a.shares ?? 0);
        const engagementB = (b.likes ?? 0) + (b.comments ?? 0) + (b.shares ?? 0);
        if (b.views !== a.views) return b.views - a.views;
        return engagementB - engagementA;
      })
      .slice(0, 3);

    const appNotifications: HomeNotification[] = recentApplications.slice(0, 8).map((a) => {
      const handle = a.creator.instagramUsername ?? null;
      return {
        id: `app-${a.id}`,
        type: "APPLICATION",
        title: handle ? `@${handle} applied` : `${a.creator.fullName} applied`,
        body: `${a.requirement.title} received a new application.`,
        href: `/business/campaigns/${a.requirement.id}?creator=${a.creator.id}`,
        actor: {
          name: a.creator.fullName,
          handle,
          avatarUrl: a.creator.instagramProfilePictureUrl ?? null
        },
        createdAt: a.appliedAt.toISOString(),
        readAt: null
      };
    });

    const deliverableNotifications: HomeNotification[] = submittedDeliverables.map((d) => {
      const handle = d.contract.creator.instagramUsername ?? d.contract.creator.instagramHandle ?? null;
      return {
        id: `deliverable-${d.id}`,
        type: "DELIVERABLE",
        title: handle ? `@${handle} submitted a deliverable` : `${d.contract.creator.fullName} submitted a deliverable`,
        body: `New submission in ${d.contract.requirement.title}.`,
        href: resolveLinkToExternalOrCampaign({
          externalUrl: d.externalUrl,
          requirementId: d.contract.requirement.id,
          creatorId: d.contract.creator.id
        }),
        actor: {
          name: d.contract.creator.fullName,
          handle,
          avatarUrl: d.contract.creator.instagramProfilePictureUrl ?? null
        },
        createdAt: (d.submittedAt ?? new Date()).toISOString(),
        readAt: null
      };
    });

    const milestoneNotifications: HomeNotification[] = topReels
      .map((reel): HomeNotification | null => {
        const milestone = VIEW_MILESTONES.find((m) => reel.views >= m);
        if (!milestone) return null;
        return {
          id: `reel-milestone-${reel.contractId}`,
          type: "REEL_MILESTONE",
          title: `${reel.creatorHandle ? `@${reel.creatorHandle}` : reel.creatorName} crossed ${compactViews(milestone)} views`,
          body: `${reel.requirementTitle} reel is performing strongly.`,
          href: resolveLinkToExternalOrCampaign({
            externalUrl: reel.previewUrl,
            requirementId: reel.requirementId,
            creatorId: reel.creatorId
          }),
          actor: {
            name: reel.creatorName,
            handle: reel.creatorHandle,
            avatarUrl: reel.creatorAvatarUrl
          },
          createdAt: reel.updatedAt,
          readAt: null
        };
      })
      .filter((x): x is HomeNotification => Boolean(x));

    const payoutNotifications: HomeNotification[] = recentPayouts.map((p) => {
      const handle = p.contract.creator.instagramUsername ?? p.contract.creator.instagramHandle ?? null;
      return {
        id: `payout-${p.id}`,
        type: "PAYOUT",
        title: `Payout ${p.status.toLowerCase()}`,
        body: `${handle ? `@${handle}` : p.contract.creator.fullName} · ${p.contract.requirement.title} · ₹${p.netAmount.toString()}`,
        href: `/business/campaigns/${p.contract.requirement.id}?creator=${p.contract.creator.id}`,
        actor: {
          name: p.contract.creator.fullName,
          handle,
          avatarUrl: p.contract.creator.instagramProfilePictureUrl ?? null
        },
        createdAt: (p.releasedAt ?? new Date()).toISOString(),
        readAt: null
      };
    });

    const systemNotifications: HomeNotification[] = rawNotifications.map((n) => ({
      id: `system-${n.id}`,
      type: "SYSTEM",
      title: n.title,
      body: n.body,
      href: "/business/home",
      actor: null,
      createdAt: n.createdAt.toISOString(),
      readAt: n.readAt ? n.readAt.toISOString() : null
    }));

    const homeNotifications = [...milestoneNotifications, ...appNotifications, ...deliverableNotifications, ...payoutNotifications, ...systemNotifications]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 18);

    return NextResponse.json({
      data: {
        managerName,
        businessSummary: {
          brandName: business.brandName,
          legalName: business.legalName,
          instagramUsername: business.instagramUsername ?? null
        },
        activeCampaigns,
        openApplications,
        activeDeals,
        recentApplications,
        topReels,
        homeNotifications
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
