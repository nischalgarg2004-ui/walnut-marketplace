export type Eligibility = {
  genderAllowed: string[];
  minFollowers: number;
  minEngagementRate: number | null;
  allowedLocations: string[];
  allowedDistrictIds: string[];
  niches: string[];
};

export type CreatorSignals = {
  gender?: string | null;
  followerCount: number;
  avgEngagement: number;
  location?: string | null;
  niches: string[];
  indiaDistrictId?: string | null;
};

export type EligibilityOptions = {
  hasBarter: boolean;
};

export function isEligible(
  eligibility: Eligibility,
  creator: CreatorSignals,
  opts: EligibilityOptions
): boolean {
  if (
    eligibility.genderAllowed.length > 0 &&
    creator.gender &&
    !eligibility.genderAllowed.includes(creator.gender)
  ) {
    return false;
  }

  if (creator.followerCount < eligibility.minFollowers) return false;

  if (
    eligibility.minEngagementRate !== null &&
    creator.avgEngagement < eligibility.minEngagementRate
  ) {
    return false;
  }

  if (opts.hasBarter) {
    if (eligibility.allowedDistrictIds.length > 0) {
      if (!creator.indiaDistrictId) return false;
      if (!eligibility.allowedDistrictIds.includes(creator.indiaDistrictId)) {
        return false;
      }
    } else if (eligibility.allowedLocations.length > 0) {
      if (
        creator.location &&
        !eligibility.allowedLocations.includes(creator.location)
      ) {
        return false;
      }
      if (!creator.location) return false;
    }
  }

  if (eligibility.niches.length > 0) {
    const overlap = creator.niches.some((n) => eligibility.niches.includes(n));
    if (!overlap) return false;
  }

  return true;
}
