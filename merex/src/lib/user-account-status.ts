import { db } from "@/lib/db";

/** Returns true when the user row exists and is allowed to use the product. */
export async function isUserAccountActive(userId: string): Promise<boolean> {
  const u = await db.user.findUnique({ where: { id: userId }, select: { status: true } });
  return Boolean(u && u.status === "ACTIVE");
}
