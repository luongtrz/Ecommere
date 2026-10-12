export interface AgentConfig {
  apiKey: string | null;
  baseURL: string | null;
  model: string;
  temperature: number;
  maxOutputTokens: number;
  timeoutMs: number;
  maxSteps: number;
  maxToolCallsPerTurn: number;
  historyMaxMessages: number;
  checkpointSchema: string;
}

const CHECKPOINT_SCHEMA_REGEX = /^[a-z_][a-z0-9_]{0,62}$/;

function parseInteger(
  key: string,
  val: string | undefined,
  defaultValue: number,
  min: number,
  max: number,
): number {
  if (val === undefined || val.trim() === '') {
    return defaultValue;
  }
  const trimmed = val.trim();
  const num = Number(trimmed);
  if (!Number.isInteger(num) || num < min || num > max) {
    throw new Error(`${key} must be an integer between ${min} and ${max}`);
  }
  return num;
}

function parseNumber(
  key: string,
  val: string | undefined,
  defaultValue: number,
  min: number,
  max: number,
): number {
  if (val === undefined || val.trim() === '') {
    return defaultValue;
  }
  const trimmed = val.trim();
  const num = Number(trimmed);
  if (Number.isNaN(num) || num < min || num > max) {
    throw new Error(`${key} must be a number between ${min} and ${max}`);
  }
  return num;
}

export function readAgentConfig(env: Record<string, string | undefined>): AgentConfig {
  const apiKey =
    env.OPENAI_API_KEY !== undefined && env.OPENAI_API_KEY.trim() !== ''
      ? env.OPENAI_API_KEY.trim()
      : null;

  const baseURL =
    env.OPENAI_BASE_URL !== undefined && env.OPENAI_BASE_URL.trim() !== ''
      ? env.OPENAI_BASE_URL.trim()
      : null;

  const model =
    env.AGENT_MODEL !== undefined && env.AGENT_MODEL.trim() !== ''
      ? env.AGENT_MODEL.trim()
      : 'gpt-4.1-mini';

  const temperature = parseNumber('AGENT_TEMPERATURE', env.AGENT_TEMPERATURE, 0.2, 0, 1);
  const maxOutputTokens = parseInteger(
    'AGENT_MAX_OUTPUT_TOKENS',
    env.AGENT_MAX_OUTPUT_TOKENS,
    800,
    64,
    4000,
  );
  const timeoutMs = parseInteger(
    'AGENT_TIMEOUT_MS',
    env.AGENT_TIMEOUT_MS,
    90000,
    5000,
    300000,
  );
  const maxSteps = parseInteger('AGENT_MAX_STEPS', env.AGENT_MAX_STEPS, 24, 4, 60);
  const maxToolCallsPerTurn = parseInteger(
    'AGENT_MAX_TOOL_CALLS_PER_TURN',
    env.AGENT_MAX_TOOL_CALLS_PER_TURN,
    6,
    1,
    12,
  );
  const historyMaxMessages = parseInteger(
    'AGENT_HISTORY_MAX_MESSAGES',
    env.AGENT_HISTORY_MAX_MESSAGES,
    30,
    2,
    200,
  );

  let checkpointSchema = 'agent';
  if (env.AGENT_CHECKPOINT_SCHEMA !== undefined && env.AGENT_CHECKPOINT_SCHEMA.trim() !== '') {
    const trimmedSchema = env.AGENT_CHECKPOINT_SCHEMA.trim();
    if (!CHECKPOINT_SCHEMA_REGEX.test(trimmedSchema)) {
      throw new Error(
        `AGENT_CHECKPOINT_SCHEMA must match /^[a-z_][a-z0-9_]{0,62}$/ (received: "${trimmedSchema}")`,
      );
    }
    checkpointSchema = trimmedSchema;
  }

  return {
    apiKey,
    baseURL,
    model,
    temperature,
    maxOutputTokens,
    timeoutMs,
    maxSteps,
    maxToolCallsPerTurn,
    historyMaxMessages,
    checkpointSchema,
  };
}
