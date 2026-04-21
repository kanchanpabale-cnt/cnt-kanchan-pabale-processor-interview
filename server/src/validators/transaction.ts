import { z } from 'zod';

const signedDecimal = z
  .string()
  .regex(/^-?\d+(\.\d{1,2})?$/, 'Amount must be a numeric dollar value')
  .refine((v) => Number.isFinite(Number(v)), 'Invalid amount');

export const listTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  status: z.enum(['ACCEPTED', 'REJECTED']).optional(),
  cardId: z.string().optional(),
  cardType: z.enum(['AMEX', 'VISA', 'MASTERCARD', 'DISCOVER']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  minAmount: signedDecimal.optional(),
  maxAmount: signedDecimal.optional(),
});

export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
