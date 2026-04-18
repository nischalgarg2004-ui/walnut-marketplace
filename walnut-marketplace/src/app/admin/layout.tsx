import { UserRole } from "@prisma/client";
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

  return children;
}
