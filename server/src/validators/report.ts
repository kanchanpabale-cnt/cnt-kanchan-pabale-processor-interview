import { z } from 'zod';

export const rejectedListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type RejectedListQuery = z.infer<typeof rejectedListQuerySchema>;
