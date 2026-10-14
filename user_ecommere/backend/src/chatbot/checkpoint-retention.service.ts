import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AGENT_CHECKPOINTER, AGENT_CONFIG } from './agent/agent.providers';
import type { AgentConfig } from './agent/agent.config';
import {
  getCheckpointerPool,
  deleteExpiredCheckpoints,
} from './agent/checkpointer.provider';

export const DEFAULT_RETENTION_DAYS = 30;

export function parseRetentionDays(
  val: string | undefined,
  logger?: { warn: (msg: string) => void },
): number {
  if (val === undefined || val.trim() === '') {
    return DEFAULT_RETENTION_DAYS;
  }
  const trimmed = val.trim();
  if (trimmed === '0') {
    return 0;
  }
  const num = Number(trimmed);
  if (Number.isInteger(num) && num > 0) {
    return num;
  }
  logger?.warn(
    `Invalid CHECKPOINT_RETENTION_DAYS value "${val}". Falling back to default ${DEFAULT_RETENTION_DAYS} days.`,
  );
  return DEFAULT_RETENTION_DAYS;
}

@Injectable()
export class CheckpointRetentionService {
  private readonly logger = new Logger(CheckpointRetentionService.name);

  constructor(
    @Optional()
    @Inject(AGENT_CHECKPOINTER)
    private readonly checkpointer?: any,
    @Optional()
    @Inject(AGENT_CONFIG)
    private readonly config?: AgentConfig,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'checkpoint-retention',
  })
  async handleCron(): Promise<number> {
    try {
      return await this.cleanupExpiredCheckpoints();
    } catch (error) {
      this.logger.error(
        `Failed to clean up expired checkpoints: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      return 0;
    }
  }

  async cleanupExpiredCheckpoints(retentionDaysOverride?: number): Promise<number> {
    try {
      const retentionDays =
        retentionDaysOverride !== undefined
          ? retentionDaysOverride
          : parseRetentionDays(process.env.CHECKPOINT_RETENTION_DAYS, this.logger);

      if (retentionDays === 0) {
        this.logger.log(
          'Checkpoint retention job is disabled (CHECKPOINT_RETENTION_DAYS=0)',
        );
        return 0;
      }

      const pool = this.resolvePool();
      if (!pool || typeof pool.query !== 'function') {
        this.logger.warn(
          'Checkpoint retention job: no database pool available to clean up checkpoints',
        );
        return 0;
      }

      const cutoffDate = new Date(
        Date.now() - retentionDays * 24 * 60 * 60 * 1000,
      );
      const schema = this.resolveSchema();

      const deletedRows = await deleteExpiredCheckpoints(
        pool,
        cutoffDate,
        schema,
      );

      this.logger.log(
        `Deleted ${deletedRows} checkpoint rows (retention: ${retentionDays} days, cutoff: ${cutoffDate.toISOString()})`,
      );
      return deletedRows;
    } catch (error) {
      this.logger.error(
        `Failed to clean up expired checkpoints: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      return 0;
    }
  }

  private resolvePool(): any {
    return (
      getCheckpointerPool(this.checkpointer) ??
      (typeof this.checkpointer?.query === 'function' ? this.checkpointer : undefined)
    );
  }

  private resolveSchema(): string {
    const rawSchema =
      (typeof this.checkpointer?.schema === 'string' &&
      this.checkpointer.schema.trim().length > 0
        ? this.checkpointer.schema.trim()
        : undefined) ??
      (typeof this.config?.checkpointSchema === 'string' &&
      this.config.checkpointSchema.trim().length > 0
        ? this.config.checkpointSchema.trim()
        : undefined) ??
      (process.env.AGENT_CHECKPOINT_SCHEMA &&
      process.env.AGENT_CHECKPOINT_SCHEMA.trim().length > 0
        ? process.env.AGENT_CHECKPOINT_SCHEMA.trim()
        : 'agent');

    return /^[a-z_][a-z0-9_]{0,62}$/i.test(rawSchema) ? rawSchema : 'agent';
  }
}

export { CheckpointRetentionService as CheckpointRetentionJob };
