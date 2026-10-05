import { createZodDto } from 'nestjs-zod';
import {z} from 'zod'
import { createExpenseSchema } from './create-expenses.dto.js';

export class UpdateExpenseDto extends createZodDto(
    createExpenseSchema.partial()
){}