import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        ingestionBatch: {
          create: vi.fn().mockResolvedValue({
            id: 'b1',
            filename: 'x.csv',
            format: 'csv',
            totalRows: 0,
            acceptedRows: 0,
            rejectedRows: 0,
            uploadedById: 'u1',
            createdAt: new Date(),
          }),
        },
        card: {
          upsert: vi.fn(),
          findMany: vi.fn().mockResolvedValue([]),
        },
        transaction: {
          createMany: vi.fn(),
        },
      }),
    ),
  },
}));

import { HttpError } from '../src/middleware/error';
import { detectFormat, ingestUpload } from '../src/services/ingestion';

describe('detectFormat', () => {
  it('detects csv/json/xml extensions case-insensitively', () => {
    expect(detectFormat('a.csv')).toBe('csv');
    expect(detectFormat('A.CSV')).toBe('csv');
    expect(detectFormat('b.json')).toBe('json');
    expect(detectFormat('c.xml')).toBe('xml');
  });
  it('returns null for unsupported extensions', () => {
    expect(detectFormat('x.txt')).toBeNull();
    expect(detectFormat('noext')).toBeNull();
  });
});

describe('ingestUpload', () => {
  it('throws 400 when file is missing', async () => {
    await expect(ingestUpload(undefined, 'u1')).rejects.toBeInstanceOf(HttpError);
    await expect(ingestUpload(undefined, 'u1')).rejects.toMatchObject({ status: 400 });
  });

  it('throws 400 when extension is unsupported', async () => {
    const file = {
      originalname: 'thing.txt',
      buffer: Buffer.from(''),
    } as Express.Multer.File;
    await expect(ingestUpload(file, 'u1')).rejects.toMatchObject({
      status: 400,
      code: 'ValidationError',
    });
  });

  it('ingests an empty CSV into a batch', async () => {
    const file = {
      originalname: 'empty.csv',
      buffer: Buffer.from('cardNumber,timestamp,amount\n'),
    } as Express.Multer.File;
    const res = await ingestUpload(file, 'u1');
    expect(res.id).toBe('b1');
  });
});
