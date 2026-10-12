import 'dotenv/config';
import { DataSource } from 'typeorm';

/**
 * DataSource used ONLY by the TypeORM CLI (migration:generate / migration:run
 * / migration:revert) — see package.json scripts. The app itself connects via
 * TypeOrmModule.forRootAsync() in app.module.ts, which is separate from this.
 *
 * Usage (after `npm install` and setting up your .env against a real Postgres
 * instance — see Postgres section in README/setup notes):
 *
 *   # one-time: generate a migration from current entities vs. current DB schema
 *   npm run migration:generate -- src/migrations/InitialSchema
 *
 *   # apply pending migrations
 *   npm run migration:run
 *
 *   # roll back the most recent migration
 *   npm run migration:revert
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/../migrations/*.{ts,js}'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
