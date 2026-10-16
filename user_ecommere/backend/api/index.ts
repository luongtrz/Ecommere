import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express, Request, Response } from 'express';
import { AppModule } from '../dist/src/app.module';
import { HttpExceptionFilter } from '../dist/src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../dist/src/common/interceptors/transform.interceptor';
import { LoggingInterceptor } from '../dist/src/common/interceptors/logging.interceptor';

let cachedServer: Express;

async function bootstrapServer(): Promise<Express> {
  if (!cachedServer) {
    const server = express();

    server.get('/', (_req: Request, res: Response) => {
      res.json({
        status: 'ok',
        service: 'thai-spray-user-backend',
        timestamp: new Date().toISOString(),
      });
    });

    server.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok' });
    });

    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
    const configService = app.get(ConfigService);

    app.getHttpAdapter().getInstance().set('trust proxy', 1);
    app.setGlobalPrefix('api');
    app.use(helmet({ crossOriginResourcePolicy: false }));
    app.use(cookieParser());

    const corsOrigins = (configService.get<string>('CORS_ORIGIN') || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    app.enableCors({
      origin: (origin, callback) => {
        if (!origin || corsOrigins.length === 0 || corsOrigins.includes(origin) || corsOrigins.includes('*')) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-CSRF-Token',
      ],
      exposedHeaders: ['Content-Disposition', 'X-CSRF-Token'],
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(
      new LoggingInterceptor(),
      new TransformInterceptor(),
    );

    await app.init();
    cachedServer = server;
  }
  return cachedServer;
}

export default async function handler(req: Request, res: Response) {
  const server = await bootstrapServer();
  return server(req, res);
}
