/**
 * Curated niches for the Indian creator economy — pick 1–5 on the creator profile.
 * Values are stable slugs stored in DB; labels are display-only.
 */
export const CREATOR_NICHES = [
  { slug: "beauty-skincare", label: "Beauty & skincare" },
  { slug: "fashion-styling", label: "Fashion & personal styling" },
  { slug: "hair-grooming", label: "Haircare & grooming" },
  { slug: "fitness-strength", label: "Fitness & strength training" },
  { slug: "yoga-meditation", label: "Yoga & meditation" },
  { slug: "food-home-cooking", label: "Food & home cooking" },
  { slug: "food-reviews-restaurants", label: "Restaurant & cafe reviews" },
  { slug: "regional-food-culture", label: "Regional food & culture" },
  { slug: "travel-explore-india", label: "Travel & explore India" },
  { slug: "budget-backpack-travel", label: "Budget & backpack travel" },
  { slug: "tech-gadgets", label: "Tech & gadgets" },
  { slug: "smartphones-reviews", label: "Smartphones & reviews" },
  { slug: "gaming-pc-console", label: "Gaming (PC & console)" },
  { slug: "mobile-gaming-esports", label: "Mobile gaming & esports" },
  { slug: "comedy-sketches", label: "Comedy & sketches" },
  { slug: "memes-trends", label: "Memes & trends" },
  { slug: "dance-performance", label: "Dance & performance" },
  { slug: "music-singing", label: "Music & singing" },
  { slug: "podcast-audio", label: "Podcast & audio" },
  { slug: "education-study-tips", label: "Education & study tips" },
  { slug: "competitive-exams", label: "Competitive exams (JEE/NEET/UPSC etc.)" },
  { slug: "stock-market-investing", label: "Stock market & investing" },
  { slug: "personal-finance-savings", label: "Personal finance & savings" },
  { slug: "real-estate-housing", label: "Real estate & housing" },
  { slug: "startups-side-hustles", label: "Startups & side hustles" },
  { slug: "parenting-family", label: "Parenting & family" },
  { slug: "kids-content", label: "Kids content" },
  { slug: "pets-animals", label: "Pets & animals" },
  { slug: "sustainability-climate", label: "Sustainability & climate" },
  { slug: "automobiles-reviews", label: "Automobiles & reviews" },
  { slug: "bikes-motoring", label: "Bikes & motoring" },
  { slug: "cricket", label: "Cricket" },
  { slug: "sports-fitness", label: "Sports & athletics" },
  { slug: "photography-video", label: "Photography & video" },
  { slug: "art-design", label: "Art & design" },
  { slug: "diy-handmade", label: "DIY & handmade" },
  { slug: "home-interiors", label: "Home interiors & decor" },
  { slug: "handloom-made-in-india", label: "Handloom & Made in India" },
  { slug: "farming-rural", label: "Farming & rural India" },
  { slug: "news-opinion", label: "News & opinion" },
  { slug: "movies-ott", label: "Movies & OTT" },
  { slug: "books-literature", label: "Books & literature" },
  { slug: "regional-language-content", label: "Regional language content" },
  { slug: "daily-vlogging", label: "Daily vlogging" },
  { slug: "professional-coaching", label: "Professional coaching (CA/law/career)" },
  { slug: "health-nutrition", label: "Health & nutrition" },
  { slug: "mental-wellness", label: "Mental wellness" },
  { slug: "mens-grooming", label: "Men's grooming" },
  { slug: "wedding-lifestyle", label: "Wedding & lifestyle" },
  { slug: "creator-tools-editing", label: "Creator tools & editing" }
] as const;

export const CREATOR_NICHE_SLUG_SET = new Set<string>(CREATOR_NICHES.map((n) => n.slug));

export function isValidCreatorNicheSlug(s: string): boolean {
  return CREATOR_NICHE_SLUG_SET.has(s);
}

export type CreatorNicheSlug = (typeof CREATOR_NICHES)[number]["slug"];
