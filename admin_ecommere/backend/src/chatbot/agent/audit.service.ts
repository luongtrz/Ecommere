import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';

export type AuditStatus = 'OK' | 'ERROR' | 'DECLINED';

export interface ToolAuditEntry {
  threadId: string;
  userId: string | null;
  role: 'CUSTOMER' | 'ADMIN' | null;
  app: 'USER' | 'ADMIN';
  toolName: string;
  risk: string;
  status: AuditStatus;
  args?: unknown;
  resultSummary?: string;
  error?: string;
  durationMs?: number;
}

const SENSITIVE_KEY_REGEX = /pass|token|secret|authorization|cookie|cvv|card/i;
const PHONE_KEY_REGEX = /phone/i;

export function redactArgs(value: unknown, depth = 0): unknown {
  if (depth > 5) {
    return '[TRUNCATED]';
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    if (value.length > 500) {
      return value.slice(0, 500) + '…';
    }
    return value;
  }

  if (typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactArgs(item, depth + 1));
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    if (SENSITIVE_KEY_REGEX.test(key)) {
      result[key] = '[REDACTED]';
    } else if (PHONE_KEY_REGEX.test(key) && typeof val === 'string') {
      result[key] = '***' + val.slice(-3);
    } else {
      result[key] = redactArgs(val, depth + 1);
    }
  }
  return result;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: ToolAuditEntry): Promise<void> {
    try {
      const redacted = entry.args !== undefined ? redactArgs(entry.args) : undefined;
      const args = (redacted === undefined || redacted === null)
        ? Prisma.JsonNull
        : (redacted as Prisma.InputJsonValue);

      await this.prisma.agentToolLog.create({
        data: {
          threadId: entry.threadId,
          userId: entry.userId ?? null,
          role: entry.role ?? null,
          app: entry.app,
          toolName: entry.toolName,
          risk: entry.risk,
          status: entry.status,
          args,
          resultSummary: entry.resultSummary !== undefined && entry.resultSummary !== null
            ? entry.resultSummary.slice(0, 500)
            : null,
          error: entry.error !== undefined && entry.error !== null
            ? entry.error.slice(0, 500)
            : null,
          durationMs: entry.durationMs ?? null,
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to record tool audit log: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
