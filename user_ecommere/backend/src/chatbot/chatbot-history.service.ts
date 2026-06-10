import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type RedisClientType } from 'redis';

export type ChatHistoryRole = 'user' | 'assistant';

export interface ChatHistoryMessage {
  role: ChatHistoryRole;
  content: string;
  createdAt: string;
}

@Injectable()
export class ChatbotHistoryService {
  private readonly logger = new Logger(ChatbotHistoryService.name);
  private client: RedisClientType | null = null;
  private connectPromise: Promise<RedisClientType | null> | null = null;

  constructor(private readonly configService: ConfigService) {}

  async getRecentHistory(sessionId: string, limit: number) {
    const redis = await this.getClient();

    if (!redis) {
      return [];
    }

    try {
      const rawMessages = await redis.lRange(this.buildKey(sessionId), -limit, -1);

      return rawMessages
        .map((rawMessage) => this.safeParseMessage(rawMessage))
        .filter((message): message is ChatHistoryMessage => message !== null);
    } catch (error) {
      this.logger.warn(`Unable to read chatbot history from Redis: ${this.getErrorMessage(error)}`);
      return [];
    }
  }

  async appendMessages(sessionId: string, messages: ChatHistoryMessage[], limit: number) {
    if (messages.length === 0) {
      return;
    }

    const redis = await this.getClient();

    if (!redis) {
      return;
    }

    const key = this.buildKey(sessionId);
    const ttlSeconds = this.configService.get<number>('CHATBOT_REDIS_TTL_SECONDS') || 604800;

    try {
      const multi = redis.multi();
      multi.rPush(key, messages.map((message) => JSON.stringify(message)));
      multi.lTrim(key, -limit, -1);
      multi.expire(key, ttlSeconds);
      await multi.exec();
    } catch (error) {
      this.logger.warn(`Unable to persist chatbot history to Redis: ${this.getErrorMessage(error)}`);
    }
  }

  async clearHistory(sessionId: string) {
    const redis = await this.getClient();

    if (!redis) {
      return { cleared: false, sessionId };
    }

    try {
      await redis.del(this.buildKey(sessionId));
      return { cleared: true, sessionId };
    } catch (error) {
      this.logger.warn(`Unable to clear chatbot history in Redis: ${this.getErrorMessage(error)}`);
      return { cleared: false, sessionId };
    }
  }

  private async getClient() {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (!redisUrl) {
      return null;
    }

    if (this.client?.isOpen) {
      return this.client;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.client = createClient({
      url: redisUrl,
    });

    this.client.on('error', (error) => {
      this.logger.warn(`Redis client error: ${this.getErrorMessage(error)}`);
    });

    this.connectPromise = this.client
      .connect()
      .then(() => {
        this.logger.log('Chatbot Redis history connected');
        return this.client as RedisClientType;
      })
      .catch((error) => {
        this.logger.warn(`Unable to connect chatbot Redis history: ${this.getErrorMessage(error)}`);
        this.client = null;
        return null;
      })
      .finally(() => {
        this.connectPromise = null;
      }) as Promise<RedisClientType | null>;

    return this.connectPromise;
  }

  private buildKey(sessionId: string) {
    return `chatbot:history:${sessionId}`;
  }

  private safeParseMessage(rawMessage: string) {
    try {
      const parsed = JSON.parse(rawMessage) as ChatHistoryMessage;

      if (
        parsed &&
        (parsed.role === 'user' || parsed.role === 'assistant') &&
        typeof parsed.content === 'string' &&
        typeof parsed.createdAt === 'string'
      ) {
        return parsed;
      }

      return null;
    } catch {
      return null;
    }
  }

  private getErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown Redis error';
  }
}
