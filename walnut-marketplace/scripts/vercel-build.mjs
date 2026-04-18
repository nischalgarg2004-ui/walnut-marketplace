import { execSync } from "node:child_process";

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

// Vercel sets VERCEL=1 during build; apply migrations so schema matches the deployed app.
if (process.env.VERCEL === "1") {
  run("npx prisma migrate deploy");
}
run("npx prisma generate");
run("npx next build");
