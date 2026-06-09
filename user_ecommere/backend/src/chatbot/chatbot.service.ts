import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendChatbotMessageDto } from './dtos/send-chatbot-message.dto';

type ChatRole = 'system' | 'user' | 'assistant';
type ChatbotProvider = 'gemini' | 'openai-compatible';

interface ProviderChatMessage {
  role: ChatRole;
  content: string;
}

interface OpenAiContentPart {
  type?: string;
  text?: string;
}

interface GeminiContentPart {
  text?: string;
  thought?: boolean;
}

interface GeminiContent {
  role?: 'user' | 'model';
  parts?: GeminiContentPart[];
}

interface ProviderErrorResponse {
  error?: {
    message?: string;
  };
}

interface ProviderSuccessResponse {
  model?: string;
  modelVersion?: string;
  usage?: Record<string, number>;
  usageMetadata?: Record<string, number>;
  promptFeedback?: {
    blockReason?: string;
  };
  choices?: Array<{
    message?: {
      content?: string | OpenAiContentPart[];
    };
  }>;
  candidates?: Array<{
    finishReason?: string;
    content?: GeminiContent;
  }>;
}

@Injectable()
export class ChatbotService {
  constructor(private readonly configService: ConfigService) {}

  async sendMessage(dto: SendChatbotMessageDto) {
    const config = this.getProviderConfig();

    const history = dto.history
      .slice(-config.historyLimit)
      .map((message) => ({
        role: message.role,
        content: message.content.trim(),
      }))
      .filter((message) => message.content.length > 0);
    const prompt = dto.prompt.trim();

    if (config.provider === 'gemini') {
      return this.sendGeminiMessage(config, history, prompt);
    }

    return this.sendOpenAiCompatibleMessage(config, history, prompt);
  }

  private getProviderConfig() {
    const rawProvider = this.configService.get<string>('CHATBOT_PROVIDER');
    const providerUrl = this.configService.get<string>('CHATBOT_PROVIDER_URL');
    const apiKey = this.configService.get<string>('CHATBOT_API_KEY');
    const model = this.configService.get<string>('CHATBOT_MODEL');

    const provider: ChatbotProvider =
      rawProvider === 'openai-compatible'
        ? 'openai-compatible'
        : rawProvider === 'gemini'
          ? 'gemini'
          : providerUrl?.includes('generativelanguage.googleapis.com')
            ? 'gemini'
            : 'openai-compatible';

    if (!apiKey || !model) {
      throw new ServiceUnavailableException(
        'Chatbot provider is not configured. Please set CHATBOT_API_KEY and CHATBOT_MODEL.',
      );
    }

    const resolvedProviderUrl =
      provider === 'gemini'
        ? providerUrl ||
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
        : providerUrl;

    if (!resolvedProviderUrl) {
      throw new ServiceUnavailableException(
        'Chatbot provider is not configured. Please set CHATBOT_PROVIDER_URL or use CHATBOT_PROVIDER=gemini.',
      );
    }

    return {
      provider,
      providerUrl: resolvedProviderUrl,
      apiKey,
      model,
      systemPrompt:
        this.configService.get<string>('CHATBOT_SYSTEM_PROMPT') ||
        'Bạn là trợ lý bán hàng cho Thai Spray. Luôn trả lời bằng tiếng Việt có dấu, ngắn gọn, tự nhiên, tập trung tư vấn sản phẩm, đơn hàng và cách sử dụng. Chỉ trả lời nội dung cuối cùng cho khách hàng. Không lặp lại yêu cầu, không giải thích hệ thống, không nêu giả định, không liệt kê suy luận nội bộ, không dùng tiếng Anh nếu không được yêu cầu.',
      timeoutMs: this.configService.get<number>('CHATBOT_TIMEOUT_MS') || 30000,
      temperature: this.configService.get<number>('CHATBOT_TEMPERATURE') || 0.4,
      maxTokens: this.configService.get<number>('CHATBOT_MAX_TOKENS') || 500,
      historyLimit: this.configService.get<number>('CHATBOT_HISTORY_LIMIT') || 10,
    };
  }

  private async sendGeminiMessage(
    config: ReturnType<ChatbotService['getProviderConfig']>,
    history: ProviderChatMessage[],
    prompt: string,
  ) {
    const contents = [...history, { role: 'user' as const, content: prompt }].map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    }));

    const parsedBody = await this.sendProviderRequest(config, {
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.apiKey,
      },
      body: {
        system_instruction: {
          parts: [{ text: config.systemPrompt }],
        },
        contents,
        generationConfig: {
          temperature: config.temperature,
          maxOutputTokens: config.maxTokens,
          responseMimeType: 'text/plain',
          thinkingConfig: {
            thinkingLevel: 'minimal',
          },
        },
      },
    });

    const assistantMessage = this.extractGeminiAssistantMessage(parsedBody);

    if (!assistantMessage) {
      const finishReason = parsedBody?.candidates?.[0]?.finishReason;
      const blockReason = parsedBody?.promptFeedback?.blockReason;

      throw new BadGatewayException(
        blockReason || finishReason || 'Gemini provider returned an empty response.',
      );
    }

    return {
      message: assistantMessage,
      model: parsedBody?.modelVersion || config.model,
      usage: parsedBody?.usageMetadata || null,
    };
  }

  private async sendOpenAiCompatibleMessage(
    config: ReturnType<ChatbotService['getProviderConfig']>,
    history: ProviderChatMessage[],
    prompt: string,
  ) {
    const messages: ProviderChatMessage[] = [
      {
        role: 'system',
        content: config.systemPrompt,
      },
      ...history,
      {
        role: 'user',
        content: prompt,
      },
    ];

    const parsedBody = await this.sendProviderRequest(config, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: {
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      },
    });

    const assistantMessage = this.extractOpenAiAssistantMessage(parsedBody);

    if (!assistantMessage) {
      throw new BadGatewayException('Chatbot provider returned an empty response.');
    }

    return {
      message: assistantMessage,
      model: parsedBody?.model || config.model,
      usage: parsedBody?.usage || null,
    };
  }

  private async sendProviderRequest(
    config: ReturnType<ChatbotService['getProviderConfig']>,
    request: {
      headers: Record<string, string>;
      body: Record<string, unknown>;
    },
  ) {
    let response: globalThis.Response;

    try {
      response = await fetch(config.providerUrl, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify(request.body),
        signal: AbortSignal.timeout(config.timeoutMs),
      });
    } catch (error) {
      throw new BadGatewayException(this.getNetworkErrorMessage(error));
    }

    const rawBody = await response.text();
    const parsedBody = this.safeParseResponse(rawBody);

    if (!response.ok) {
      const providerMessage =
        parsedBody?.error?.message || rawBody || 'Chatbot provider request failed.';

      throw new BadGatewayException(providerMessage);
    }

    return parsedBody;
  }

  private safeParseResponse(
    rawBody: string,
  ): (ProviderSuccessResponse & ProviderErrorResponse) | null {
    if (!rawBody) {
      return null;
    }

    try {
      return JSON.parse(rawBody) as ProviderSuccessResponse & ProviderErrorResponse;
    } catch {
      return null;
    }
  }

  private extractOpenAiAssistantMessage(
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

  private extractGeminiAssistantMessage(
    body: (ProviderSuccessResponse & ProviderErrorResponse) | null,
  ): string | null {
    const parts = body?.candidates?.[0]?.content?.parts;

    if (!Array.isArray(parts)) {
      return null;
    }

    const text = parts
      .filter((part) => !part.thought).map((part) => part.text || '')
      .join('')
      .trim();

    return text || null;
  }

  private getNetworkErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unable to reach the chatbot provider.';
  }
}
