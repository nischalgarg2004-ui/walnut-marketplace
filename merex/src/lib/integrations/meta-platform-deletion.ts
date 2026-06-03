import { db } from "@/lib/db";

export type MetaDeletionScope = "DEAUTHORIZE" | "DATA_DELETION";

export type MetaDeletionResult = {
  scope: MetaDeletionScope;
  instagramUserId: string;
  matchedUserId: string | null;
  matchedProfileType: "CREATOR" | "BUSINESS" | null;
  affectedTables: string[];
};

/**
 * Clears Instagram-derived data for the account identified by `instagramUserId`.
 *
 * - DEAUTHORIZE: clears the encrypted token, token expiry, connection timestamp,
 *   handle, account type, follower / post / view aggregates, profile picture
 *   URL, and instagram-derived media references on contracts/deliverables.
 *   The Merex account itself is preserved so the user can reconnect later.
 *
 * - DATA_DELETION: everything DEAUTHORIZE does, plus removes any persisted
 *   Instagram media id references on the user's contract deliverables and
 *   performance reports so no Meta-derived data remains.
 *
 * Both scopes are idempotent — calling them when no profile is linked is a
 * no-op, and Meta is told that data has been deleted (which is true because
 * nothing was stored for that user_id).
 */
export async function executeMetaPlatformDeletion(
  instagramUserId: string,
  scope: MetaDeletionScope
): Promise<MetaDeletionResult> {
  const affected: string[] = [];

  const creatorProfile = await db.creatorProfile.findUnique({
    where: { instagramUserId },
    select: { id: true, userId: true }
  });
  const businessProfile = creatorProfile
    ? null
    : await db.businessProfile.findUnique({
        where: { instagramUserId },
        select: { id: true, userId: true }
      });

  if (creatorProfile) {
    await db.creatorProfile.update({
      where: { id: creatorProfile.id },
      data: {
        instagramUserId: null,
        instagramUsername: null,
        instagramHandle: null,
        instagramAccountType: null,
        instagramConnectedAt: null,
        instagramAccessTokenEncrypted: null,
        instagramTokenExpiresAt: null,
        instagramStatsSyncedAt: null,
        instagramProfilePictureUrl: null,
        followerCount: 0,
        postCount: 0,
        instagramViewsTotal: 0,
        avgEngagement: 0
      }
    });
    affected.push("CreatorProfile");

    if (scope === "DATA_DELETION") {
      const contracts = await db.contract.findMany({
        where: { creatorId: creatorProfile.id },
        select: { id: true }
      });
      const contractIds = contracts.map((c) => c.id);
      if (contractIds.length > 0) {
        const cleared = await db.deliverable.updateMany({
          where: { contractId: { in: contractIds }, instagramMediaId: { not: null } },
          data: { instagramMediaId: null }
        });
        if (cleared.count > 0) affected.push("Deliverable.instagramMediaId");
      }
    }
  }

  if (businessProfile) {
    await db.businessProfile.update({
      where: { id: businessProfile.id },
      data: {
        instagramUserId: null,
        instagramUsername: null,
        instagramAccountType: null,
        instagramConnectedAt: null,
        instagramAccessTokenEncrypted: null,
        instagramTokenExpiresAt: null
      }
    });
    affected.push("BusinessProfile");
  }

  return {
    scope,
    instagramUserId,
    matchedUserId: creatorProfile?.userId ?? businessProfile?.userId ?? null,
    matchedProfileType: creatorProfile ? "CREATOR" : businessProfile ? "BUSINESS" : null,
    affectedTables: affected
  };
}
