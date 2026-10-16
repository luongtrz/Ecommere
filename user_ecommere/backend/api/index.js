require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { ConfigService } = require('@nestjs/config');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { ExpressAdapter } = require('@nestjs/platform-express');
const express = require('express');

let cachedServer;

async function bootstrapServer() {
  if (!cachedServer) {
    const server = express();

    server.get('/', (_req, res) => {
      res.json({
        status: 'ok',
        service: 'thai-spray-user-backend',
        timestamp: new Date().toISOString(),
      });
    });

    server.get('/health', (_req, res) => {
      res.json({ status: 'ok' });
    });

    const { AppModule } = require('../dist/src/app.module');
    const { HttpExceptionFilter } = require('../dist/src/common/filters/http-exception.filter');
    const { TransformInterceptor } = require('../dist/src/common/interceptors/transform.interceptor');
    const { LoggingInterceptor } = require('../dist/src/common/interceptors/logging.interceptor');

    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
    const configService = app.get(ConfigService);

    app.getHttpAdapter().getInstance().set('trust proxy', 1);
    app.setGlobalPrefix('api');
    app.use(helmet({ crossOriginResourcePolicy: false }));
    app.use(cookieParser());

    const corsOrigins = (configService.get('CORS_ORIGIN') || '')
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

module.exports = async function handler(req, res) {
  try {
    const server = await bootstrapServer();
    return server(req, res);
  } catch (error) {
    console.error('Vercel Bootstrap Error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      error: error.message,
      stack: error.stack,
      name: error.name,
    }));
  }
};
