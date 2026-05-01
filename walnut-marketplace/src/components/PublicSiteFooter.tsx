import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

const SOCIAL = [
  { href: "https://www.instagram.com/ongram.app/", label: "OnGram on Instagram", src: "/landing/social1.png" },
  { href: "https://www.linkedin.com", label: "OnGram on LinkedIn", src: "/landing/social2.png" },
  { href: "https://x.com", label: "OnGram on X", src: "/landing/social3.png" }
] as const;

export default function PublicSiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer mt-auto border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 md:px-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
        <div className="flex max-w-xl flex-col gap-4">
          <Link href={"/" as Route} className="brand inline-flex w-fit items-center gap-2 text-foreground" aria-label="OnGram home">
            <span className="brand-badge overflow-hidden bg-transparent p-0">
              <img src="/brand/ongram/logo-round-dark.png" alt="" className="h-full w-full object-cover" aria-hidden />
            </span>
            <span className="text-xl font-semibold tracking-tight">OnGram</span>
          </Link>
          <p className="text-base leading-relaxed text-muted-foreground">
            Delivering visibility to businesses and opportunity to creators
          </p>
          <nav className="flex flex-wrap items-center gap-6" aria-label="Social">
            {SOCIAL.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-80 transition-opacity hover:opacity-100"
                aria-label={item.label}
              >
                <Image src={item.src} alt="" width={24} height={24} className="h-6 w-6 dark:invert dark:filter" />
              </Link>
            ))}
          </nav>
        </div>
        <nav className="flex flex-wrap gap-x-8 gap-y-3 lg:justify-end" aria-label="Footer">
          <Link className="footer-link" href={"/" as Route}>
            Home
          </Link>
          <Link className="footer-link" href={"/privacy" as Route}>
            Privacy
          </Link>
          <Link className="footer-link font-medium text-primary hover:text-primary/90" href={"/login" as Route}>
            Login
          </Link>
          <Link className="footer-link" href={"/signup" as Route}>
            Sign up
          </Link>
        </nav>
      </div>
      <div className="border-t border-border/80 bg-muted/30 dark:bg-muted/15">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 md:px-8">
          <p>© {year} OnGram. All rights reserved.</p>
          <p className="sm:text-right">Built for creators and brands in India and beyond.</p>
        </div>
      </div>
    </footer>
  );
}
