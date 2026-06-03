/**
 * Upserts a single ADMIN user from ADMIN_SEED_EMAIL + ADMIN_SEED_PASSWORD.
 * Does not run the full prisma seed (safe for production).
 *
 * Usage (production file is gitignored):
 *   DOTENV_CONFIG_PATH=.env.production.vercel npx tsx scripts/upsert-admin-user.ts
 * Local:
 *   npx tsx scripts/upsert-admin-user.ts
 */
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { hashSync } from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

const envFile = process.env.DOTENV_CONFIG_PATH ?? ".env.local";
loadEnv({ path: resolve(process.cwd(), envFile) });

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL?.trim();
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!email || !password || password.length < 6) {
    console.error("Set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD (min 6 chars) in your env file.");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is missing.");
    process.exit(1);
  }

  const passwordHash = hashSync(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: UserRole.ADMIN, status: "ACTIVE" },
    create: {
      email,
      passwordHash,
      role: UserRole.ADMIN,
      status: "ACTIVE"
    }
  });
  console.log("Admin user upserted:", email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
