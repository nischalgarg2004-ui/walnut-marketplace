import { UserRole } from "@prisma/client";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { parseSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? parseSessionToken(token) : null;

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (user.role !== UserRole.ADMIN) {
    if (user.role === UserRole.CREATOR) redirect("/creator");
    if (user.role === UserRole.BUSINESS) redirect("/business");
    redirect("/login");
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-sticky border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 text-sm">
          <Link className="font-semibold text-foreground" href="/admin">
            Admin
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link className="text-muted-foreground hover:text-foreground" href="/">
            Marketing site
          </Link>
        </nav>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-5">{children}</div>
    </div>
  );
}
