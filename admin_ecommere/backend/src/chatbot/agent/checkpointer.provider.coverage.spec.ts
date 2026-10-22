import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import {
  createPostgresCheckpointer,
  getCheckpointerPool,
  deleteThreadCheckpoints,
} from './checkpointer.provider';

jest.mock('@langchain/langgraph-checkpoint-postgres', () => ({
  PostgresSaver: {
    fromConnString: jest.fn(),
  },
}));

describe('checkpointer.provider (coverage additions)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPostgresCheckpointer', () => {
    it('creates a PostgresSaver with stripped URL and schema, calls setup, and attaches deleteThread', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ rowCount: 1 });
      const mockSetup = jest.fn().mockResolvedValue(undefined);
      const fakeSaver: any = {
        setup: mockSetup,
        pool: { query: mockQuery },
      };

      (PostgresSaver.fromConnString as jest.Mock).mockReturnValue(fakeSaver);

      const dbUrl =
        'postgresql://postgres:secret@localhost:5432/testdb?schema=public&connection_limit=5&pool_timeout=10&sslmode=require';
      const checkpointer = await createPostgresCheckpointer(
        dbUrl,
        'custom_agent_schema',
      );

      expect(PostgresSaver.fromConnString).toHaveBeenCalledWith(
        'postgresql://postgres:secret@localhost:5432/testdb?sslmode=require',
        { schema: 'custom_agent_schema' },
      );
      expect(mockSetup).toHaveBeenCalledTimes(1);
      expect((checkpointer as any).schema).toBe('custom_agent_schema');
      expect(typeof (checkpointer as any).deleteThread).toBe('function');

      // Call deleteThread and verify it invokes deleteThreadCheckpoints with pool and custom schema
      await (checkpointer as any).deleteThread('th-test-123');

      expect(mockQuery).toHaveBeenCalledTimes(3);
      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        'DELETE FROM "custom_agent_schema".checkpoint_writes WHERE thread_id = $1',
        ['th-test-123'],
      );
      expect(mockQuery).toHaveBeenNthCalledWith(
        2,
        'DELETE FROM "custom_agent_schema".checkpoint_blobs WHERE thread_id = $1',
        ['th-test-123'],
      );
      expect(mockQuery).toHaveBeenNthCalledWith(
        3,
        'DELETE FROM "custom_agent_schema".checkpoints WHERE thread_id = $1',
        ['th-test-123'],
      );
    });

    it('works when saver uses getPool() function to expose its pool', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ rowCount: 1 });
      const mockSetup = jest.fn().mockResolvedValue(undefined);
      const fakePool = { query: mockQuery };
      const fakeSaver: any = {
        setup: mockSetup,
        getPool: () => fakePool,
      };

      (PostgresSaver.fromConnString as jest.Mock).mockReturnValue(fakeSaver);

      const checkpointer = await createPostgresCheckpointer(
        'postgresql://user:pass@localhost:5432/db',
        'agent',
      );

      await (checkpointer as any).deleteThread('th-getpool');

      expect(mockQuery).toHaveBeenCalledTimes(3);
      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        'DELETE FROM "agent".checkpoint_writes WHERE thread_id = $1',
        ['th-getpool'],
      );
    });

    it('works when saver uses client property with query function', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ rowCount: 1 });
      const mockSetup = jest.fn().mockResolvedValue(undefined);
      const fakeSaver: any = {
        setup: mockSetup,
        client: { query: mockQuery },
      };

      (PostgresSaver.fromConnString as jest.Mock).mockReturnValue(fakeSaver);

      const checkpointer = await createPostgresCheckpointer(
        'postgresql://user:pass@localhost:5432/db',
        'agent',
      );

      await (checkpointer as any).deleteThread('th-client');

      expect(mockQuery).toHaveBeenCalledTimes(3);
      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        'DELETE FROM "agent".checkpoint_writes WHERE thread_id = $1',
        ['th-client'],
      );
    });

    it('deleteThread completes gracefully when pool is undefined', async () => {
      const mockSetup = jest.fn().mockResolvedValue(undefined);
      const fakeSaver: any = {
        setup: mockSetup,
      };

      (PostgresSaver.fromConnString as jest.Mock).mockReturnValue(fakeSaver);

      const checkpointer = await createPostgresCheckpointer(
        'postgresql://user:pass@localhost:5432/db',
        'agent',
      );

      await expect(
        (checkpointer as any).deleteThread('th-no-pool'),
      ).resolves.toBeUndefined();
    });

    it('deleteThread completes gracefully when pool exists but pool.query is not a function', async () => {
      const mockSetup = jest.fn().mockResolvedValue(undefined);
      const fakeSaver: any = {
        setup: mockSetup,
        pool: { query: 'not-a-func' },
      };

      (PostgresSaver.fromConnString as jest.Mock).mockReturnValue(fakeSaver);

      const checkpointer = await createPostgresCheckpointer(
        'postgresql://user:pass@localhost:5432/db',
        'agent',
      );

      await expect(
        (checkpointer as any).deleteThread('th-bad-pool'),
      ).resolves.toBeUndefined();
    });
  });

  describe('getCheckpointerPool (edge cases)', () => {
    it('returns undefined for primitive types and non-object inputs', () => {
      expect(getCheckpointerPool(12345)).toBeUndefined();
      expect(getCheckpointerPool('connection-string')).toBeUndefined();
      expect(getCheckpointerPool(true)).toBeUndefined();
      expect(getCheckpointerPool(Symbol('checkpointer'))).toBeUndefined();
      expect(getCheckpointerPool(BigInt(100))).toBeUndefined();
    });

    it('returns undefined when getPool is not a function and client has no query', () => {
      const checkpointer = { getPool: 'not-a-function' };
      expect(getCheckpointerPool(checkpointer)).toBeUndefined();
    });

    it('falls back to client when getPool is not a function but client has query', () => {
      const fakeClient = { query: jest.fn() };
      const checkpointer = {
        getPool: 'not-a-function',
        client: fakeClient,
      };
      expect(getCheckpointerPool(checkpointer)).toBe(fakeClient);
    });

    it('falls back to client when getPool() returns undefined', () => {
      const fakeClient = { query: jest.fn() };
      const checkpointer = {
        getPool: () => undefined,
        client: fakeClient,
      };
      expect(getCheckpointerPool(checkpointer)).toBe(fakeClient);
    });

    it('returns undefined when client property exists without query function', () => {
      const checkpointer = {
        client: {},
      };
      expect(getCheckpointerPool(checkpointer)).toBeUndefined();
    });

    it('returns undefined when client.query is null or undefined', () => {
      const checkpointer = {
        client: { query: null },
      };
      expect(getCheckpointerPool(checkpointer)).toBeUndefined();
    });
  });

  describe('deleteThreadCheckpoints (schema validation and error paths)', () => {
    it('allows valid schema starting with an underscore', async () => {
      const query = jest.fn().mockResolvedValue({ rowCount: 1 });
      const pool = { query };

      await deleteThreadCheckpoints(pool, 'th-under', '_agent_store');

      expect(query).toHaveBeenNthCalledWith(
        1,
        'DELETE FROM "_agent_store".checkpoint_writes WHERE thread_id = $1',
        ['th-under'],
      );
    });

    it('allows valid schema of maximum allowed length (63 characters)', async () => {
      const query = jest.fn().mockResolvedValue({ rowCount: 1 });
      const pool = { query };
      const schema63 = 's' + 'a'.repeat(62); // 1 + 62 = 63 chars

      await deleteThreadCheckpoints(pool, 'th-63', schema63);

      expect(query).toHaveBeenNthCalledWith(
        1,
        `DELETE FROM "${schema63}".checkpoint_writes WHERE thread_id = $1`,
        ['th-63'],
      );
    });

    it('falls back to agent schema when schema length exceeds 63 characters (64 chars)', async () => {
      const query = jest.fn().mockResolvedValue({ rowCount: 1 });
      const pool = { query };
      const schema64 = 's' + 'a'.repeat(63); // 1 + 63 = 64 chars

      await deleteThreadCheckpoints(pool, 'th-64', schema64);

      expect(query).toHaveBeenNthCalledWith(
        1,
        'DELETE FROM "agent".checkpoint_writes WHERE thread_id = $1',
        ['th-64'],
      );
    });

    it('falls back to agent schema when schema begins with a digit', async () => {
      const query = jest.fn().mockResolvedValue({ rowCount: 1 });
      const pool = { query };

      await deleteThreadCheckpoints(pool, 'th-digit', '1st_schema');

      expect(query).toHaveBeenNthCalledWith(
        1,
        'DELETE FROM "agent".checkpoint_writes WHERE thread_id = $1',
        ['th-digit'],
      );
    });

    it('falls back to agent schema when schema is an empty string', async () => {
      const query = jest.fn().mockResolvedValue({ rowCount: 1 });
      const pool = { query };

      await deleteThreadCheckpoints(pool, 'th-empty', '');

      expect(query).toHaveBeenNthCalledWith(
        1,
        'DELETE FROM "agent".checkpoint_writes WHERE thread_id = $1',
        ['th-empty'],
      );
    });

    it('rethrows error when pool.query rejects', async () => {
      const dbError = new Error('Database connection failed');
      const query = jest.fn().mockRejectedValue(dbError);
      const pool = { query };

      await expect(
        deleteThreadCheckpoints(pool, 'th-err', 'agent'),
      ).rejects.toThrow(dbError);
      await expect(
        deleteThreadCheckpoints(pool, 'th-err', 'agent'),
      ).rejects.toThrow('Database connection failed');
    });
  });
});
