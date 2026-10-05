import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const categorySchema = z.enum([
  'food',
  'transport',
  'leisure',
  'bills',
  'health',
  'other',
]);

export const createExpenseSchema = z.object({
  label: z.string().min(2, 'Le libellé est requis').max(100),
  note: z.string().trim().max(500).optional(),
  amount: z.coerce.number().positive('Le montant doit être positif'),
  category: categorySchema,
  date: z.iso
    .datetime({ offset: true, error: 'Date invalide (format ISO 8601)' })
    .optional(),
});

export class CreateExpenseDto extends createZodDto(createExpenseSchema) {}