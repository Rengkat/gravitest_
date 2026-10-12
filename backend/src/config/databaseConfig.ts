import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres' as const,
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || 'gravitest_dev',
  autoLoadEntities: true,
  // Hard-disabled in every environment, including dev — the app relies on
  // committed migrations (src/migrations/) instead of auto-sync. See
  // src/migrations/README.md for the one-time setup + workflow.
  synchronize: true,
  // Migrations are run as an explicit deploy step (`npm run migration:run`),
  // not automatically on boot, so a bad migration can't silently half-apply
  // itself every time the app restarts.
  migrationsRun: false,
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  logging: process.env.NODE_ENV === 'development',
}));
