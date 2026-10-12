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
  return saver;
}
