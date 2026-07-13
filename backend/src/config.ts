try {
  process.loadEnvFile();
} catch {
  // no .env file, rely on real environment variables
}

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var ${key}`);
  return value;
};

export const config = {
  port: Number(process.env.API_PORT ?? 4000),
  databaseUrl:
    process.env.DATABASE_URL ??
    'postgres://postgres:postgres@127.0.0.1:5433/encore',
  jwtSecret: required('JWT_SECRET'),
  isProd: process.env.NODE_ENV === 'production',
};
