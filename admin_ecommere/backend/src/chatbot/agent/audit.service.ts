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
  toolCallId?: string;
}

const SENSITIVE_KEY_REGEX = /pass|token|secret|authorization|cookie|cvv|card/i;
const PHONE_KEY_REGEX = /phone/i;

const EMAIL_REGEX = /\b([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g;
const PHONE_REGEX =
  /(?<!\w|\+)(?:\(?\+84\)?[\s.-]?)?(?:\d[\s.-]?){8,10}\d(?!\w)/g;
const SENSITIVE_VALUE_REGEX =
  /(?<=(?:^|[^\w]))("?)(\b[\w-]*(?:pass|token|secret|authorization|cookie|cvv|card)[\w-]*\b)\1((?:\s*[:=]\s*|\s+is\s+|\s+))(?:(")(?:Bearer\s+)?[^"\r\n]*(")|(')(?:Bearer\s+)?[^'\r\n]*(')|(Bearer\s+[^\s"',;]+|[^\s"',;:!?(){}\[\]<>&|]*[^\s"',;:.!?(){}\[\]<>&|]))/gi;

export function redactSummary(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // 1. Mask sensitive key-value pairs (for example password, token, secret, authorization, cookie, cvv, card)
  let result = text.replace(
    SENSITIVE_VALUE_REGEX,
    (
      _match,
      quoteKey,
      key,
      sep,
      dQuote1,
      dQuote2,
      sQuote1,
      sQuote2,
      unquotedVal,
    ) => {
      if (unquotedVal === '[REDACTED]' || unquotedVal === '***') {
        return _match;
      }
      if (dQuote1 && dQuote2) {
        return `${quoteKey}${key}${quoteKey}${sep}"[REDACTED]"`;
      }
      if (sQuote1 && sQuote2) {
        return `${quoteKey}${key}${quoteKey}${sep}'[REDACTED]'`;
      }
      return `${quoteKey}${key}${quoteKey}${sep}[REDACTED]`;
    },
  );

  // 2. Mask email addresses: keep the first character of the local part and the full domain
  result = result.replace(EMAIL_REGEX, (_, local: string, domain: string) => {
    return `${local[0]}***@${domain}`;
  });

  // 3. Mask phone numbers of 9 to 11 digits: keep only the last 3 digits
  result = result.replace(PHONE_REGEX, (match: string) => {
    const digits = match.replace(/\D/g, '');
    return '***' + digits.slice(-3);
  });

  return result;
}

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
      const redacted =
        entry.args !== undefined ? redactArgs(entry.args) : undefined;
      let args: Prisma.InputJsonValue | typeof Prisma.JsonNull;

      if (entry.toolCallId) {
        if (
          typeof redacted === 'object' &&
          redacted !== null &&
          !Array.isArray(redacted)
        ) {
          args = {
            ...(redacted as Prisma.InputJsonObject),
            toolCallId: entry.toolCallId,
          };
        } else {
          args = {
            toolCallId: entry.toolCallId,
          };
        }
      } else {
        args =
          redacted === undefined || redacted === null
            ? Prisma.JsonNull
            : (redacted as Prisma.InputJsonValue);
      }

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
          resultSummary:
            entry.resultSummary !== undefined && entry.resultSummary !== null
              ? redactSummary(entry.resultSummary).slice(0, 500)
              : null,
          error:
            entry.error !== undefined && entry.error !== null
              ? entry.error.slice(0, 500)
              : null,
          durationMs: entry.durationMs ?? null,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to record tool audit log: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async findCompleted(
    threadId: string,
    toolCallId: string,
  ): Promise<string | null> {
    try {
      const log = await this.prisma.agentToolLog.findFirst({
        where: {
          threadId,
          status: 'OK',
          args: {
            path: ['toolCallId'],
            equals: toolCallId,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return log?.resultSummary ?? null;
    } catch (error) {
      this.logger.warn(
        `Failed to find completed tool audit log: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }
}
