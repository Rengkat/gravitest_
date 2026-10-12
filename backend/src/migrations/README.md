# Migrations

This directory is intentionally empty right now.

`synchronize` is now **hard-disabled** in every environment (see
`src/config/databaseConfig.ts`) — the app will not auto-create or alter
tables anymore, in dev or prod. That means you must generate a real
migration once you have a live Postgres connection, which isn't possible
from this sandbox (no network / no database here).

## One-time setup (do this after `npm install`, pointed at a real Postgres)

```bash
npm run migration:generate -- src/migrations/InitialSchema
npm run migration:run
```

`migration:generate` connects to the DB defined in your `.env`, diffs it
against every `*.entity.ts` in `src/`, and writes a migration file that
creates the full schema. Commit that file.

## Going forward

Every time you change an entity, generate a new migration the same way
(`npm run migration:generate -- src/migrations/DescriptiveName`) and commit
it — don't hand-edit the schema and don't flip `synchronize` back on in
production, or your migration history and the real schema will drift apart.

## CI/CD

Run `npm run migration:run` as a deploy step, before the app starts —
`migrationsRun` is intentionally left `false` in `databaseConfig.ts` so
migrations happen explicitly as a controlled deploy step rather than
silently on every app boot.

---

## Billing: plans, gateways (OPay), feature rules — `1790683200000-AddPlansGatewaysEntitlements`

Adds the tables/columns behind admin-editable plans, multiple payment gateways
and per-feature free/paid rules. Run it like any other migration:

```bash
npm run migration:run
```

- **Idempotent.** Safe if `synchronize` already created some or all of this
  (`IF NOT EXISTS` / guarded `CREATE TYPE`), and safe to run twice.
- **No data is copied or lost.** Existing transactions are backfilled
  `gateway = 'paystack'`; the physical `transactions."paystackReference"`
  column keeps its name (the entity maps `gatewayReference` onto it).
- **No seed data.** Plans, gateway rows and feature rules are seeded by the app
  on first boot (only when their tables are empty — admin edits are never
  overwritten).
- **Revertible** (`npm run migration:revert`). It refuses to restore the old
  global-unique card signature if two users have since saved the same card,
  rather than deleting anyone's saved card. Reverting drops `transactions.gateway`,
  i.e. which gateway took each payment.

> **Heads-up:** `src/config/databaseConfig.ts` currently sets
> `synchronize: true`, which contradicts the note at the top of this file
> ("hard-disabled"). While it is `true`, the app auto-creates these tables at
> boot; with it `false`, you MUST run this migration before deploying.
