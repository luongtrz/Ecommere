import {
  CheckpointRetentionService,
  parseRetentionDays,
  DEFAULT_RETENTION_DAYS,
} from './checkpoint-retention.service';

describe('parseRetentionDays', () => {
  it('returns default 30 when undefined or empty without warning', () => {
    const logger = { warn: jest.fn() };
    expect(parseRetentionDays(undefined, logger)).toBe(DEFAULT_RETENTION_DAYS);
    expect(parseRetentionDays('', logger)).toBe(DEFAULT_RETENTION_DAYS);
    expect(parseRetentionDays('   ', logger)).toBe(DEFAULT_RETENTION_DAYS);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('returns 0 when 0 is passed (disabling the job) without warning', () => {
    const logger = { warn: jest.fn() };
    expect(parseRetentionDays('0', logger)).toBe(0);
    expect(parseRetentionDays(' 0 ', logger)).toBe(0);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('falls back to default 30 and logs warning for invalid or negative numbers', () => {
    const logger = { warn: jest.fn() };
    expect(parseRetentionDays('-1', logger)).toBe(DEFAULT_RETENTION_DAYS);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Invalid CHECKPOINT_RETENTION_DAYS value "-1"'),
    );

    logger.warn.mockClear();
    expect(parseRetentionDays('invalid', logger)).toBe(DEFAULT_RETENTION_DAYS);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'Invalid CHECKPOINT_RETENTION_DAYS value "invalid"',
      ),
    );

    logger.warn.mockClear();
    expect(parseRetentionDays('3.14', logger)).toBe(DEFAULT_RETENTION_DAYS);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Invalid CHECKPOINT_RETENTION_DAYS value "3.14"'),
    );
  });

  it('parses positive integers without warning', () => {
    const logger = { warn: jest.fn() };
    expect(parseRetentionDays('15', logger)).toBe(15);
    expect(parseRetentionDays('30', logger)).toBe(30);
    expect(parseRetentionDays('60', logger)).toBe(60);
    expect(logger.warn).not.toHaveBeenCalled();
  });
});

describe('CheckpointRetentionService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.CHECKPOINT_RETENTION_DAYS;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('deletes checkpoints for threads older than retention period (default 30 days)', async () => {
    const query = jest.fn().mockResolvedValue({ rowCount: 4 });
    const mockPool = { query };

    const service = new CheckpointRetentionService({
      pool: mockPool,
      schema: 'agent',
    });
    const beforeTime = Date.now();
    const deleted = await service.cleanupExpiredCheckpoints();
    const afterTime = Date.now();

    expect(deleted).toBe(4);
    expect(query).toHaveBeenCalledTimes(1);

    // Verify cutoff date was approximately 30 days ago
    const expectedCutoffApprox = beforeTime - 30 * 24 * 60 * 60 * 1000;
    const actualCutoff = query.mock.calls[0][1][0] as Date;
    expect(actualCutoff).toBeInstanceOf(Date);
    expect(actualCutoff.getTime()).toBeGreaterThanOrEqual(
      expectedCutoffApprox - 1000,
    );
    expect(actualCutoff.getTime()).toBeLessThanOrEqual(
      afterTime - 30 * 24 * 60 * 60 * 1000 + 1000,
    );
  });

  it('CHECKPOINT_RETENTION_DAYS=0 disables the job and performs no deletes', async () => {
    process.env.CHECKPOINT_RETENTION_DAYS = '0';
    const query = jest.fn();
    const mockPool = { query };

    const service = new CheckpointRetentionService({ pool: mockPool });
    const deleted = await service.cleanupExpiredCheckpoints();

    expect(deleted).toBe(0);
    expect(query).not.toHaveBeenCalled();
  });

  it('allows retentionDays override of 0 to disable job', async () => {
    const query = jest.fn();
    const mockPool = { query };

    const service = new CheckpointRetentionService({ pool: mockPool });
    const deleted = await service.cleanupExpiredCheckpoints(0);

    expect(deleted).toBe(0);
    expect(query).not.toHaveBeenCalled();
  });

  it('invalid CHECKPOINT_RETENTION_DAYS falls back to default 30 days with a warning', async () => {
    process.env.CHECKPOINT_RETENTION_DAYS = 'not-a-number';
    const query = jest.fn().mockResolvedValue({ rowCount: 2 });
    const mockPool = { query };

    const service = new CheckpointRetentionService({ pool: mockPool });
    const beforeTime = Date.now();
    const deleted = await service.cleanupExpiredCheckpoints();

    expect(deleted).toBe(2);
    expect(query).toHaveBeenCalledTimes(1);

    // Default 30 days cutoff used
    const actualCutoff = query.mock.calls[0][1][0] as Date;
    const expectedCutoffApprox = beforeTime - 30 * 24 * 60 * 60 * 1000;
    expect(actualCutoff.getTime()).toBeGreaterThanOrEqual(
      expectedCutoffApprox - 1000,
    );
  });

  it('respects custom valid retention days from environment', async () => {
    process.env.CHECKPOINT_RETENTION_DAYS = '10';
    const query = jest.fn().mockResolvedValue({ rowCount: 2 });
    const mockPool = { query };

    const service = new CheckpointRetentionService({ pool: mockPool });
    const beforeTime = Date.now();
    const deleted = await service.cleanupExpiredCheckpoints();

    expect(deleted).toBe(2);
    const actualCutoff = query.mock.calls[0][1][0] as Date;
    const expectedCutoffApprox = beforeTime - 10 * 24 * 60 * 60 * 1000;
    expect(actualCutoff.getTime()).toBeGreaterThanOrEqual(
      expectedCutoffApprox - 1000,
    );
  });

  it('is idempotent: running twice removes nothing extra on the second run', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({ rowCount: 3 })
      .mockResolvedValueOnce({ rowCount: 0 });
    const mockPool = { query };

    const service = new CheckpointRetentionService({ pool: mockPool });

    const firstRun = await service.cleanupExpiredCheckpoints();
    expect(firstRun).toBe(3);

    const secondRun = await service.cleanupExpiredCheckpoints();
    expect(secondRun).toBe(0);

    expect(query).toHaveBeenCalledTimes(2);
  });

  it('catches database errors so one failed run does not stop the schedule or throw', async () => {
    const query = jest
      .fn()
      .mockRejectedValue(new Error('PostgreSQL connection dropped'));
    const mockPool = { query };

    const service = new CheckpointRetentionService({ pool: mockPool });

    await expect(service.cleanupExpiredCheckpoints()).resolves.toBe(0);
    await expect(service.handleCron()).resolves.toBe(0);
  });

  it('handles missing database pool gracefully without throwing', async () => {
    const service = new CheckpointRetentionService(null);
    await expect(service.cleanupExpiredCheckpoints()).resolves.toBe(0);
  });

  it('uses schema from config if checkpointer does not define schema', async () => {
    const query = jest.fn().mockResolvedValue({ rowCount: 1 });
    const mockPool = { query };

    const service = new CheckpointRetentionService({ pool: mockPool }, {
      checkpointSchema: 'custom_agent',
    } as any);

    await service.cleanupExpiredCheckpoints();

    expect(query).toHaveBeenCalledTimes(1);
    const [sql] = query.mock.calls[0];
    expect(sql).toContain('DELETE FROM "custom_agent".checkpoints');
  });

  it('handleCron calls cleanupExpiredCheckpoints', async () => {
    const query = jest.fn().mockResolvedValue({ rowCount: 5 });
    const mockPool = { query };

    const service = new CheckpointRetentionService({ pool: mockPool });
    const result = await service.handleCron();

    expect(result).toBe(5);
  });
});
