import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from './../../prisma/prisma.service.js';
import { ListExpenseDto } from "./dto/list-expense.dto.js";
import { CreateExpenseDto } from './dto/create-expenses.dto.js';
import { UpdateExpenseDto } from "./dto/update-expense.dto.js";

@Injectable()
export class ExpenseService {
    constructor(private readonly prisma: PrismaService) {}

    findAll(userId: string, dto: ListExpenseDto) {
        const { category, from, to } = dto
        const toEnd = to ? new Date(to) : undefined;
        toEnd?.setUTCHours(23, 59, 59, 999);
        return this.prisma.expense.findMany({
            where: {
                ...(category && { category }),
                ...((from || toEnd) && {
                    date: {
                        ...(from && { gte: from }),
                        ...(to && { lte: toEnd })
                    },
                }),
                userId,
            },
            orderBy: { date: "desc" }
        })
    }

    async findOne(userId: string, id: string) {
        const expense = await this.prisma.expense.findFirst({
            where: { id, userId },
        });

        if (!expense) {
            throw new NotFoundException(`Expense ${id} not found`);
        }

        return expense;
    }

    create(userId: string, dto: CreateExpenseDto) {
        return this.prisma.expense.create({
            data: {
                ...dto,
                userId
            },
        });
    }

    async update(userId: string, id: string, dto: UpdateExpenseDto) {
        await this.findOne(userId, id);
        return this.prisma.expense.update({
            where: { id },
            data: dto,
        });
    }

    async remove(userId: string, id: string) {
        await this.findOne(userId, id);

        return this.prisma.expense.delete({
            where: { id },
        });
    }

    async summary(userId: string) {
        const groups = await this.prisma.expense.groupBy({
            by: ["category"],
            where: { userId },
            _sum: { amount: true },
            _count: { _all: true },
        });

        const byCategory = groups.map((g) => ({
            category: g.category,
            total: Number(g._sum.amount ?? 0),
            count: g._count._all,
        }));

        const total = byCategory.reduce((acc, c) => acc + c.total, 0);

        return { total, byCategory };
    }
}