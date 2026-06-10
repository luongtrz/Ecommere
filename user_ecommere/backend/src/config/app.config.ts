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
  redis: {
    url: process.env.REDIS_URL,
  },
  chatbot: {
    provider: process.env.CHATBOT_PROVIDER || 'gemini',
    providerUrl: process.env.CHATBOT_PROVIDER_URL,
    apiKey: process.env.CHATBOT_API_KEY,
    model: process.env.CHATBOT_MODEL,
    systemPrompt:
      process.env.CHATBOT_SYSTEM_PROMPT ||
      'Bạn là trợ lý bán hàng cho Thai Spray. Luôn trả lời bằng tiếng Việt có dấu, ngắn gọn, tự nhiên, tập trung tư vấn sản phẩm, đơn hàng và cách sử dụng. Chỉ trả lời nội dung cuối cùng cho khách hàng. Không lặp lại yêu cầu, không giải thích hệ thống, không nêu giả định, không liệt kê suy luận nội bộ, không dùng tiếng Anh nếu không được yêu cầu.',
    timeoutMs: parseInt(process.env.CHATBOT_TIMEOUT_MS, 10) || 30000,
    temperature: parseFloat(process.env.CHATBOT_TEMPERATURE || '0.4'),
    maxTokens: parseInt(process.env.CHATBOT_MAX_TOKENS, 10) || 500,
    historyLimit: parseInt(process.env.CHATBOT_HISTORY_LIMIT, 10) || 10,
    redisTtlSeconds: parseInt(process.env.CHATBOT_REDIS_TTL_SECONDS || '604800', 10) || 604800,
    ragProductLimit: parseInt(process.env.CHATBOT_RAG_PRODUCT_LIMIT || '4', 10) || 4,
    ragVariantLimit: parseInt(process.env.CHATBOT_RAG_VARIANT_LIMIT || '3', 10) || 3,
    ragCandidateLimit: parseInt(process.env.CHATBOT_RAG_CANDIDATE_LIMIT || '12', 10) || 12,
  },
}));
