import { z } from 'zod';

const AMOUNT_MAX = 100_000; // |amount| must be strictly < 100k — per-charge ceiling for the demo

const DECIMAL_REGEX = /^-?\d+(\.\d{1,2})?$/;

/**
 * Card PAN rules:
 *   - 15 digits if leading digit is 3 (Amex)
 *   - 16 digits if leading digit is 4 (Visa), 5 (MC), or 6 (Discover)
 *   - All digits only; input may arrive with spaces (we strip them)
 */
const cardNumberSchema = z
  .string()
  .transform((v) => v.replace(/\s+/g, ''))
  .pipe(
    z
      .string()
      .regex(/^\d+$/, 'Card number must contain only digits')
      .refine((v) => v.length === 15 || v.length === 16, {
        message: 'Card number must be 15 (Amex) or 16 digits',
      })
      .refine(
        (v) => {
          const first = v[0];
          if (first === '3') return v.length === 15;
          if (['4', '5', '6'].includes(first)) return v.length === 16;
          return false;
        },
        {
          message:
            'Amex (starts 3) = 15 digits; Visa/MasterCard/Discover (4/5/6) = 16 digits',
        },
      ),
  );

const amountSchema = z
  .string()
  .regex(DECIMAL_REGEX, 'Amount must be a dollar value with up to 2 decimal places')
  .refine((v) => Number(v) !== 0, { message: 'Amount cannot be zero' })
  .refine((v) => Math.abs(Number(v)) < AMOUNT_MAX, {
    message: `Amount magnitude must be less than $${AMOUNT_MAX.toLocaleString()}`,
  });

const timestampSchema = z
  .string()
  .min(1, 'Transaction datetime is required')
  .refine((v) => !Number.isNaN(new Date(v).getTime()), 'Invalid datetime');

export const createCardSchema = z.object({
  cardNumber: cardNumberSchema,
  holderName: z
    .string()
    .trim()
    .max(80)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  transactions: z
    .array(z.object({ amount: amountSchema, timestamp: timestampSchema }))
    .min(1, 'At least one transaction is required')
    .max(50, 'A card can be created with at most 50 initial transactions'),
});

/**
 * Update rules:
 *   - holderName is optional metadata
 *   - amount + timestamp are optional; if either is provided, BOTH must be.
 *     When both are provided, a new transaction is appended to the card.
 */
export const updateCardSchema = z
  .object({
    holderName: z.string().trim().max(80).nullable().optional(),
    amount: amountSchema.optional(),
    timestamp: timestampSchema.optional(),
  })
  .refine(
    (v) => {
      const hasAmount = v.amount !== undefined;
      const hasTimestamp = v.timestamp !== undefined;
      return hasAmount === hasTimestamp;
    },
    {
      message: 'Amount and timestamp must be provided together',
      path: ['amount'],
    },
  );

export const listCardsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  cardType: z.enum(['AMEX', 'VISA', 'MASTERCARD', 'DISCOVER']).optional(),
  q: z.string().trim().min(1).optional(),
});

export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type ListCardsQuery = z.infer<typeof listCardsQuerySchema>;
