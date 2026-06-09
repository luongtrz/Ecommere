import { plainToInstance } from 'class-transformer';
import { IsString, IsNumber, IsEnum, IsOptional, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  PORT: number = 4000;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  JWT_ACCESS_SECRET: string;

  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsString()
  TOKEN_EXPIRES_IN: string = '15m';

  @IsString()
  REFRESH_EXPIRES_IN: string = '7d';

  @IsString()
  CORS_ORIGIN: string = 'http://localhost:5173';

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
  CHATBOT_PROVIDER_URL?: string;

  @IsOptional()
  @IsString()
  CHATBOT_API_KEY?: string;

  @IsOptional()
  @IsString()
  CHATBOT_MODEL?: string;

  @IsOptional()
  @IsString()
  CHATBOT_SYSTEM_PROMPT?: string;

  @IsNumber()
  CHATBOT_TIMEOUT_MS: number = 30000;

  @IsNumber()
  CHATBOT_TEMPERATURE: number = 0.7;

  @IsNumber()
  CHATBOT_MAX_TOKENS: number = 500;

  @IsNumber()
  CHATBOT_HISTORY_LIMIT: number = 10;
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
