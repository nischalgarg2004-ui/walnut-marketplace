import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { parseSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? parseSessionToken(token) : null;

  if (!user) {
    redirect("/login?next=/creator");
  }

  if (user.role !== UserRole.CREATOR) {
    if (user.role === UserRole.BUSINESS) redirect("/business");
    if (user.role === UserRole.ADMIN) redirect("/admin");
    redirect("/login");
  }

  return (
    <div className="stack">
      <nav className="card row" style={{ flexWrap: "wrap" }}>
        <Link className="btn ghost" href="/creator/dashboard">
          Dashboard
        </Link>
        <Link className="btn ghost" href="/creator/opportunities">
          Opportunities
        </Link>
        <Link className="btn ghost" href="/creator/deals">
          My deals
        </Link>
        <Link className="btn ghost" href="/creator/applications">
          Applications
        </Link>
        <Link className="btn ghost" href="/creator/projects">
          Projects
        </Link>
        <Link className="btn ghost" href="/creator/earnings">
          Earnings
        </Link>
        <Link className="btn ghost" href="/creator/profile">
          Profile
        </Link>
        <Link className="btn ghost" href="/creator/settings">
          Settings
        </Link>
      </nav>
      {children}
    </div>
  );
}
