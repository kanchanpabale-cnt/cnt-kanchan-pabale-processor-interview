import type { IngestionBatch } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { HttpError } from '../../middleware/error';
import { parseCsv } from './csv.parser';
import { parseJson } from './json.parser';
import { parseXml } from './xml.parser';
import { validateRow } from './validate';

export type IngestFormat = 'csv' | 'json' | 'xml';

export interface IngestInput {
  buffer: Buffer;
  filename: string;
  format: IngestFormat;
  uploaderId: string;
}

export interface IngestResult extends IngestionBatch {}

export function detectFormat(filename: string): IngestFormat | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.csv')) return 'csv';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.xml')) return 'xml';
  return null;
}

/**
 * High-level entry point for uploaded files.
 * Encapsulates all ingestion business rules (file presence, supported formats)
 * so controllers stay thin — they only need to pass `req.file` and the uploader id.
 */
export async function ingestUpload(
  file: Express.Multer.File | undefined,
  uploaderId: string,
): Promise<IngestResult> {
  if (!file) throw new HttpError(400, 'No file provided', 'ValidationError');
  const format = detectFormat(file.originalname);
  if (!format) {
    throw new HttpError(400, 'Only .csv, .json, .xml supported', 'ValidationError');
  }
  return ingestBuffer({
    buffer: file.buffer,
    filename: file.originalname,
    format,
    uploaderId,
  });
}

function parseByFormat(buffer: Buffer, format: IngestFormat) {
  switch (format) {
    case 'csv':
      return parseCsv(buffer);
    case 'json':
      return parseJson(buffer);
    case 'xml':
      return parseXml(buffer);
  }
}

export async function ingestBuffer(input: IngestInput): Promise<IngestResult> {
  const raw = parseByFormat(input.buffer, input.format);
  const validated = raw.map(validateRow);

  const accepted = validated.filter((r) => r.ok === true);
  const rejected = validated.filter((r) => r.ok === false);

  // Pre-create/upsert all unique cards from accepted rows.
  const uniqueCards = new Map<
    string,
    { cardNumber: string; last4: string; cardType: 'AMEX' | 'VISA' | 'MASTERCARD' | 'DISCOVER' }
  >();
  for (const r of accepted) {
    if (r.ok && !uniqueCards.has(r.cardNumber)) {
      uniqueCards.set(r.cardNumber, { cardNumber: r.cardNumber, last4: r.last4, cardType: r.cardType });
    }
  }

  const batch = await prisma.$transaction(async (tx) => {
    const created = await tx.ingestionBatch.create({
      data: {
        filename: input.filename,
        format: input.format,
        totalRows: validated.length,
        acceptedRows: accepted.length,
        rejectedRows: rejected.length,
        uploadedById: input.uploaderId,
      },
    });

    // Upsert cards
    for (const c of uniqueCards.values()) {
      await tx.card.upsert({
        where: { cardNumber: c.cardNumber },
        update: {},
        create: { cardNumber: c.cardNumber, last4: c.last4, cardType: c.cardType },
      });
    }

    // Map cardNumber -> id once
    const cardIds = new Map<string, string>();
    const cards = await tx.card.findMany({
      where: { cardNumber: { in: Array.from(uniqueCards.keys()) } },
      select: { id: true, cardNumber: true },
    });
    for (const c of cards) cardIds.set(c.cardNumber, c.id);

    // Bulk insert transactions
    if (accepted.length > 0) {
      await tx.transaction.createMany({
        data: accepted.map((r) => {
          if (!r.ok) throw new Error('unreachable');
          return {
            cardId: cardIds.get(r.cardNumber)!,
            rawCardNumber: r.cardNumber,
            timestamp: r.timestamp,
            amount: r.amount,
            status: 'ACCEPTED',
            batchId: created.id,
          };
        }),
      });
    }

    if (rejected.length > 0) {
      await tx.transaction.createMany({
        data: rejected.map((r) => {
          if (r.ok) throw new Error('unreachable');
          return {
            cardId: null,
            rawCardNumber: r.rawCardNumber,
            timestamp: r.timestamp ?? new Date(0),
            amount: r.amount ?? '0',
            status: 'REJECTED',
            rejectionReason: r.rejectionReason,
            batchId: created.id,
          };
        }),
      });
    }

    return created;
  });

  logger.info(
    { filename: input.filename, accepted: accepted.length, rejected: rejected.length },
    'Ingestion complete',
  );
  return batch;
}
