import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import {
  createPostgresCheckpointer,
  getCheckpointerPool,
  deleteExpiredCheckpoints,
  deleteThreadCheckpoints,
} from './checkpointer.provider';

jest.mock('@langchain/langgraph-checkpoint-postgres', () => {
  return {
    PostgresSaver: {
      fromConnString: jest.fn(),
    },
  };
});

describe('checkpointer.provider (coverage)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPostgresCheckpointer', () => {
    it('creates a PostgresSaver, calls setup(), sets schema, and attaches working deleteThread', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ rowCount: 1 });
      const mockPool = { query: mockQuery };
      const mockSaverInstance = {
        setup: jest.fn().mockResolvedValue(undefined),
        pool: mockPool,
      };

      (PostgresSaver.fromConnString as jest.Mock).mockReturnValue(
        mockSaverInstance,
      );

      const databaseUrl =
        'postgresql://user:pass@localhost:5432/thaispray_shop?schema=public&sslmode=require';
      const schema = 'custom_agent';

      const saver = await createPostgresCheckpointer(databaseUrl, schema);

      expect(PostgresSaver.fromConnString).toHaveBeenCalledTimes(1);
      expect(PostgresSaver.fromConnString).toHaveBeenCalledWith(
        'postgresql://user:pass@localhost:5432/thaispray_shop?sslmode=require',
        { schema: 'custom_agent' },
      );
      expect(mockSaverInstance.setup).toHaveBeenCalledTimes(1);
      expect((saver as any).schema).toBe('custom_agent');
      expect(typeof (saver as any).deleteThread).toBe('function');

      // Test deleteThread function attached to saver
      await (saver as any).deleteThread('thread-cov-123');
      expect(mockQuery).toHaveBeenCalledTimes(3);
      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        'DELETE FROM "custom_agent".checkpoint_writes WHERE thread_id = $1',
        ['thread-cov-123'],
      );
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        'DELETE FROM "custom_agent".checkpoint_blobs WHERE thread_id = $1',
        ['thread-cov-123'],
      );
      expect(mockQuery).toHaveBeenNthCalledWith(
        3,
        'DELETE FROM "custom_agent".checkpoints WHERE thread_id = $1',
        ['thread-cov-123'],
      );
    });

    it('deleteThread resolves without error when saver has no pool or pool.query is not a function', async () => {
      const mockSaverInstance = {
        setup: jest.fn().mockResolvedValue(undefined),
        // No pool property
      };

      (PostgresSaver.fromConnString as jest.Mock).mockReturnValue(
        mockSaverInstance,
      );

      const saver = await createPostgresCheckpointer(
        'postgresql://user:pass@localhost:5432/db',
        'agent',
      );

      await expect(
        (saver as any).deleteThread('thread-no-pool'),
      ).resolves.toBeUndefined();
    });

    it('deleteThread resolves without error when pool has no query method', async () => {
      const mockSaverInstance = {
        setup: jest.fn().mockResolvedValue(undefined),
        pool: { notQuery: true },
      };

      (PostgresSaver.fromConnString as jest.Mock).mockReturnValue(
        mockSaverInstance,
      );

      const saver = await createPostgresCheckpointer(
        'postgresql://user:pass@localhost:5432/db',
        'agent',
      );

      await expect(
        (saver as any).deleteThread('thread-invalid-pool'),
      ).resolves.toBeUndefined();
    });
  });

  describe('getCheckpointerPool', () => {
    it('returns checkpointer itself if checkpointer has query function', () => {
      const selfPool = { query: jest.fn() };
      expect(getCheckpointerPool(selfPool)).toBe(selfPool);
    });

    it('returns undefined for primitive values (non-objects)', () => {
      expect(getCheckpointerPool('string')).toBeUndefined();
      expect(getCheckpointerPool(12345)).toBeUndefined();
      expect(getCheckpointerPool(true)).toBeUndefined();
      expect(getCheckpointerPool(false)).toBeUndefined();
      expect(getCheckpointerPool(Symbol('checkpointer'))).toBeUndefined();
    });

    it('returns undefined if client exists but has no query property', () => {
      expect(getCheckpointerPool({ client: {} })).toBeUndefined();
      expect(getCheckpointerPool({ client: null })).toBeUndefined();
      expect(getCheckpointerPool({ client: 'not-client' })).toBeUndefined();
    });

    it('falls through to checkpointer.query when getPool() returns undefined', () => {
      const checkpointer = {
        getPool: () => undefined,
        query: jest.fn(),
      };
      expect(getCheckpointerPool(checkpointer)).toBe(checkpointer);
    });

    it('falls through to checkpointer.query when pool is undefined and client has no query', () => {
      const checkpointer = {
        pool: undefined,
        client: {},
        query: jest.fn(),
      };
      expect(getCheckpointerPool(checkpointer)).toBe(checkpointer);
    });
  });

  describe('deleteExpiredCheckpoints', () => {
    it('handles cutoff when passed as a string and converts to Date', async () => {
      const query = jest.fn().mockResolvedValue({ rowCount: 7 });
      const pool = { query };
      const dateString = '2026-08-15T12:00:00.000Z';

      const result = await deleteExpiredCheckpoints(pool, dateString as any);

      expect(result).toBe(7);
      expect(query).toHaveBeenCalledTimes(1);
      const [, params] = query.mock.calls[0];
      expect(params).toEqual([new Date(dateString)]);
    });

    it('handles cutoff when passed as a number (timestamp) and converts to Date', async () => {
      const query = jest.fn().mockResolvedValue({ rowCount: 2 });
      const pool = { query };
      const timestamp = 1755259200000;

      const result = await deleteExpiredCheckpoints(pool, timestamp as any);

      expect(result).toBe(2);
      expect(query).toHaveBeenCalledTimes(1);
      const [, params] = query.mock.calls[0];
      expect(params).toEqual([new Date(timestamp)]);
    });

    it('returns rows.length when result.rowCount is undefined and result.rows is an array', async () => {
      const query = jest.fn().mockResolvedValue({
        rows: [{ id: 'th-1' }, { id: 'th-2' }, { id: 'th-3' }],
      });
      const pool = { query };
      const cutoff = new Date('2026-09-01T00:00:00Z');

      const result = await deleteExpiredCheckpoints(pool, cutoff);

      expect(result).toBe(3);
    });

    it('returns 0 when result is null or has neither rowCount nor rows array', async () => {
      const queryNull = jest.fn().mockResolvedValue(null);
      expect(
        await deleteExpiredCheckpoints({ query: queryNull }, new Date()),
      ).toBe(0);

      const queryEmpty = jest.fn().mockResolvedValue({});
      expect(
        await deleteExpiredCheckpoints({ query: queryEmpty }, new Date()),
      ).toBe(0);

      const queryNonArrayRows = jest
        .fn()
        .mockResolvedValue({ rows: 'not-array' });
      expect(
        await deleteExpiredCheckpoints(
          { query: queryNonArrayRows },
          new Date(),
        ),
      ).toBe(0);
    });
  });

  describe('deleteThreadCheckpoints', () => {
    it('uses default agent schema when schema parameter is omitted', async () => {
      const query = jest.fn().mockResolvedValue({ rowCount: 1 });
      const pool = { query };

      await deleteThreadCheckpoints(pool, 'thread-default-schema');

      expect(query).toHaveBeenCalledTimes(3);
      expect(query).toHaveBeenNthCalledWith(
        1,
        'DELETE FROM "agent".checkpoint_writes WHERE thread_id = $1',
        ['thread-default-schema'],
      );
      expect(query).toHaveBeenNthCalledWith(
        2,
        'DELETE FROM "agent".checkpoint_blobs WHERE thread_id = $1',
        ['thread-default-schema'],
      );
      expect(query).toHaveBeenNthCalledWith(
        3,
        'DELETE FROM "agent".checkpoints WHERE thread_id = $1',
        ['thread-default-schema'],
      );
    });

    it('falls back to agent schema when schema is empty string', async () => {
      const query = jest.fn().mockResolvedValue({ rowCount: 1 });
      const pool = { query };

      await deleteThreadCheckpoints(pool, 'thread-empty-schema', '');

      expect(query).toHaveBeenCalledTimes(3);
      expect(query).toHaveBeenNthCalledWith(
        1,
        'DELETE FROM "agent".checkpoint_writes WHERE thread_id = $1',
        ['thread-empty-schema'],
      );
    });
  });
});
