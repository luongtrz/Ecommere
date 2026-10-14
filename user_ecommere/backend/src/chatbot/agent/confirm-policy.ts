import type { ToolRisk, AgentRole, AgentApp } from '../tools/tool.types';

export const CONFIRM_POLICY_VERSION = 1;

export function requiresConfirmation(input: {
  app: AgentApp;
  role: AgentRole;
  risk: ToolRisk;
}): boolean {
  if (input.risk === 'READ') {
    return false;
  }

  const knownRisks: ReadonlyArray<ToolRisk> = ['READ', 'WRITE', 'SENSITIVE', 'DESTRUCTIVE'];
  if (!knownRisks.includes(input.risk)) {
    return true;
  }

  if (input.role === 'GUEST') {
    return true;
  }

  if (input.app === 'USER') {
    if (input.risk === 'WRITE') {
      return false;
    }
    if (input.risk === 'SENSITIVE' || input.risk === 'DESTRUCTIVE') {
      return true;
    }
  }

  if (input.app === 'ADMIN') {
    if (input.risk === 'WRITE' || input.risk === 'SENSITIVE' || input.risk === 'DESTRUCTIVE') {
      return true;
    }
  }

  return true;
}
