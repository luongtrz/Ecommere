import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 4000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.TOKEN_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.REFRESH_EXPIRES_IN || '7d',
  },
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL, 10) || 60,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },
  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE, 10) || 20,
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE, 10) || 100,
  },
  chatbot: {
    providerUrl: process.env.CHATBOT_PROVIDER_URL,
    apiKey: process.env.CHATBOT_API_KEY,
    model: process.env.CHATBOT_MODEL,
    systemPrompt:
      process.env.CHATBOT_SYSTEM_PROMPT ||
      'Ban la tro ly ban hang cho Thai Spray. Tra loi bang tieng Viet, ngan gon, huu ich, uu tien tu van san pham, don hang va cach su dung.',
    timeoutMs: parseInt(process.env.CHATBOT_TIMEOUT_MS, 10) || 30000,
    temperature: parseFloat(process.env.CHATBOT_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.CHATBOT_MAX_TOKENS, 10) || 500,
    historyLimit: parseInt(process.env.CHATBOT_HISTORY_LIMIT, 10) || 10,
  },
}));
