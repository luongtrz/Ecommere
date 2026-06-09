import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendChatbotMessageDto } from './dtos/send-chatbot-message.dto';

type ChatRole = 'system' | 'user' | 'assistant';

interface ProviderChatMessage {
  role: ChatRole;
  content: string;
}

interface ProviderErrorResponse {
  error?: {
    message?: string;
  };
}

interface ProviderSuccessResponse {
  model?: string;
  usage?: Record<string, number>;
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
}

@Injectable()
export class ChatbotService {
  constructor(private readonly configService: ConfigService) {}

  async sendMessage(dto: SendChatbotMessageDto) {
    const config = this.getProviderConfig();

    const history = dto.history.slice(-config.historyLimit).map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }));

    const messages: ProviderChatMessage[] = [
      {
        role: 'system',
        content: config.systemPrompt,
      },
      ...history,
      {
        role: 'user',
        content: dto.prompt.trim(),
      },
    ];

    let response: globalThis.Response;

    try {
      response = await fetch(config.providerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        }),
        signal: AbortSignal.timeout(config.timeoutMs),
      });
    } catch (error) {
      throw new BadGatewayException(this.getNetworkErrorMessage(error));
    }

    const rawBody = await response.text();
    const parsedBody = this.safeParseResponse(rawBody);

    if (!response.ok) {
      const providerMessage =
        parsedBody?.error?.message ||
        rawBody ||
        'Chatbot provider request failed.';

      throw new BadGatewayException(providerMessage);
    }

    const assistantMessage = this.extractAssistantMessage(parsedBody);

    if (!assistantMessage) {
      throw new BadGatewayException('Chatbot provider returned an empty response.');
    }

    return {
      message: assistantMessage,
      model: parsedBody?.model || config.model,
      usage: parsedBody?.usage || null,
    };
  }

  private getProviderConfig() {
    const providerUrl = this.configService.get<string>('CHATBOT_PROVIDER_URL');
    const apiKey = this.configService.get<string>('CHATBOT_API_KEY');
    const model = this.configService.get<string>('CHATBOT_MODEL');

    if (!providerUrl || !apiKey || !model) {
      throw new ServiceUnavailableException(
        'Chatbot provider is not configured. Please set CHATBOT_PROVIDER_URL, CHATBOT_API_KEY, and CHATBOT_MODEL.',
      );
    }

    return {
      providerUrl,
      apiKey,
      model,
      systemPrompt:
        this.configService.get<string>('CHATBOT_SYSTEM_PROMPT') ||
        'Bạn là trợ lý bán hàng cho Thai Spray. Trả lời bằng tiếng Việt, ngắn gọn, hữu ích, ưu tiên tư vấn sản phẩm, đơn hàng và cách sử dụng.',
      timeoutMs: this.configService.get<number>('CHATBOT_TIMEOUT_MS') || 30000,
      temperature: this.configService.get<number>('CHATBOT_TEMPERATURE') || 0.7,
      maxTokens: this.configService.get<number>('CHATBOT_MAX_TOKENS') || 500,
      historyLimit: this.configService.get<number>('CHATBOT_HISTORY_LIMIT') || 10,
    };
  }

  private safeParseResponse(rawBody: string): (ProviderSuccessResponse & ProviderErrorResponse) | null {
    if (!rawBody) {
      return null;
    }

    try {
      return JSON.parse(rawBody) as ProviderSuccessResponse & ProviderErrorResponse;
    } catch {
      return null;
    }
  }

  private extractAssistantMessage(
    body: (ProviderSuccessResponse & ProviderErrorResponse) | null,
  ): string | null {
    const content = body?.choices?.[0]?.message?.content;

    if (typeof content === 'string') {
      return content.trim();
    }

    if (Array.isArray(content)) {
      const text = content
        .map((item) => (item.type === 'text' ? item.text || '' : ''))
        .join('')
        .trim();

      return text || null;
    }

    return null;
  }

  private getNetworkErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unable to reach the chatbot provider.';
  }
}
