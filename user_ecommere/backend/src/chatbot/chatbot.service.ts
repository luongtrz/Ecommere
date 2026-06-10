import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendChatbotMessageDto } from './dtos/send-chatbot-message.dto';
import { ChatbotHistoryService } from './chatbot-history.service';
import { ChatbotRetrievalService } from './chatbot-retrieval.service';

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
  constructor(
    private readonly configService: ConfigService,
    private readonly chatbotHistoryService: ChatbotHistoryService,
    private readonly chatbotRetrievalService: ChatbotRetrievalService,
  ) {}

  async sendMessage(dto: SendChatbotMessageDto) {
    const config = this.getProviderConfig();
    const prompt = dto.prompt.trim();

    if (!prompt) {
      throw new BadRequestException('Prompt must not be empty.');
    }
    const sessionId = dto.sessionId?.trim() || null;

    const storedHistory = sessionId
      ? await this.chatbotHistoryService.getRecentHistory(sessionId, config.historyLimit)
      : [];

    const fallbackHistory = dto.history
      .slice(-config.historyLimit)
      .map((message) => ({
        role: message.role,
        content: message.content.trim(),
      }))
      .filter((message) => message.content.length > 0);

    const history = (storedHistory.length > 0 ? storedHistory : fallbackHistory).map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const retrievalQuery = this.buildRetrievalQuery(prompt, history);

    const retrieval = await this.chatbotRetrievalService.buildCatalogContext(retrievalQuery, {
      productLimit: config.ragProductLimit,
      variantLimit: config.ragVariantLimit,
      candidateLimit: config.ragCandidateLimit,
    });

    const groundedPrompt = this.buildGroundedPrompt(prompt, retrieval.context, retrieval.hasResults);

    const response =
      config.provider === 'gemini'
        ? await this.sendGeminiMessage(config, history, groundedPrompt)
        : await this.sendOpenAiCompatibleMessage(config, history, groundedPrompt);

    if (sessionId) {
      await this.chatbotHistoryService.appendMessages(
        sessionId,
        [
          {
            role: 'user',
            content: prompt,
            createdAt: new Date().toISOString(),
          },
          {
            role: 'assistant',
            content: response.message,
            createdAt: new Date().toISOString(),
          },
        ],
        config.historyLimit * 2,
      );
    }

    return {
      ...response,
      sessionId,
      sources: retrieval.sources,
    };
  }

  async clearHistory(sessionId: string) {
    return this.chatbotHistoryService.clearHistory(sessionId.trim());
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
      ragProductLimit: this.configService.get<number>('CHATBOT_RAG_PRODUCT_LIMIT') || 4,
      ragVariantLimit: this.configService.get<number>('CHATBOT_RAG_VARIANT_LIMIT') || 3,
      ragCandidateLimit: this.configService.get<number>('CHATBOT_RAG_CANDIDATE_LIMIT') || 12,
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

  private buildRetrievalQuery(prompt: string, history: ProviderChatMessage[]) {
    const recentHistory = history
      .slice(-4)
      .map((message) => `${message.role}: ${message.content}`)
      .join('\n')
      .slice(-1200);

    return recentHistory ? `${recentHistory}\nuser: ${prompt}` : prompt;
  }

  private buildGroundedPrompt(prompt: string, catalogContext: string, hasResults: boolean) {
    if (!hasResults) {
      return [
        `Câu hỏi khách hàng: ${prompt}`,
        '',
        'Kết quả truy xuất catalog từ DB: không tìm thấy sản phẩm hoặc biến thể phù hợp.',
        '',
        'Quy tắc trả lời bắt buộc:',
        '- Chỉ được trả lời theo dữ liệu truy xuất từ DB.',
        '- Nếu chưa có dữ liệu phù hợp, hãy nói rõ hiện chưa tìm thấy sản phẩm phù hợp trong catalog hiện tại.',
        '- Hãy mời khách nói rõ thêm về nhu cầu, mùi hương, dung tích, khu vực sử dụng hoặc ngân sách.',
        '- Không bịa tên sản phẩm, mùi hương, dung tích, giá, tồn kho hay chính sách ngoài dữ liệu truy xuất.',
      ].join('\n');
    }

    return [
      `Câu hỏi khách hàng: ${prompt}`,
      '',
      'Dữ liệu catalog truy xuất trực tiếp từ DB:',
      catalogContext,
      '',
      'Quy tắc trả lời bắt buộc:',
      '- Chỉ dùng dữ liệu catalog truy xuất ở trên khi nêu tên sản phẩm, mùi hương, dung tích, giá, SKU và tồn kho.',
      '- Nếu dữ liệu truy xuất chưa đủ để trả lời chắc chắn, hãy nói rõ chưa có đủ dữ liệu thay vì tự suy đoán.',
      '- Không bịa thông tin ngoài dữ liệu truy xuất.',
      '- Khi phù hợp, hãy gợi ý ngắn gọn 1-3 sản phẩm liên quan nhất trước.',
    ].join('\n');
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
      .filter((part) => !part.thought)
      .map((part) => part.text || '')
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
