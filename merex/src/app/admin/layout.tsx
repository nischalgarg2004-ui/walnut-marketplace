import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminAppShell } from "@/components/shell/AdminAppShell";
import { parseSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { isUserAccountActive } from "@/lib/user-account-status";

const ADMIN_LOGIN = "/login/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? parseSessionToken(token) : null;

  if (!user) {
    redirect(`${ADMIN_LOGIN}?next=/admin`);
  }

  if (!(await isUserAccountActive(user.userId))) {
    redirect(`${ADMIN_LOGIN}?next=/admin&error=account_suspended`);
  }

  if (user.role !== UserRole.ADMIN) {
    redirect(`${ADMIN_LOGIN}?next=/admin&error=wrong_role`);
  }

  return <AdminAppShell userEmail={user.email}>{children}</AdminAppShell>;
}
