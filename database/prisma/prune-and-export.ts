/**
 * One-off maintenance script.
 *
 *   1. Keeps only the most-recent KEEP transactions (by timestamp).
 *   2. Writes the rows being deleted to data/exported.{csv,json,xml}
 *      so they can be re-uploaded through the UI to exercise ingestion.
 *   3. Deletes the rest from the DB.
 *
 * Run:   npx tsx database/prisma/prune-and-export.ts
 */
import { PrismaClient } from '@prisma/client';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const KEEP = 1000;
const prisma = new PrismaClient();
const REPO_ROOT = process.cwd();

function csvEscape(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function xmlEscape(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function main() {
  const total = await prisma.transaction.count();
  console.log(`Current transaction count: ${total}`);
  if (total <= KEEP) {
    console.log(`Nothing to prune — already at or below ${KEEP}.`);
    return;
  }

  const keep = await prisma.transaction.findMany({
    orderBy: [{ timestamp: 'desc' }, { id: 'desc' }],
    take: KEEP,
    select: { id: true },
  });
  const keepIds = keep.map((t) => t.id);
  console.log(`Keeping ${keepIds.length} most-recent transactions.`);

  const toDelete = await prisma.transaction.findMany({
    where: { id: { notIn: keepIds } },
    orderBy: [{ timestamp: 'asc' }, { id: 'asc' }],
    select: { rawCardNumber: true, timestamp: true, amount: true },
  });
  console.log(`Fetched ${toDelete.length} rows to export and delete.`);

  const rows = toDelete.map((t) => ({
    cardNumber: t.rawCardNumber,
    timestamp: t.timestamp.toISOString(),
    amount: t.amount.toFixed(2),
  }));

  const dataDir = join(REPO_ROOT, 'data');
  mkdirSync(dataDir, { recursive: true });

  const csvPath = join(dataDir, 'exported.csv');
  const jsonPath = join(dataDir, 'exported.json');
  const xmlPath = join(dataDir, 'exported.xml');

  // CSV
  const csvHeader = 'cardNumber,timestamp,amount';
  const csvBody = rows
    .map((r) => `${csvEscape(r.cardNumber)},${csvEscape(r.timestamp)},${r.amount}`)
    .join('\n');
  writeFileSync(csvPath, `${csvHeader}\n${csvBody}\n`);

  // JSON
  writeFileSync(
    jsonPath,
    JSON.stringify(
      rows.map((r) => ({
        cardNumber: r.cardNumber,
        timestamp: r.timestamp,
        amount: Number(r.amount),
      })),
      null,
      2,
    ) + '\n',
  );

  // XML
  const xmlBody = rows
    .map(
      (r) =>
        `  <transaction>\n` +
        `    <cardNumber>${xmlEscape(r.cardNumber)}</cardNumber>\n` +
        `    <timestamp>${xmlEscape(r.timestamp)}</timestamp>\n` +
        `    <amount>${r.amount}</amount>\n` +
        `  </transaction>`,
    )
    .join('\n');
  writeFileSync(
    xmlPath,
    `<?xml version="1.0" encoding="UTF-8"?>\n<transactions>\n${xmlBody}\n</transactions>\n`,
  );

  console.log(`Wrote:`);
  console.log(`  ${csvPath}`);
  console.log(`  ${jsonPath}`);
  console.log(`  ${xmlPath}`);

  const res = await prisma.transaction.deleteMany({
    where: { id: { notIn: keepIds } },
  });
  const remaining = await prisma.transaction.count();
  console.log(`Deleted ${res.count} transactions. Remaining: ${remaining}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
