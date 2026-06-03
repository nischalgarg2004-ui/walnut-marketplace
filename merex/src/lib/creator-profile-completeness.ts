type CreatorCompletenessInput = {
  fullName?: string | null;
  niches?: string[] | null;
  instagramUsername?: string | null;
  instagramProfilePictureUrl?: string | null;
};

export function isPlaceholderInstagramHandle(value: string | null | undefined): boolean {
  const normalized = (value ?? "").replace(/^@/, "").trim().toLowerCase();
  return /^instagram_\d+$/.test(normalized);
}

export function creatorProfileNeedsOnboarding(profile: CreatorCompletenessInput): boolean {
  const hasPlaceholderUsername = isPlaceholderInstagramHandle(profile.instagramUsername);
  const hasNiches = Array.isArray(profile.niches) && profile.niches.length > 0;
  const hasName =
    Boolean(profile.fullName?.trim()) && (profile.fullName ?? "").trim().toLowerCase() !== "creator";
  const hasAvatar = Boolean(profile.instagramProfilePictureUrl?.trim());
  return hasPlaceholderUsername || !hasNiches || !hasName || !hasAvatar;
}
