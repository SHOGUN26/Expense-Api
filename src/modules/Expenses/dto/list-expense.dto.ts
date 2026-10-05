import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { categorySchema } from './create-expenses.dto.js';

const dateFilter = z.iso
  .date('Format attendu : AAAA-MM-JJ')
  .transform((s) => new Date(`${s}T00:00:00.000Z`));

export const listExpenseSchema = z
  .object({
    category: categorySchema.optional(),
    from: dateFilter.optional(),
    to: dateFilter.optional(),
  })
  .refine((v) => !v.from || !v.to || v.from <= v.to, {
    message: "'from' doit être antérieure ou égale à 'to'",
    path: ['from'],
  });

export class ListExpenseDto extends createZodDto(listExpenseSchema) {}