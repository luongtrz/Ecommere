import { readAgentConfig } from './agent.config';

describe('readAgentConfig', () => {
  it('returns default configuration with an empty env', () => {
    const config = readAgentConfig({});

    expect(config).toEqual({
      apiKey: null,
      baseURL: null,
      model: 'gpt-4.1-mini',
      temperature: 0.2,
      maxOutputTokens: 800,
      timeoutMs: 90000,
      maxSteps: 24,
      maxToolCallsPerTurn: 6,
      historyMaxMessages: 30,
      checkpointSchema: 'agent',
    });
  });

  it('applies overrides when valid values are provided', () => {
    const config = readAgentConfig({
      OPENAI_API_KEY: 'sk-test-key-12345',
      OPENAI_BASE_URL: 'https://custom-api.openai.com/v1',
      AGENT_MODEL: 'gpt-4o',
      AGENT_TEMPERATURE: '0.7',
      AGENT_MAX_OUTPUT_TOKENS: '1200',
      AGENT_TIMEOUT_MS: '60000',
      AGENT_MAX_STEPS: '30',
      AGENT_MAX_TOOL_CALLS_PER_TURN: '8',
      AGENT_HISTORY_MAX_MESSAGES: '50',
      AGENT_CHECKPOINT_SCHEMA: 'agent_custom_v1',
    });

    expect(config).toEqual({
      apiKey: 'sk-test-key-12345',
      baseURL: 'https://custom-api.openai.com/v1',
      model: 'gpt-4o',
      temperature: 0.7,
      maxOutputTokens: 1200,
      timeoutMs: 60000,
      maxSteps: 30,
      maxToolCallsPerTurn: 8,
      historyMaxMessages: 50,
      checkpointSchema: 'agent_custom_v1',
    });
  });

  it('converts blank OPENAI_API_KEY and OPENAI_BASE_URL to null', () => {
    const configEmpty = readAgentConfig({
      OPENAI_API_KEY: '',
      OPENAI_BASE_URL: '',
    });
    expect(configEmpty.apiKey).toBeNull();
    expect(configEmpty.baseURL).toBeNull();

    const configWhitespace = readAgentConfig({
      OPENAI_API_KEY: '   ',
      OPENAI_BASE_URL: '   ',
    });
    expect(configWhitespace.apiKey).toBeNull();
    expect(configWhitespace.baseURL).toBeNull();
  });

  it('does not throw when OPENAI_API_KEY is missing', () => {
    expect(() => readAgentConfig({})).not.toThrow();
    expect(readAgentConfig({}).apiKey).toBeNull();
  });

  describe('AGENT_TEMPERATURE validation', () => {
    it('throws naming AGENT_TEMPERATURE when non-numeric', () => {
      expect(() => readAgentConfig({ AGENT_TEMPERATURE: 'abc' })).toThrow(/AGENT_TEMPERATURE/);
    });

    it('throws naming AGENT_TEMPERATURE when below 0', () => {
      expect(() => readAgentConfig({ AGENT_TEMPERATURE: '-0.1' })).toThrow(/AGENT_TEMPERATURE/);
    });

    it('throws naming AGENT_TEMPERATURE when above 1', () => {
      expect(() => readAgentConfig({ AGENT_TEMPERATURE: '1.05' })).toThrow(/AGENT_TEMPERATURE/);
    });

    it('accepts boundary values 0 and 1', () => {
      expect(readAgentConfig({ AGENT_TEMPERATURE: '0' }).temperature).toBe(0);
      expect(readAgentConfig({ AGENT_TEMPERATURE: '1' }).temperature).toBe(1);
    });
  });

  describe('AGENT_MAX_OUTPUT_TOKENS validation', () => {
    it('throws naming AGENT_MAX_OUTPUT_TOKENS when non-numeric or float', () => {
      expect(() => readAgentConfig({ AGENT_MAX_OUTPUT_TOKENS: 'abc' })).toThrow(
        /AGENT_MAX_OUTPUT_TOKENS/,
      );
      expect(() => readAgentConfig({ AGENT_MAX_OUTPUT_TOKENS: '800.5' })).toThrow(
        /AGENT_MAX_OUTPUT_TOKENS/,
      );
    });

    it('throws naming AGENT_MAX_OUTPUT_TOKENS when below 64 or above 4000', () => {
      expect(() => readAgentConfig({ AGENT_MAX_OUTPUT_TOKENS: '63' })).toThrow(
        /AGENT_MAX_OUTPUT_TOKENS/,
      );
      expect(() => readAgentConfig({ AGENT_MAX_OUTPUT_TOKENS: '4001' })).toThrow(
        /AGENT_MAX_OUTPUT_TOKENS/,
      );
    });

    it('accepts boundary values 64 and 4000', () => {
      expect(readAgentConfig({ AGENT_MAX_OUTPUT_TOKENS: '64' }).maxOutputTokens).toBe(64);
      expect(readAgentConfig({ AGENT_MAX_OUTPUT_TOKENS: '4000' }).maxOutputTokens).toBe(4000);
    });
  });

  describe('AGENT_TIMEOUT_MS validation', () => {
    it('throws naming AGENT_TIMEOUT_MS when non-numeric or float', () => {
      expect(() => readAgentConfig({ AGENT_TIMEOUT_MS: 'invalid' })).toThrow(/AGENT_TIMEOUT_MS/);
      expect(() => readAgentConfig({ AGENT_TIMEOUT_MS: '5000.5' })).toThrow(/AGENT_TIMEOUT_MS/);
    });

    it('throws naming AGENT_TIMEOUT_MS when below 5000 or above 300000', () => {
      expect(() => readAgentConfig({ AGENT_TIMEOUT_MS: '4999' })).toThrow(/AGENT_TIMEOUT_MS/);
      expect(() => readAgentConfig({ AGENT_TIMEOUT_MS: '300001' })).toThrow(/AGENT_TIMEOUT_MS/);
    });

    it('accepts boundary values 5000 and 300000', () => {
      expect(readAgentConfig({ AGENT_TIMEOUT_MS: '5000' }).timeoutMs).toBe(5000);
      expect(readAgentConfig({ AGENT_TIMEOUT_MS: '300000' }).timeoutMs).toBe(300000);
    });
  });

  describe('AGENT_MAX_STEPS validation', () => {
    it('throws naming AGENT_MAX_STEPS when non-numeric or float', () => {
      expect(() => readAgentConfig({ AGENT_MAX_STEPS: 'step' })).toThrow(/AGENT_MAX_STEPS/);
      expect(() => readAgentConfig({ AGENT_MAX_STEPS: '24.5' })).toThrow(/AGENT_MAX_STEPS/);
    });

    it('throws naming AGENT_MAX_STEPS when below 4 or above 60', () => {
      expect(() => readAgentConfig({ AGENT_MAX_STEPS: '3' })).toThrow(/AGENT_MAX_STEPS/);
      expect(() => readAgentConfig({ AGENT_MAX_STEPS: '61' })).toThrow(/AGENT_MAX_STEPS/);
    });

    it('accepts boundary values 4 and 60', () => {
      expect(readAgentConfig({ AGENT_MAX_STEPS: '4' }).maxSteps).toBe(4);
      expect(readAgentConfig({ AGENT_MAX_STEPS: '60' }).maxSteps).toBe(60);
    });
  });

  describe('AGENT_MAX_TOOL_CALLS_PER_TURN validation', () => {
    it('throws naming AGENT_MAX_TOOL_CALLS_PER_TURN when non-numeric or float', () => {
      expect(() => readAgentConfig({ AGENT_MAX_TOOL_CALLS_PER_TURN: 'xyz' })).toThrow(
        /AGENT_MAX_TOOL_CALLS_PER_TURN/,
      );
      expect(() => readAgentConfig({ AGENT_MAX_TOOL_CALLS_PER_TURN: '6.2' })).toThrow(
        /AGENT_MAX_TOOL_CALLS_PER_TURN/,
      );
    });

    it('throws naming AGENT_MAX_TOOL_CALLS_PER_TURN when below 1 or above 12', () => {
      expect(() => readAgentConfig({ AGENT_MAX_TOOL_CALLS_PER_TURN: '0' })).toThrow(
        /AGENT_MAX_TOOL_CALLS_PER_TURN/,
      );
      expect(() => readAgentConfig({ AGENT_MAX_TOOL_CALLS_PER_TURN: '13' })).toThrow(
        /AGENT_MAX_TOOL_CALLS_PER_TURN/,
      );
    });

    it('accepts boundary values 1 and 12', () => {
      expect(readAgentConfig({ AGENT_MAX_TOOL_CALLS_PER_TURN: '1' }).maxToolCallsPerTurn).toBe(1);
      expect(readAgentConfig({ AGENT_MAX_TOOL_CALLS_PER_TURN: '12' }).maxToolCallsPerTurn).toBe(12);
    });
  });

  describe('AGENT_HISTORY_MAX_MESSAGES validation', () => {
    it('throws naming AGENT_HISTORY_MAX_MESSAGES when non-numeric or float', () => {
      expect(() => readAgentConfig({ AGENT_HISTORY_MAX_MESSAGES: 'foo' })).toThrow(
        /AGENT_HISTORY_MAX_MESSAGES/,
      );
      expect(() => readAgentConfig({ AGENT_HISTORY_MAX_MESSAGES: '30.1' })).toThrow(
        /AGENT_HISTORY_MAX_MESSAGES/,
      );
    });

    it('throws naming AGENT_HISTORY_MAX_MESSAGES when below 2 or above 200', () => {
      expect(() => readAgentConfig({ AGENT_HISTORY_MAX_MESSAGES: '1' })).toThrow(
        /AGENT_HISTORY_MAX_MESSAGES/,
      );
      expect(() => readAgentConfig({ AGENT_HISTORY_MAX_MESSAGES: '201' })).toThrow(
        /AGENT_HISTORY_MAX_MESSAGES/,
      );
    });

    it('accepts boundary values 2 and 200', () => {
      expect(readAgentConfig({ AGENT_HISTORY_MAX_MESSAGES: '2' }).historyMaxMessages).toBe(2);
      expect(readAgentConfig({ AGENT_HISTORY_MAX_MESSAGES: '200' }).historyMaxMessages).toBe(200);
    });
  });

  describe('AGENT_CHECKPOINT_SCHEMA validation', () => {
    it('throws naming AGENT_CHECKPOINT_SCHEMA when schema starts with digit', () => {
      expect(() => readAgentConfig({ AGENT_CHECKPOINT_SCHEMA: '1agent' })).toThrow(
        /AGENT_CHECKPOINT_SCHEMA/,
      );
    });

    it('throws naming AGENT_CHECKPOINT_SCHEMA when schema contains uppercase characters', () => {
      expect(() => readAgentConfig({ AGENT_CHECKPOINT_SCHEMA: 'Agent' })).toThrow(
        /AGENT_CHECKPOINT_SCHEMA/,
      );
    });

    it('throws naming AGENT_CHECKPOINT_SCHEMA when schema contains invalid characters', () => {
      expect(() => readAgentConfig({ AGENT_CHECKPOINT_SCHEMA: 'agent-schema' })).toThrow(
        /AGENT_CHECKPOINT_SCHEMA/,
      );
      expect(() => readAgentConfig({ AGENT_CHECKPOINT_SCHEMA: 'agent.schema' })).toThrow(
        /AGENT_CHECKPOINT_SCHEMA/,
      );
    });

    it('throws naming AGENT_CHECKPOINT_SCHEMA when schema exceeds 63 characters', () => {
      const tooLongSchema = 'a'.repeat(64);
      expect(() => readAgentConfig({ AGENT_CHECKPOINT_SCHEMA: tooLongSchema })).toThrow(
        /AGENT_CHECKPOINT_SCHEMA/,
      );
    });

    it('accepts valid schema identifiers up to 63 characters', () => {
      expect(readAgentConfig({ AGENT_CHECKPOINT_SCHEMA: 'agent' }).checkpointSchema).toBe('agent');
      expect(readAgentConfig({ AGENT_CHECKPOINT_SCHEMA: '_agent_123' }).checkpointSchema).toBe(
        '_agent_123',
      );
      const maxLengthSchema = 'a'.repeat(63);
      expect(readAgentConfig({ AGENT_CHECKPOINT_SCHEMA: maxLengthSchema }).checkpointSchema).toBe(
        maxLengthSchema,
      );
    });
  });
});
