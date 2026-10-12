import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

const PRISMA_ONLY_QUERY_PARAMS = new Set([
  'schema',
  'connection_limit',
  'pool_timeout',
  'socket_timeout',
  'pgbouncer',
]);

export function toCheckpointConnectionString(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  for (const param of PRISMA_ONLY_QUERY_PARAMS) {
    url.searchParams.delete(param);
  }
  return url.toString();
}

export async function createPostgresCheckpointer(
  databaseUrl: string,
  schema: string,
): Promise<PostgresSaver> {
  const connString = toCheckpointConnectionString(databaseUrl);
  const saver = PostgresSaver.fromConnString(connString, { schema });
  await saver.setup();
  (saver as any).schema = schema;
  (saver as any).deleteThread = async (threadId: string) => {
    const pool = getCheckpointerPool(saver);
    if (pool && typeof pool.query === 'function') {
      await deleteThreadCheckpoints(pool, threadId, schema);
    }
  };
  return saver;
}

export function getCheckpointerPool(checkpointer: unknown): any {
  if (!checkpointer || typeof checkpointer !== 'object') {
    return undefined;
  }
  return (
    (checkpointer as any).pool ??
    (typeof (checkpointer as any).getPool === 'function' ? (checkpointer as any).getPool() : undefined) ??
    ((checkpointer as any).client?.query ? (checkpointer as any).client : undefined)
  );
}

export async function deleteThreadCheckpoints(
  pool: { query: (sql: string, params?: any[]) => Promise<any> },
  threadId: string,
  schema = 'agent',
): Promise<void> {
  const safeSchema = /^[a-z_][a-z0-9_]{0,62}$/i.test(schema) ? schema : 'agent';
  await pool.query(
    `DELETE FROM "${safeSchema}".checkpoint_writes WHERE thread_id = $1`,
    [threadId],
  );
  await pool.query(
    `DELETE FROM "${safeSchema}".checkpoint_blobs WHERE thread_id = $1`,
    [threadId],
  );
  await pool.query(
    `DELETE FROM "${safeSchema}".checkpoints WHERE thread_id = $1`,
    [threadId],
  );
}

