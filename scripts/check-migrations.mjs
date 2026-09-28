// Fails the build when lib/db/schema.ts has changes that no migration in ./drizzle covers.
// Without this, a deploy would ship code expecting columns the database never gets.
// Fix a failure with `npm run db:generate`, then commit the new file in drizzle/.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, rmSync } from "node:fs";

const KIT = "node_modules/drizzle-kit/bin.cjs";
const TMP = ".drizzle-check";

if (!existsSync(KIT)) {
  console.log("[db:check] drizzle-kit not installed, skipping the migration check.");
  process.exit(0);
}

const files = (dir) => readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

rmSync(TMP, { recursive: true, force: true });
cpSync("drizzle", TMP, { recursive: true });
try {
  const run = spawnSync(
    process.execPath,
    [KIT, "generate", "--dialect", "postgresql", "--schema", "./lib/db/schema.ts", "--out", `./${TMP}`],
    // No stdin: if drizzle-kit wants to ask about a rename, it can't hang the build.
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", timeout: 60_000 }
  );
  const added = files(TMP).filter((f) => !files("drizzle").includes(f));

  if (run.status === 0 && added.length === 0) {
    console.log("[db:check] Migrations match lib/db/schema.ts.");
  } else {
    console.error(
      "[db:check] lib/db/schema.ts has changes without a migration, so the database would not get them.\n" +
        "[db:check] Run `npm run db:generate`, commit the new file in drizzle/, and deploy again."
    );
    if (run.status !== 0) console.error(run.stdout, run.stderr, run.error ?? "");
    process.exitCode = 1;
  }
} finally {
  rmSync(TMP, { recursive: true, force: true });
}
