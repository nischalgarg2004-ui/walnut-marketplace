import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CreatorAppShell } from "@/components/shell/CreatorAppShell";
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

  return <CreatorAppShell userEmail={user.email}>{children}</CreatorAppShell>;
}
