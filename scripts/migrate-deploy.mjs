import { execSync } from "node:child_process";

const FAILED_MIGRATION = "20250406180000_user_openai_keys";
const REPAIR_SQL = "prisma/repair-failed-openai-keys-migration.sql";

function run(command) {
  execSync(command, { stdio: "inherit" });
}

function runCapture(command) {
  return execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function tryMigrateDeploy() {
  try {
    runCapture("npx prisma migrate deploy");
    return;
  } catch (error) {
    const output = `${error.stdout ?? ""}${error.stderr ?? ""}${error.message ?? ""}`;
    const isFailedOpenAiKeysMigration =
      output.includes("P3009") && output.includes(FAILED_MIGRATION);

    if (!isFailedOpenAiKeysMigration) {
      process.stderr.write(output);
      process.exit(error.status ?? 1);
    }
  }

  console.log(`Repairing failed migration ${FAILED_MIGRATION}...`);
  run(`npx prisma db execute --file ${REPAIR_SQL}`);
  run(`npx prisma migrate resolve --applied ${FAILED_MIGRATION}`);
  run("npx prisma migrate deploy");
}

tryMigrateDeploy();
