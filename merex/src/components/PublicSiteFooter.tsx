import type { Route } from "next";
import Link from "next/link";

import { BRAND_NAME, LOGO_ROUND_DARK, SUPPORT_MAILTO } from "@/lib/brand";

export default function PublicSiteFooter() {
  return (
    <footer className="border-t border-border/10 bg-transparent py-16 px-6 sm:px-10">
      <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
        
        {/* Left Column: Copyright info */}
        <div className="flex flex-col gap-4 max-w-sm">
          <p className="font-geist-custom text-base text-[#8C8D92] leading-relaxed whitespace-pre-line">
            © 2026 Merex
            All Eyes at You
          </p>
          <p className="font-geist-custom text-xs text-muted-foreground/60 leading-relaxed">
            Delivering visibility to businesses and opportunity to creators.
          </p>
        </div>

        {/* Right Columns: Links & Connect */}
        <div className="flex flex-wrap gap-x-20 gap-y-8">
          
          {/* Links Column */}
          <div className="flex flex-col gap-4 min-w-[120px]">
            <span className="font-geist-custom text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 border border-border/20 w-fit px-2 py-0.5 rounded">
              Links
            </span>
            <nav className="flex flex-col gap-3" aria-label="Footer Navigation">
              <Link className="font-geist-custom text-[20px] font-normal text-[#F6F8FB] hover:text-primary transition-colors" href={"/" as Route}>
                Home
              </Link>
              <Link className="font-geist-custom text-[20px] font-normal text-[#F6F8FB] hover:text-primary transition-colors" href={"/login/creator" as Route}>
                Creator
              </Link>
              <Link className="font-geist-custom text-[20px] font-normal text-[#F6F8FB] hover:text-primary transition-colors" href={"/login/business" as Route}>
                Business
              </Link>
            </nav>
          </div>

          {/* Connect Column */}
          <div className="flex flex-col gap-4 min-w-[120px]">
            <span className="font-geist-custom text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 border border-border/20 w-fit px-2 py-0.5 rounded">
              Connect
            </span>
            <nav className="flex flex-col gap-3" aria-label="Social Links">
              <a className="font-geist-custom text-[20px] font-normal text-[#F6F8FB] hover:text-primary transition-colors" href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
              <a className="font-geist-custom text-[20px] font-normal text-[#F6F8FB] hover:text-primary transition-colors" href="https://threads.net" target="_blank" rel="noopener noreferrer">
                Threads
              </a>
              <a className="font-geist-custom text-[20px] font-normal text-[#F6F8FB] hover:text-primary transition-colors" href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                YouTube
              </a>
              <a className="font-geist-custom text-[20px] font-normal text-[#F6F8FB] hover:text-primary transition-colors" href={SUPPORT_MAILTO}>
                Email
              </a>
            </nav>
          </div>

        </div>

      </div>
    </footer>
  );
}
