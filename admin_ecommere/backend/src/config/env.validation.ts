import { plainToInstance } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  PORT: number = 4001;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  ADMIN_JWT_ACCESS_SECRET: string;

  @IsString()
  ADMIN_JWT_REFRESH_SECRET: string;

  @IsString()
  TOKEN_EXPIRES_IN: string = '15m';

  @IsString()
  REFRESH_EXPIRES_IN: string = '7d';

  @IsString()
  CORS_ORIGIN: string = 'http://localhost:5174';

  @IsString()
  UPLOAD_DIR: string = './uploads';

  @IsNumber()
  RATE_LIMIT_TTL: number = 60;

  @IsNumber()
  RATE_LIMIT_MAX: number = 100;

  @IsNumber()
  DEFAULT_PAGE_SIZE: number = 20;

  @IsNumber()
  MAX_PAGE_SIZE: number = 100;

  @IsOptional()
  @IsString()
  SMTP_HOST?: string;

  @IsOptional()
  @IsNumber()
  SMTP_PORT?: number;

  @IsOptional()
  @IsString()
  SMTP_SECURE?: string;

  @IsOptional()
  @IsString()
  SMTP_USER?: string;

  @IsOptional()
  @IsString()
  SMTP_USERNAME?: string;

  @IsOptional()
  @IsString()
  SMTP_PASS?: string;

  @IsOptional()
  @IsString()
  SMTP_PASSWORD?: string;

  @IsOptional()
  @IsString()
  SMTP_FROM?: string;

  @IsOptional()
  @IsString()
  FRONTEND_URL?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
