import { ChatOpenAI } from '@langchain/openai';
import { createChatModel } from './llm.factory';
import { AgentConfig } from './agent.config';

jest.mock('@langchain/openai', () => {
  const MockChatOpenAI = jest.fn().mockImplementation(function (
    this: any,
    options: any,
  ) {
    this.options = options;
  });
  return {
    ChatOpenAI: MockChatOpenAI,
  };
});

describe('createChatModel', () => {
  const baseConfig: AgentConfig = {
    apiKey: 'sk-test-valid-key',
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

  describe('apiKey validation (branch: !config.apiKey)', () => {
    it('should throw an Error when apiKey is null', () => {
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

    it('should throw an Error when apiKey is an empty string', () => {
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

    it('should throw an Error when apiKey is undefined', () => {
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

  describe('baseURL configuration (branch: config.baseURL !== null)', () => {
    it('should include configuration.baseURL when baseURL is not null (true branch)', () => {
      const customBaseURL = 'https://custom-openai-proxy.internal.com/v1';
      const config: AgentConfig = {
        ...baseConfig,
        apiKey: 'sk-custom-api-key',
        baseURL: customBaseURL,
        model: 'gpt-4o',
        temperature: 0.5,
        maxOutputTokens: 1200,
        timeoutMs: 45000,
      };

      const model = createChatModel(config);

      expect(ChatOpenAI).toHaveBeenCalledTimes(1);
      expect(ChatOpenAI).toHaveBeenCalledWith({
        model: 'gpt-4o',
        apiKey: 'sk-custom-api-key',
        temperature: 0.5,
        maxTokens: 1200,
        timeout: 45000,
        maxRetries: 1,
        streaming: true,
        configuration: {
          baseURL: customBaseURL,
        },
      });
      expect(model).toBeDefined();
      expect((model as any).options).toEqual({
        model: 'gpt-4o',
        apiKey: 'sk-custom-api-key',
        temperature: 0.5,
        maxTokens: 1200,
        timeout: 45000,
        maxRetries: 1,
        streaming: true,
        configuration: {
          baseURL: customBaseURL,
        },
      });
    });

    it('should not include configuration when baseURL is null (false branch)', () => {
      const config: AgentConfig = {
        ...baseConfig,
        apiKey: 'sk-custom-api-key-2',
        baseURL: null,
        model: 'gpt-4o-mini',
        temperature: 0.3,
        maxOutputTokens: 600,
        timeoutMs: 30000,
      };

      const model = createChatModel(config);

      expect(ChatOpenAI).toHaveBeenCalledTimes(1);
      const passedOptions = (ChatOpenAI as unknown as jest.Mock).mock
        .calls[0][0];

      expect(passedOptions).toEqual({
        model: 'gpt-4o-mini',
        apiKey: 'sk-custom-api-key-2',
        temperature: 0.3,
        maxTokens: 600,
        timeout: 30000,
        maxRetries: 1,
        streaming: true,
      });
      expect('configuration' in passedOptions).toBe(false);
      expect(passedOptions.configuration).toBeUndefined();
      expect(model).toBeDefined();
    });
  });
});
