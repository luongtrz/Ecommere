import { ChatOpenAI } from '@langchain/openai';
import { AgentConfig } from './agent.config';

export function createChatModel(config: AgentConfig): ChatOpenAI {
  if (!config.apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  return new ChatOpenAI({
    model: config.model,
    apiKey: config.apiKey,
    temperature: config.temperature,
    maxTokens: config.maxOutputTokens,
    timeout: config.timeoutMs,
    maxRetries: 1,
    streaming: true,
    ...(config.baseURL !== null
      ? { configuration: { baseURL: config.baseURL } }
      : {}),
  });
}
