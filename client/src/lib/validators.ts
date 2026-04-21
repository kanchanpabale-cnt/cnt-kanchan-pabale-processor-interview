import { z } from 'zod';

export const AMOUNT_MAX = 100_000;

export const loginFormSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Strips whitespace then enforces:
 *   - digits only
 *   - exactly 15 digits when leading digit is 3 (Amex)
 *   - exactly 16 digits when leading digit is 4 (Visa), 5 (MC), or 6 (Discover)
 */
export const cardNumberSchema = z
  .string()
  .transform((v) => v.replace(/\s+/g, ''))
  .pipe(
    z
      .string()
      .regex(/^\d+$/, 'Only digits are allowed')
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

export const amountSchema = z
  .string()
  .regex(/^-?\d+(\.\d{1,2})?$/, 'Enter a USD amount (e.g. 123.45 or -50.00)')
  .refine((v) => Number(v) !== 0, { message: 'Amount cannot be zero' })
  .refine((v) => Math.abs(Number(v)) < AMOUNT_MAX, {
    message: `Amount magnitude must be less than $${AMOUNT_MAX.toLocaleString()}`,
  });

export const timestampSchema = z
  .string()
  .min(1, 'Transaction datetime is required')
  .refine((v) => !Number.isNaN(new Date(v).getTime()), 'Invalid datetime');

export const transactionEntrySchema = z.object({
  amount: amountSchema,
  timestamp: timestampSchema,
});

export const cardFormSchema = z.object({
  cardNumber: cardNumberSchema,
  holderName: z.string().trim().max(80).optional().or(z.literal('')),
  transactions: z.array(transactionEntrySchema).min(1, 'Add at least one transaction').max(50),
});

/**
 * Edit form: holder alone OR holder + (amount & timestamp) to append a transaction.
 * Amount and timestamp must travel together.
 */
export const cardUpdateFormSchema = z
  .object({
    holderName: z.string().trim().max(80).optional().or(z.literal('')),
    amount: z.string().optional(),
    timestamp: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    const hasAmount = !!v.amount && v.amount.trim() !== '';
    const hasTimestamp = !!v.timestamp && v.timestamp.trim() !== '';
    if (hasAmount !== hasTimestamp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: hasAmount ? ['timestamp'] : ['amount'],
        message: 'Amount and timestamp must be provided together',
      });
      return;
    }
    if (hasAmount) {
      const amountRes = amountSchema.safeParse(v.amount);
      if (!amountRes.success) {
        for (const issue of amountRes.error.issues) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['amount'], message: issue.message });
        }
      }
      const tsRes = timestampSchema.safeParse(v.timestamp);
      if (!tsRes.success) {
        for (const issue of tsRes.error.issues) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['timestamp'], message: issue.message });
        }
      }
    }
  });

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type CardFormValues = z.infer<typeof cardFormSchema>;
export type CardUpdateFormValues = z.infer<typeof cardUpdateFormSchema>;
