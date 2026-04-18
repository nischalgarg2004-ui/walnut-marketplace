"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/creator", label: "Creator" },
  { href: "/business", label: "Business" },
  { href: "/admin", label: "Admin" }
];

export default function AppHeader() {
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.data) return;
        setEmail(data.data.email);
        setRole(data.data.role);
      })
      .catch(() => {
        setEmail(null);
        setRole(null);
      });
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <span className="brand-badge">W</span>
          <span>Project Walnut</span>
        </div>
        <nav className="topnav">
          {links.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                className={`nav-link${isActive ? " active" : ""}`}
                href={link.href as Route}
              >
                {link.label}
              </Link>
            );
          })}
          {email ? (
            <>
              <span className="pill">{role}</span>
              <span className="pill">{email}</span>
              <button className="btn ghost" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <Link className="nav-link" href="/login">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
