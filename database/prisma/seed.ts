/**
 * Database seed.
 *
 *   1. Upserts admin + analyst demo users (idempotent).
 *   2. Ingests test/*.csv|json|xml so the UI has content on first run.
 *      data/*.{csv,json,xml} is NOT auto-seeded — it's uploaded through the UI
 *      to demo the real ingestion flow.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ingestBuffer } from "../../server/src/services/ingestion";

const prisma = new PrismaClient();
const REPO_ROOT = process.cwd();

async function seedUsers() {
  const adminHash = await bcrypt.hash("Admin123!", 12);
  const analystHash = await bcrypt.hash("Analyst123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@signapay.local" },
    update: {},
    create: {
      email: "admin@signapay.local",
      passwordHash: adminHash,
      name: "David's coffee shop",
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "analyst@signapay.local" },
    update: {},
    create: {
      email: "analyst@signapay.local",
      passwordHash: analystHash,
      name: "Analyst User",
      role: "ANALYST",
    },
  });

  console.log("Users seeded:");
  console.log("  admin@signapay.local / Admin123!   (ADMIN)");
  console.log("  analyst@signapay.local / Analyst123!  (ANALYST)");
  return admin;
}

async function seedTransactions(uploaderId: string) {
  const existing = await prisma.transaction.count();
  if (existing > 0) {
    console.log(
      `Transactions already present (${existing}) — skipping ingestion.`,
    );
    return;
  }

  const files: Array<{
    path: string;
    filename: string;
    format: "csv" | "json" | "xml";
  }> = [
    {
      path: join(REPO_ROOT, "test", "test.csv"),
      filename: "test.csv",
      format: "csv",
    },
    {
      path: join(REPO_ROOT, "test", "test.json"),
      filename: "test.json",
      format: "json",
    },
    {
      path: join(REPO_ROOT, "test", "test.xml"),
      filename: "test.xml",
      format: "xml",
    },
  ];

  for (const f of files) {
    const buf = readFileSync(f.path);
    const result = await ingestBuffer({
      buffer: buf,
      filename: f.filename,
      format: f.format,
      uploaderId,
    });
    console.log(
      `Ingested ${f.filename}: ${result.acceptedRows} accepted, ${result.rejectedRows} rejected`,
    );
  }
}

async function main() {
  const admin = await seedUsers();
  await seedTransactions(admin.id);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
