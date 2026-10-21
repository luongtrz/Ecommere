import {
  toCheckpointConnectionString,
  getCheckpointerPool,
  deleteThreadCheckpoints,
} from './checkpointer.provider';

describe('toCheckpointConnectionString', () => {
  it('removes schema=... query parameter from the connection URL', () => {
    const input =
      'postgresql://user:pass@localhost:5432/thaispray_shop?schema=public';
    const result = toCheckpointConnectionString(input);
    expect(result).toBe('postgresql://user:pass@localhost:5432/thaispray_shop');
  });

  it('removes schema parameter with custom schema name', () => {
    const input =
      'postgresql://user:pass@localhost:5432/thaispray_shop?schema=custom_schema';
    const result = toCheckpointConnectionString(input);
    expect(result).toBe('postgresql://user:pass@localhost:5432/thaispray_shop');
  });

  it('removes other Prisma-only parameters such as connection_limit and pool_timeout', () => {
    const input =
      'postgresql://user:pass@localhost:5432/thaispray_shop?schema=public&connection_limit=5&pool_timeout=10&socket_timeout=15&pgbouncer=true';
    const result = toCheckpointConnectionString(input);
    expect(result).toBe('postgresql://user:pass@localhost:5432/thaispray_shop');
  });

  it('keeps other non-Prisma query parameters intact', () => {
    const input =
      'postgresql://user:pass@localhost:5432/thaispray_shop?schema=public&sslmode=require&application_name=thaispray_backend';
    const result = toCheckpointConnectionString(input);
    expect(result).toBe(
      'postgresql://user:pass@localhost:5432/thaispray_shop?sslmode=require&application_name=thaispray_backend',
    );
  });

  it('leaves a URL without any query string unchanged', () => {
    const input = 'postgresql://user:pass@localhost:5432/thaispray_shop';
    const result = toCheckpointConnectionString(input);
    expect(result).toBe('postgresql://user:pass@localhost:5432/thaispray_shop');
  });

  it('works with postgres:// protocol URLs', () => {
    const input =
      'postgres://user:pass@localhost:5432/db?schema=public&sslmode=prefer';
    const result = toCheckpointConnectionString(input);
    expect(result).toBe(
      'postgres://user:pass@localhost:5432/db?sslmode=prefer',
    );
  });
});

describe('getCheckpointerPool', () => {
  it('extracts pool property from checkpointer object', () => {
    const fakePool = { query: jest.fn() };
    expect(getCheckpointerPool({ pool: fakePool })).toBe(fakePool);
  });

  it('calls getPool if available on checkpointer', () => {
    const fakePool = { query: jest.fn() };
    expect(getCheckpointerPool({ getPool: () => fakePool })).toBe(fakePool);
  });

  it('extracts client property if it has query', () => {
    const fakeClient = { query: jest.fn() };
    expect(getCheckpointerPool({ client: fakeClient })).toBe(fakeClient);
  });

  it('returns undefined if no pool is present', () => {
    expect(getCheckpointerPool(null)).toBeUndefined();
    expect(getCheckpointerPool(undefined)).toBeUndefined();
    expect(getCheckpointerPool({})).toBeUndefined();
  });
});

describe('deleteThreadCheckpoints', () => {
  it('executes delete queries for checkpoint_writes, checkpoint_blobs, and checkpoints with threadId in agent schema', async () => {
    const query = jest.fn().mockResolvedValue({ rowCount: 1 });
    const pool = { query };

    await deleteThreadCheckpoints(pool, 'th-123');

    expect(query).toHaveBeenCalledTimes(3);
    expect(query).toHaveBeenNthCalledWith(
      1,
      'DELETE FROM "agent".checkpoint_writes WHERE thread_id = $1',
      ['th-123'],
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      'DELETE FROM "agent".checkpoint_blobs WHERE thread_id = $1',
      ['th-123'],
    );
    expect(query).toHaveBeenNthCalledWith(
      3,
      'DELETE FROM "agent".checkpoints WHERE thread_id = $1',
      ['th-123'],
    );
  });

  it('uses custom schema when provided', async () => {
    const query = jest.fn().mockResolvedValue({ rowCount: 1 });
    const pool = { query };

    await deleteThreadCheckpoints(pool, 'th-456', 'custom_schema');

    expect(query).toHaveBeenCalledTimes(3);
    expect(query).toHaveBeenNthCalledWith(
      1,
      'DELETE FROM "custom_schema".checkpoint_writes WHERE thread_id = $1',
      ['th-456'],
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      'DELETE FROM "custom_schema".checkpoint_blobs WHERE thread_id = $1',
      ['th-456'],
    );
    expect(query).toHaveBeenNthCalledWith(
      3,
      'DELETE FROM "custom_schema".checkpoints WHERE thread_id = $1',
      ['th-456'],
    );
  });

  it('falls back to agent schema if schema name is invalid', async () => {
    const query = jest.fn().mockResolvedValue({ rowCount: 1 });
    const pool = { query };

    await deleteThreadCheckpoints(pool, 'th-789', 'invalid-schema; DROP TABLE');

    expect(query).toHaveBeenCalledTimes(3);
    expect(query).toHaveBeenNthCalledWith(
      1,
      'DELETE FROM "agent".checkpoint_writes WHERE thread_id = $1',
      ['th-789'],
    );
  });
});
