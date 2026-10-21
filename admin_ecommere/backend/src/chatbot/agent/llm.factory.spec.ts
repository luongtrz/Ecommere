import { ChatOpenAI } from '@langchain/openai';
import { createChatModel } from './llm.factory';
import { AgentConfig } from './agent.config';

jest.mock('@langchain/openai');

describe('createChatModel', () => {
  const baseConfig: AgentConfig = {
    apiKey: 'sk-test-openai-key',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4.1-mini',
    temperature: 0.2,
    maxOutputTokens: 800,
    timeoutMs: 90000,
    maxSteps: 24,
    maxToolCallsPerTurn: 6,
    historyMaxMessages: 30,
    checkpointSchema: 'agent',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('apiKey validation', () => {
    it('throws Error when apiKey is null', () => {
      const config: AgentConfig = {
        ...baseConfig,
        apiKey: null,
      };

      expect(() => createChatModel(config)).toThrow(Error);
      expect(() => createChatModel(config)).toThrow(
        'OPENAI_API_KEY is not configured',
      );
      expect(ChatOpenAI).not.toHaveBeenCalled();
    });

    it('throws Error when apiKey is an empty string', () => {
      const config: AgentConfig = {
        ...baseConfig,
        apiKey: '',
      };

      expect(() => createChatModel(config)).toThrow(Error);
      expect(() => createChatModel(config)).toThrow(
        'OPENAI_API_KEY is not configured',
      );
      expect(ChatOpenAI).not.toHaveBeenCalled();
    });

    it('throws Error when apiKey is undefined', () => {
      const config = {
        ...baseConfig,
        apiKey: undefined as unknown as string,
      } as AgentConfig;

      expect(() => createChatModel(config)).toThrow(Error);
      expect(() => createChatModel(config)).toThrow(
        'OPENAI_API_KEY is not configured',
      );
      expect(ChatOpenAI).not.toHaveBeenCalled();
    });
  });

  describe('successful instantiation', () => {
    it('creates ChatOpenAI with baseURL configuration when baseURL is provided', () => {
      const mockInstance = {} as ChatOpenAI;
      (ChatOpenAI as unknown as jest.Mock).mockImplementation(
        () => mockInstance,
      );

      const config: AgentConfig = {
        ...baseConfig,
        baseURL: 'https://custom.openai.proxy/v1',
      };

      const result = createChatModel(config);

      expect(ChatOpenAI).toHaveBeenCalledTimes(1);
      expect(ChatOpenAI).toHaveBeenCalledWith({
        model: 'gpt-4.1-mini',
        apiKey: 'sk-test-openai-key',
        temperature: 0.2,
        maxTokens: 800,
        timeout: 90000,
        maxRetries: 1,
        streaming: true,
        configuration: {
          baseURL: 'https://custom.openai.proxy/v1',
        },
      });
      expect(result).toBe(mockInstance);
    });

    it('creates ChatOpenAI without configuration when baseURL is null', () => {
      const mockInstance = {} as ChatOpenAI;
      (ChatOpenAI as unknown as jest.Mock).mockImplementation(
        () => mockInstance,
      );

      const config: AgentConfig = {
        ...baseConfig,
        baseURL: null,
      };

      const result = createChatModel(config);

      expect(ChatOpenAI).toHaveBeenCalledTimes(1);
      expect(ChatOpenAI).toHaveBeenCalledWith({
        model: 'gpt-4.1-mini',
        apiKey: 'sk-test-openai-key',
        temperature: 0.2,
        maxTokens: 800,
        timeout: 90000,
        maxRetries: 1,
        streaming: true,
      });
      expect(result).toBe(mockInstance);
    });

    it('passes custom parameters correctly to ChatOpenAI constructor', () => {
      const mockInstance = {} as ChatOpenAI;
      (ChatOpenAI as unknown as jest.Mock).mockImplementation(
        () => mockInstance,
      );

      const customConfig: AgentConfig = {
        apiKey: 'sk-custom-12345',
        baseURL: 'https://ai.custom-domain.com/v1',
        model: 'gpt-4o',
        temperature: 0.7,
        maxOutputTokens: 1500,
        timeoutMs: 45000,
        maxSteps: 30,
        maxToolCallsPerTurn: 8,
        historyMaxMessages: 50,
        checkpointSchema: 'agent_custom',
      };

      const result = createChatModel(customConfig);

      expect(ChatOpenAI).toHaveBeenCalledTimes(1);
      expect(ChatOpenAI).toHaveBeenCalledWith({
        model: 'gpt-4o',
        apiKey: 'sk-custom-12345',
        temperature: 0.7,
        maxTokens: 1500,
        timeout: 45000,
        maxRetries: 1,
        streaming: true,
        configuration: {
          baseURL: 'https://ai.custom-domain.com/v1',
        },
      });
      expect(result).toBe(mockInstance);
    });
  });
});
