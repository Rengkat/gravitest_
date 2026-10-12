import { MigrationInterface, QueryRunner } from 'typeorm';

// Adds (admin-configurable billing):
//   - plans                     admin-editable subscription plans (+ scheduled promo pricing)
//   - payment_gateway_configs   which gateways (Paystack, OPay, …) are offered at checkout
//   - feature_access_rules      per-feature free / paid / disabled rules
//   - feature_usage             atomic free-quota counters
//   - subscriptions.*           plan snapshot + managed-renewal bookkeeping
//   - transactions.gateway      which gateway collected each payment (existing rows → 'paystack')
//   - payment_methods           card signature unique PER USER (was globally unique)
//
// IDEMPOTENT on purpose: with `synchronize: true` (see databaseConfig.ts) the
// app may already have created some of this at boot, and this migration must
// still run cleanly on top of that. Nothing here seeds data — plans, gateways
// and feature rules are seeded by their services on first boot.
//
// Not touched: the physical column transactions."paystackReference" keeps its
// name (the entity maps `gatewayReference` onto it) so no data is copied or lost.
export class AddPlansGatewaysEntitlements1790683200000 implements MigrationInterface {
  name = 'AddPlansGatewaysEntitlements1790683200000';

  public async up(q: QueryRunner): Promise<void> {
    // Same UUID default TypeORM generates for @PrimaryGeneratedColumn('uuid'),
    // so the schema matches the entities exactly (no default-value drift).
    await q.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    const enumType = (name: string, values: string[]) =>
      q.query(`
        DO $$ BEGIN
          CREATE TYPE "public"."${name}" AS ENUM(${values.map((v) => `'${v}'`).join(', ')});
        EXCEPTION WHEN duplicate_object THEN NULL; END $$`);

    // ── plans ────────────────────────────────────────────────────────────
    await enumType('plans_tier_enum', ['free', 'basic', 'standard', 'premium', 'enterprise']);
    await enumType('plans_interval_enum', ['monthly', 'quarterly', 'annually']);
    await q.query(`
      CREATE TABLE IF NOT EXISTS "plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying(80) NOT NULL,
        "name" character varying(120) NOT NULL,
        "description" text,
        "tier" "public"."plans_tier_enum" NOT NULL,
        "interval" "public"."plans_interval_enum",
        "amountKobo" integer NOT NULL DEFAULT '0',
        "currency" character varying(3) NOT NULL DEFAULT 'NGN',
        "features" jsonb NOT NULL DEFAULT '[]',
        "badge" character varying(40),
        "sortOrder" integer NOT NULL DEFAULT '0',
        "isActive" boolean NOT NULL DEFAULT true,
        "isPublic" boolean NOT NULL DEFAULT true,
        "isSelfServe" boolean NOT NULL DEFAULT true,
        "promoAmountKobo" integer,
        "promoLabel" character varying(80),
        "promoStartsAt" TIMESTAMP WITH TIME ZONE,
        "promoEndsAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_95f7ef3fc4c31a3545b4d825dd4" UNIQUE ("code"),
        CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY ("id")
      )`);
    await q.query(`CREATE INDEX IF NOT EXISTS "IDX_f99a839ff2bec0b7dd697ba02b" ON "plans" ("isActive", "isPublic", "sortOrder")`);

    // ── payment gateway switchboard ──────────────────────────────────────
    await q.query(`
      CREATE TABLE IF NOT EXISTS "payment_gateway_configs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying(20) NOT NULL,
        "displayName" character varying(120) NOT NULL,
        "enabled" boolean NOT NULL DEFAULT false,
        "isDefault" boolean NOT NULL DEFAULT false,
        "sortOrder" integer NOT NULL DEFAULT '0',
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_bcfb18f4df8f0e6636b25102c3f" UNIQUE ("code"),
        CONSTRAINT "PK_08f1b79e6c1e4de57eb5f8f1db3" PRIMARY KEY ("id")
      )`);

    // ── feature access rules + usage counters ────────────────────────────
    await enumType('feature_access_rules_mode_enum', ['free', 'paid', 'disabled']);
    await enumType('feature_access_rules_mintier_enum', ['free', 'basic', 'standard', 'premium', 'enterprise']);
    await enumType('feature_access_rules_quotaperiod_enum', ['daily', 'monthly']);
    await q.query(`
      CREATE TABLE IF NOT EXISTS "feature_access_rules" (
        "featureKey" character varying(60) NOT NULL,
        "mode" "public"."feature_access_rules_mode_enum" NOT NULL DEFAULT 'free',
        "minTier" "public"."feature_access_rules_mintier_enum",
        "freeQuota" integer,
        "quotaPeriod" "public"."feature_access_rules_quotaperiod_enum",
        "freeUntil" TIMESTAMP WITH TIME ZONE,
        "updatedBy" character varying,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_201c36ac6a7646c7ff430fe4e13" PRIMARY KEY ("featureKey")
      )`);
    await q.query(`
      CREATE TABLE IF NOT EXISTS "feature_usage" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" character varying NOT NULL,
        "feature_key" character varying(60) NOT NULL,
        "period_key" character varying(10) NOT NULL,
        "count" integer NOT NULL DEFAULT '0',
        CONSTRAINT "PK_f5b7116f8fafba341ccaf86919c" PRIMARY KEY ("id")
      )`);
    // The atomic quota upsert (ON CONFLICT) depends on this exact unique index.
    await q.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_feature_usage_user_feature_period" ON "feature_usage" ("user_id", "feature_key", "period_key")`);

    // ── subscriptions: plan snapshot + managed renewals ──────────────────
    await q.query(`
      ALTER TABLE "subscriptions"
        ADD COLUMN IF NOT EXISTS "planId" uuid,
        ADD COLUMN IF NOT EXISTS "planCode" character varying(80),
        ADD COLUMN IF NOT EXISTS "gateway" character varying(20),
        ADD COLUMN IF NOT EXISTS "renewalAmountKobo" integer,
        ADD COLUMN IF NOT EXISTS "paymentMethodId" uuid,
        ADD COLUMN IF NOT EXISTS "renewalAttempts" integer NOT NULL DEFAULT '0',
        ADD COLUMN IF NOT EXISTS "lastRenewalAttemptAt" TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS "lastTransactionId" character varying,
        ADD COLUMN IF NOT EXISTS "lastReminderDays" integer`);

    // ── transactions: which gateway took the money ───────────────────────
    // NOT NULL DEFAULT 'paystack' backfills every existing row in one step —
    // before this feature Paystack was the only gateway.
    await q.query(`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "gateway" character varying(20) NOT NULL DEFAULT 'paystack'`);
    await q.query(`CREATE INDEX IF NOT EXISTS "IDX_445630fdd4eb652fa7ae86539f" ON "transactions" ("gateway")`);

    // ── payment_methods: card signature unique per USER, not globally ────
    // Drop whichever unique constraint currently covers ONLY (signature). Looked
    // up by shape, not by its generated name, so it works on any environment.
    await q.query(`
      DO $$
      DECLARE c record;
      BEGIN
        FOR c IN
          SELECT con.conname
          FROM pg_constraint con
          JOIN pg_class rel ON rel.oid = con.conrelid
          JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY (con.conkey)
          WHERE rel.relname = 'payment_methods' AND con.contype = 'u'
          GROUP BY con.conname, con.conkey
          HAVING array_length(con.conkey, 1) = 1 AND bool_or(att.attname = 'signature')
        LOOP
          EXECUTE format('ALTER TABLE "payment_methods" DROP CONSTRAINT %I', c.conname);
        END LOOP;
      END $$`);
    await q.query(`
      DO $$ BEGIN
        ALTER TABLE "payment_methods" ADD CONSTRAINT "UQ_payment_methods_user_signature" UNIQUE ("userId", "signature");
      EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $$`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE "payment_methods" DROP CONSTRAINT IF EXISTS "UQ_payment_methods_user_signature"`);
    // Restoring the old GLOBAL unique fails if two users have since saved the
    // same card — refuse loudly rather than delete anyone's saved card.
    await q.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM "payment_methods" WHERE "signature" IS NOT NULL GROUP BY "signature" HAVING count(*) > 1) THEN
          RAISE EXCEPTION 'Cannot revert: multiple users share a card signature in payment_methods. Resolve duplicates first.';
        END IF;
        ALTER TABLE "payment_methods" ADD CONSTRAINT "UQ_8a60436dbc4c11fb7dac0f9ee55" UNIQUE ("signature");
      EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $$`);

    await q.query(`DROP INDEX IF EXISTS "IDX_445630fdd4eb652fa7ae86539f"`);
    // NOTE: dropping transactions.gateway loses which gateway took each payment.
    await q.query(`ALTER TABLE "transactions" DROP COLUMN IF EXISTS "gateway"`);

    await q.query(`
      ALTER TABLE "subscriptions"
        DROP COLUMN IF EXISTS "lastReminderDays",
        DROP COLUMN IF EXISTS "lastTransactionId",
        DROP COLUMN IF EXISTS "lastRenewalAttemptAt",
        DROP COLUMN IF EXISTS "renewalAttempts",
        DROP COLUMN IF EXISTS "paymentMethodId",
        DROP COLUMN IF EXISTS "renewalAmountKobo",
        DROP COLUMN IF EXISTS "gateway",
        DROP COLUMN IF EXISTS "planCode",
        DROP COLUMN IF EXISTS "planId"`);

    await q.query(`DROP INDEX IF EXISTS "UQ_feature_usage_user_feature_period"`);
    await q.query(`DROP TABLE IF EXISTS "feature_usage"`);
    await q.query(`DROP TABLE IF EXISTS "feature_access_rules"`);
    await q.query(`DROP TYPE IF EXISTS "public"."feature_access_rules_quotaperiod_enum"`);
    await q.query(`DROP TYPE IF EXISTS "public"."feature_access_rules_mintier_enum"`);
    await q.query(`DROP TYPE IF EXISTS "public"."feature_access_rules_mode_enum"`);
    await q.query(`DROP TABLE IF EXISTS "payment_gateway_configs"`);
    await q.query(`DROP INDEX IF EXISTS "IDX_f99a839ff2bec0b7dd697ba02b"`);
    await q.query(`DROP TABLE IF EXISTS "plans"`);
    await q.query(`DROP TYPE IF EXISTS "public"."plans_interval_enum"`);
    await q.query(`DROP TYPE IF EXISTS "public"."plans_tier_enum"`);
  }
}
