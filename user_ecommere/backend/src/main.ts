import 'module-alias/register';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
// import cookieParser from 'cookie-parser';
import * as cookieParser from 'cookie-parser';
import { join } from 'path';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Caddy is the only proxy in front of this backend (see DEPLOYMENT.md), so trust
  // exactly one hop. Without this, req.ip is Caddy's address for every client and
  // the per-IP rate limits are shared by all of them.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Global prefix
  app.setGlobalPrefix('api');

  // Security
  app.use(helmet({ crossOriginResourcePolicy: false }));

  // Cookie parser (must be before routes)
  app.use(cookieParser());

  // Serve static files (uploads)
  const express = require('express');
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // CORS
  const corsOrigins = (configService.get<string>('CORS_ORIGIN') || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      if (corsOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-CSRF-Token', // Add CSRF header
      'X-Chat-Session', // Guest chatbot thread key sent by the storefront
    ],
    exposedHeaders: ['Content-Disposition', 'X-CSRF-Token'],
  });

  // Global pipes
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

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Swagger is served outside production only (the Dockerfile sets NODE_ENV=production)
  const swaggerEnabled = configService.get('NODE_ENV') !== 'production';
  if (swaggerEnabled) {
    setupSwagger(app);
  }

  const port = configService.get('PORT') || 4000;
  await app.listen(port);

  console.log(`🚀 Server running on http://localhost:${port}`);
  if (swaggerEnabled) {
    console.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
  }
}

bootstrap();
