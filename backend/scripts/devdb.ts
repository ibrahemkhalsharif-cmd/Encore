// Boots a throwaway PostgreSQL instance for local dev (no Docker or admin
// install needed), then makes sure the schema and seed data are in place.
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { bootstrap } from '../db/bootstrap';

const dataDir = fileURLToPath(new URL('../.pgdata', import.meta.url));
const port = 5433;
const databaseUrl = `postgres://postgres:postgres@127.0.0.1:${port}/encore`;

const db = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'postgres',
  password: 'postgres',
  port,
  persistent: true,
});

const firstRun = !existsSync(dataDir);

try {
  if (firstRun) await db.initialise();
  await db.start();
  if (firstRun) await db.createDatabase('encore');
  await bootstrap(databaseUrl);
  console.log(`postgres ready on 127.0.0.1:${port}`);
} catch (err) {
  console.error('failed to start dev database:', err);
  process.exit(1);
}

const shutdown = async () => {
  await db.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
