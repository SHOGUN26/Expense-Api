import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { envSchema } from './config/env.schema.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ExpenseModule } from './modules/Expenses/expense.module.js';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			validate: (config) => envSchema.parse(config),
		}),
		LoggerModule.forRoot({
		pinoHttp: {
			level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
			transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
		},
		}),
		ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
		TerminusModule,
		PrismaModule,
		AuthModule,
		ExpenseModule
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
