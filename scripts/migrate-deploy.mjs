import { execSync } from "node:child_process";

const REPAIRS = [
  {
    migration: "20250406180000_user_openai_keys",
    sql: "prisma/repair-failed-openai-keys-migration.sql",
  },
  {
    migration: "20250406190000_collections",
    sql: "prisma/repair-failed-collections-migration.sql",
  },
];

function run(command) {
  execSync(command, { stdio: "inherit" });
}

function runCapture(command) {
  return execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function getMigrationErrorOutput(error) {
  return `${error.stdout ?? ""}${error.stderr ?? ""}${error.message ?? ""}`;
}

function findRepair(output) {
  const isMigrationFailure =
    output.includes("P3009") || output.includes("P3018");
  if (!isMigrationFailure) {
    return null;
  }

  return REPAIRS.find(({ migration }) => output.includes(migration)) ?? null;
}

function tryMigrateDeploy() {
  const maxAttempts = REPAIRS.length + 1;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      runCapture("npx prisma migrate deploy");
      return;
    } catch (error) {
      const output = getMigrationErrorOutput(error);
      const repair = findRepair(output);

      if (!repair) {
        process.stderr.write(output);
        process.exit(error.status ?? 1);
      }

      console.log(`Repairing failed migration ${repair.migration}...`);
      run(`npx prisma db execute --file ${repair.sql}`);
      run(`npx prisma migrate resolve --applied ${repair.migration}`);
    }
  }

  throw new Error("Unable to apply migrations after running all repair steps.");
}

tryMigrateDeploy();
