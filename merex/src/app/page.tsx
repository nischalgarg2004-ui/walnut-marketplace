import PublicMarketingShell from "@/components/PublicMarketingShell";
import LandingPageClient from "@/components/LandingPageClient";

export default function HomePage() {
  return (
    <PublicMarketingShell mainClassName="overflow-x-hidden">
      <LandingPageClient />
    </PublicMarketingShell>
  );
}
