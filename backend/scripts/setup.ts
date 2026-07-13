// Applies the schema and seed data to whatever DATABASE_URL points at.
// Used for real Postgres instances (production, CI) — local dev handles
// this automatically via `npm run db`.
import { bootstrap } from '../db/bootstrap';

try {
  process.loadEnvFile();
} catch {}

const url =
  process.env.DATABASE_URL ??
  'postgres://postgres:postgres@127.0.0.1:5433/encore';

await bootstrap(url);
console.log('database ready');
