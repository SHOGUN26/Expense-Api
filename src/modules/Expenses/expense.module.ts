import { Module } from '@nestjs/common';
import { ExpenseController } from './expense.controller.js';
import { ExpenseService } from './expense.service.js';
import { PrismaModule } from '../../prisma/prisma.module.js';


@Module({
    imports: [PrismaModule],
    controllers:[ExpenseController],
    providers:[ExpenseService]
})

export class ExpenseModule {}
