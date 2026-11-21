import { execSync } from "node:child_process";

// fresh schema once per run (tests reseed data themselves)
export default function globalSetup() {
  execSync("npm run db:migrate -w api", {
    cwd: "..",
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: "postgres://localhost:5432/posterwall_e2e" },
  });
}
