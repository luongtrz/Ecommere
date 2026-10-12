import { toCheckpointConnectionString } from './checkpointer.provider';

describe('toCheckpointConnectionString', () => {
  it('removes schema=... query parameter from the connection URL', () => {
    const input = 'postgresql://user:pass@localhost:5432/thaispray_shop?schema=public';
    const result = toCheckpointConnectionString(input);
    expect(result).toBe('postgresql://user:pass@localhost:5432/thaispray_shop');
  });

  it('removes schema parameter with custom schema name', () => {
    const input = 'postgresql://user:pass@localhost:5432/thaispray_shop?schema=custom_schema';
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
    const input = 'postgres://user:pass@localhost:5432/db?schema=public&sslmode=prefer';
    const result = toCheckpointConnectionString(input);
    expect(result).toBe('postgres://user:pass@localhost:5432/db?sslmode=prefer');
  });
});
