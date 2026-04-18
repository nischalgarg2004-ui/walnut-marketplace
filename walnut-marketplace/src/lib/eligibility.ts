type Eligibility = {
  genderAllowed: string[];
  minFollowers: number;
  minEngagementRate: number | null;
  allowedLocations: string[];
  niches: string[];
};

type CreatorSignals = {
  gender?: string | null;
  followerCount: number;
  avgEngagement: number;
  location?: string | null;
  niches: string[];
};

export function isEligible(eligibility: Eligibility, creator: CreatorSignals): boolean {
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

  if (
    eligibility.allowedLocations.length > 0 &&
    creator.location &&
    !eligibility.allowedLocations.includes(creator.location)
  ) {
    return false;
  }

  if (eligibility.niches.length > 0) {
    const overlap = creator.niches.some((n) => eligibility.niches.includes(n));
    if (!overlap) return false;
  }

  return true;
}
