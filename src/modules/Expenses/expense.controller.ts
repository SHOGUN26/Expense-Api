import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ListExpenseDto } from "./dto/list-expense.dto.js";
import { ExpenseService } from "./expense.service.js";
import { Session,type UserSession } from "@thallesp/nestjs-better-auth";
import { CreateExpenseDto } from "./dto/create-expenses.dto.js";
import { UpdateExpenseDto } from './dto/update-expense.dto.js';





@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Get()
  @HttpCode(200)
  findAll(
    @Query() query: ListExpenseDto,
    @Session() session: UserSession,
  ) {
    return this.expenseService.findAll(session.user.id, query);
  }

  @Get('summary')
  @HttpCode(200)
  summary(@Session() session: UserSession) {
    return this.expenseService.summary(session.user.id);
  }

  @Get(':id')
  @HttpCode(200)
  findOne(
    @Param('id') id: string,
    @Session() session: UserSession,
  ) {
    return this.expenseService.findOne(session.user.id, id);
  }

  @Post()
  @HttpCode(201)
  create(
    @Body() dto: CreateExpenseDto,
    @Session() session: UserSession,
  ) {
    return this.expenseService.create(session.user.id, dto);
  }

  @Patch(':id')
  @HttpCode(200)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
    @Session() session: UserSession,
  ) {
    return this.expenseService.update(session.user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @Param('id') id: string,
    @Session() session: UserSession,
  ) {
    return this.expenseService.remove(session.user.id, id);
  }
}