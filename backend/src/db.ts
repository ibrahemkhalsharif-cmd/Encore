import pg from 'pg';
import { config } from './config';

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: 10,
});

export const query = <T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
) => pool.query<T>(text, params);

// Runs fn inside a transaction, rolling back on any error.
export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const result = await fn(client);
    await client.query('commit');
    return result;
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
}
