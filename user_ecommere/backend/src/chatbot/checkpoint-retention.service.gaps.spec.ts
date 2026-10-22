import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import {
  CheckpointRetentionService,
  parseRetentionDays,
  DEFAULT_RETENTION_DAYS,
} from './checkpoint-retention.service';
import { AGENT_CHECKPOINTER, AGENT_CONFIG } from './agent/agent.providers';

describe('CheckpointRetentionService - Gap Coverage', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.CHECKPOINT_RETENTION_DAYS;
    delete process.env.AGENT_CHECKPOINT_SCHEMA;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('parseRetentionDays edge cases', () => {
    it('returns DEFAULT_RETENTION_DAYS when logger argument is omitted for invalid value', () => {
      // logger is undefined; tests logger?.warn optional chaining
      expect(parseRetentionDays('invalid_number')).toBe(DEFAULT_RETENTION_DAYS);
      expect(parseRetentionDays('-5')).toBe(DEFAULT_RETENTION_DAYS);
      expect(parseRetentionDays('3.1415')).toBe(DEFAULT_RETENTION_DAYS);
    });
  });

  describe('NestJS TestingModule DI instantiation', () => {
    it('instantiates CheckpointRetentionService via DI with optional providers', async () => {
      const mockPool = { query: jest.fn().mockResolvedValue({ rowCount: 0 }) };
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CheckpointRetentionService,
          {
            provide: AGENT_CHECKPOINTER,
            useValue: { pool: mockPool, schema: 'agent' },
          },
          {
            provide: AGENT_CONFIG,
            useValue: { checkpointSchema: 'agent' },
          },
        ],
      }).compile();

      const service = module.get<CheckpointRetentionService>(
        CheckpointRetentionService,
      );
      expect(service).toBeDefined();

      const deleted = await service.cleanupExpiredCheckpoints();
      expect(deleted).toBe(0);
    });
  });

  describe('handleCron catch blocks', () => {
    it('catches and logs Error thrown from cleanupExpiredCheckpoints with error.stack', async () => {
      const errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();
      const service = new CheckpointRetentionService();

      const testError = new Error('Database pool crash');
      jest
        .spyOn(service, 'cleanupExpiredCheckpoints')
        .mockRejectedValueOnce(testError);

      const result = await service.handleCron();

      expect(result).toBe(0);
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to clean up expired checkpoints: Database pool crash',
        testError.stack,
      );

      errorSpy.mockRestore();
    });

    it('catches and logs non-Error thrown from cleanupExpiredCheckpoints with String(error) and undefined stack', async () => {
      const errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();
      const service = new CheckpointRetentionService();

      jest
        .spyOn(service, 'cleanupExpiredCheckpoints')
        .mockRejectedValueOnce('Custom string error rejection');

      const result = await service.handleCron();

      expect(result).toBe(0);
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to clean up expired checkpoints: Custom string error rejection',
        undefined,
      );

      errorSpy.mockRestore();
    });
  });

  describe('cleanupExpiredCheckpoints gaps', () => {
    it('deletes checkpoints using retentionDaysOverride positive number', async () => {
      const query = jest.fn().mockResolvedValue({ rowCount: 7 });
      const mockPool = { query };

      const service = new CheckpointRetentionService({ pool: mockPool });
      const beforeTime = Date.now();
      const deleted = await service.cleanupExpiredCheckpoints(14);
      const afterTime = Date.now();

      expect(deleted).toBe(7);
      expect(query).toHaveBeenCalledTimes(1);

      const expectedCutoffApprox = beforeTime - 14 * 24 * 60 * 60 * 1000;
      const actualCutoff = query.mock.calls[0][1][0] as Date;
      expect(actualCutoff.getTime()).toBeGreaterThanOrEqual(
        expectedCutoffApprox - 1000,
      );
      expect(actualCutoff.getTime()).toBeLessThanOrEqual(
        afterTime - 14 * 24 * 60 * 60 * 1000 + 1000,
      );
    });

    it('returns 0 and logs warning when pool is resolved but pool.query is not a function', async () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

      // pool exists, but pool.query is not a function
      const service = new CheckpointRetentionService({
        pool: { query: 'not-a-function' },
      });

      const deleted = await service.cleanupExpiredCheckpoints();

      expect(deleted).toBe(0);
      expect(warnSpy).toHaveBeenCalledWith(
        'Checkpoint retention job: no database pool available to clean up checkpoints',
      );

      warnSpy.mockRestore();
    });

    it('resolves pool when checkpointer itself has a query method directly (no .pool property)', async () => {
      const query = jest.fn().mockResolvedValue({ rowCount: 3 });
      const service = new CheckpointRetentionService({ query });

      const deleted = await service.cleanupExpiredCheckpoints();

      expect(deleted).toBe(3);
      expect(query).toHaveBeenCalledTimes(1);
    });

    it('returns 0 and logs warning when checkpointer is an object with no pool or query', async () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

      const service = new CheckpointRetentionService({
        unrelatedProp: 'test',
      });

      const deleted = await service.cleanupExpiredCheckpoints();

      expect(deleted).toBe(0);
      expect(warnSpy).toHaveBeenCalledWith(
        'Checkpoint retention job: no database pool available to clean up checkpoints',
      );

      warnSpy.mockRestore();
    });

    it('catches and logs non-Error thrown in cleanupExpiredCheckpoints', async () => {
      const errorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation();
      const query = jest.fn().mockRejectedValue('Fatal network partition');
      const mockPool = { query };

      const service = new CheckpointRetentionService({ pool: mockPool });

      const result = await service.cleanupExpiredCheckpoints();

      expect(result).toBe(0);
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to clean up expired checkpoints: Fatal network partition',
        undefined,
      );

      errorSpy.mockRestore();
    });
  });

  describe('resolveSchema branches', () => {
    it('falls back to default agent when checkpointer.schema is empty or whitespace only', async () => {
      const query = jest.fn().mockResolvedValue({ rowCount: 1 });
      const mockPool = { query };

      const serviceWhitespace = new CheckpointRetentionService({
        pool: mockPool,
        schema: '   ',
      });
      await serviceWhitespace.cleanupExpiredCheckpoints();

      const [sqlWhitespace] = query.mock.calls[0];
      expect(sqlWhitespace).toContain('DELETE FROM "agent".checkpoints');

      query.mockClear();

      const serviceEmpty = new CheckpointRetentionService({
        pool: mockPool,
        schema: '',
      });
      await serviceEmpty.cleanupExpiredCheckpoints();

      const [sqlEmpty] = query.mock.calls[0];
      expect(sqlEmpty).toContain('DELETE FROM "agent".checkpoints');
    });

    it('falls back to default agent when checkpointer.schema is not a string', async () => {
      const query = jest.fn().mockResolvedValue({ rowCount: 1 });
      const mockPool = { query };

      const service = new CheckpointRetentionService({
        pool: mockPool,
        schema: 12345 as any,
      });
      await service.cleanupExpiredCheckpoints();

      const [sql] = query.mock.calls[0];
      expect(sql).toContain('DELETE FROM "agent".checkpoints');
    });

    it('falls back to default agent when config.checkpointSchema is empty or whitespace only', async () => {
      const query = jest.fn().mockResolvedValue({ rowCount: 1 });
      const mockPool = { query };

      const serviceWhitespace = new CheckpointRetentionService(
        { pool: mockPool },
        { checkpointSchema: '   ' } as any,
      );
      await serviceWhitespace.cleanupExpiredCheckpoints();

      const [sqlWhitespace] = query.mock.calls[0];
      expect(sqlWhitespace).toContain('DELETE FROM "agent".checkpoints');

      query.mockClear();

      const serviceEmpty = new CheckpointRetentionService({ pool: mockPool }, {
        checkpointSchema: '',
      } as any);
      await serviceEmpty.cleanupExpiredCheckpoints();

      const [sqlEmpty] = query.mock.calls[0];
      expect(sqlEmpty).toContain('DELETE FROM "agent".checkpoints');
    });

    it('falls back to default agent when config.checkpointSchema is not a string', async () => {
      const query = jest.fn().mockResolvedValue({ rowCount: 1 });
      const mockPool = { query };

      const service = new CheckpointRetentionService({ pool: mockPool }, {
        checkpointSchema: true,
      } as any);
      await service.cleanupExpiredCheckpoints();

      const [sql] = query.mock.calls[0];
      expect(sql).toContain('DELETE FROM "agent".checkpoints');
    });

    it('uses valid schema from process.env.AGENT_CHECKPOINT_SCHEMA when checkpointer and config schemas are omitted', async () => {
      process.env.AGENT_CHECKPOINT_SCHEMA = 'env_custom_schema';

      const query = jest.fn().mockResolvedValue({ rowCount: 1 });
      const mockPool = { query };

      const service = new CheckpointRetentionService({ pool: mockPool });
      await service.cleanupExpiredCheckpoints();

      expect(query).toHaveBeenCalledTimes(1);
      const [sql] = query.mock.calls[0];
      expect(sql).toContain('DELETE FROM "env_custom_schema".checkpoints');
    });

    it('falls back to default agent when process.env.AGENT_CHECKPOINT_SCHEMA is empty string or whitespace only', async () => {
      process.env.AGENT_CHECKPOINT_SCHEMA = '   ';

      const query = jest.fn().mockResolvedValue({ rowCount: 1 });
      const mockPool = { query };

      const service = new CheckpointRetentionService({ pool: mockPool });
      await service.cleanupExpiredCheckpoints();

      const [sql] = query.mock.calls[0];
      expect(sql).toContain('DELETE FROM "agent".checkpoints');

      query.mockClear();
      process.env.AGENT_CHECKPOINT_SCHEMA = '';

      await service.cleanupExpiredCheckpoints();
      const [sqlEmpty] = query.mock.calls[0];
      expect(sqlEmpty).toContain('DELETE FROM "agent".checkpoints');
    });

    it.each([
      ['starts with a digit', '123bad_schema'],
      ['contains dashes', 'bad-schema-name'],
      ['contains spaces', 'bad schema name'],
      ['contains SQL injection attempt', 'agent"; DROP TABLE test; --'],
      ['exceeds 63 characters', 'a'.repeat(64)],
    ])(
      'falls back to "agent" when rawSchema fails regex validation (%s)',
      async (_, invalidSchema) => {
        const query = jest.fn().mockResolvedValue({ rowCount: 1 });
        const mockPool = { query };

        const service = new CheckpointRetentionService({
          pool: mockPool,
          schema: invalidSchema,
        });

        await service.cleanupExpiredCheckpoints();

        expect(query).toHaveBeenCalledTimes(1);
        const [sql] = query.mock.calls[0];
        expect(sql).toContain('DELETE FROM "agent".checkpoints');
      },
    );

    it('accepts schema at maximum allowed length of 63 characters', async () => {
      const valid63Schema = 'a'.repeat(63);
      const query = jest.fn().mockResolvedValue({ rowCount: 1 });
      const mockPool = { query };

      const service = new CheckpointRetentionService({
        pool: mockPool,
        schema: valid63Schema,
      });

      await service.cleanupExpiredCheckpoints();

      expect(query).toHaveBeenCalledTimes(1);
      const [sql] = query.mock.calls[0];
      expect(sql).toContain(`DELETE FROM "${valid63Schema}".checkpoints`);
    });
  });
});
