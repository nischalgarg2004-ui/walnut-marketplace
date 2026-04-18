"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PublicSiteHeader() {
  const pathname = usePathname();

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link href={"/" as Route} className="brand">
          <span className="brand-badge">W</span>
          <span>Walnut</span>
        </Link>
        <nav className="topnav" aria-label="Marketing">
          <Link className={pathname === "/" ? "nav-link active" : "nav-link"} href={"/" as Route}>
            Home
          </Link>
          <Link className={pathname === "/login" ? "nav-link active" : "nav-link"} href={"/login" as Route}>
            Login
          </Link>
          <Link className={pathname === "/signup" ? "nav-link active" : "nav-link"} href={"/signup" as Route}>
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}
