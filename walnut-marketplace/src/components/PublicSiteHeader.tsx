"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PublicSiteHeader() {
  const pathname = usePathname();
  const loginClass = pathname.startsWith("/login") ? "nav-link login-primary active" : "nav-link login-primary";

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href={"/" as Route} className="brand">
          <span className="brand-badge overflow-hidden bg-transparent p-0">
            <img src="/brand/ongram/logo-round-dark.png" alt="OnGram" className="h-full w-full object-cover" />
          </span>
          <span>OnGram</span>
        </Link>
        <nav className="topnav" aria-label="Marketing">
          <Link className={pathname === "/" ? "nav-link active" : "nav-link"} href={"/" as Route}>
            Home
          </Link>
          <Link className={pathname.startsWith("/privacy") ? "nav-link active" : "nav-link"} href={"/privacy" as Route}>
            Privacy
          </Link>
          <Link className={loginClass} href={"/login" as Route}>
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
