#!/usr/bin/env node
/**
 * Payment-gateway switchboard — what is configured, what customers are offered,
 * and a way to flip the switch without the admin UI.
 *
 *   npm run gateways                 show status (default)
 *   npm run gateways -- enable opay  offer OPay at checkout
 *   npm run gateways -- default opay make OPay the pre-selected method (also enables it)
 *   npm run gateways -- disable opay stop offering OPay
 *
 * A gateway appears at checkout only if ALL THREE are true:
 *   1. its environment variables are set,
 *   2. its row in payment_gateway_configs is enabled   <-- new gateways start OFF
 *   3. (frontend) 2+ methods are offered, otherwise the picker is hidden.
 * Prints variable NAMES only, never values. Uses the same DATABASE_* settings
 * as the app.
 */
const { Client } = require('pg');
const { NODE_ENV, loaded, val } = require('./_load-env');

// Keep in sync with src/payments/gateways/*.gateway.ts (missingConfig()).
const REQUIRED = {
  paystack: ['PAYSTACK_SECRET_KEY', 'PAYSTACK_CALLBACK_URL'],
  opay: [
    'OPAY_MERCHANT_ID',
    'OPAY_PUBLIC_KEY',
    'OPAY_SECRET_KEY',
    'OPAY_CALLBACK_URL',
    'OPAY_RETURN_URL',
  ],
};
const missing = (code) => REQUIRED[code].filter((n) => !val(n));

async function main() {
  const [cmd = 'status', code] = process.argv.slice(2);
  if (!['status', 'enable', 'disable', 'default'].includes(cmd))
    fail(
      `Unknown command "${cmd}". Use: status | enable <code> | disable <code> | default <code>`,
    );
  if (cmd !== 'status' && !REQUIRED[code])
    fail(
      `Unknown gateway "${code}". Known: ${Object.keys(REQUIRED).join(', ')}`,
    );

  const db = new Client({
    host: val('DATABASE_HOST') || 'localhost',
    port: parseInt(val('DATABASE_PORT') || '5432', 10),
    user: val('DATABASE_USERNAME') || 'postgres',
    password: val('DATABASE_PASSWORD'),
    database: val('DATABASE_NAME') || 'gravitest_dev',
  });
  try {
    await db.connect();
  } catch (e) {
    fail(
      `Cannot connect to the database (${e.code || e.message}). Is Postgres running (docker compose up -d postgres) and are DATABASE_* set?`,
    );
  }

  try {
    const { rows: probe } = await db.query(
      `select to_regclass('public.payment_gateway_configs') as t`,
    );
    if (!probe[0].t)
      fail(
        'Table payment_gateway_configs does not exist yet. Start the backend once (it creates and seeds it), then re-run this.',
      );

    if (cmd !== 'status') {
      const m = missing(code);
      if ((cmd === 'enable' || cmd === 'default') && m.length)
        fail(
          `${code} cannot be switched on: missing ${m.join(', ')} in your env files.`,
        );
      const { rowCount } = await db.query(
        'select 1 from payment_gateway_configs where code=$1',
        [code],
      );
      if (!rowCount)
        fail(
          `No row for "${code}" yet. Start the backend once so it seeds the gateway rows, then re-run.`,
        );

      await db.query('begin');
      if (cmd === 'enable')
        await db.query(
          'update payment_gateway_configs set enabled=true where code=$1',
          [code],
        );
      if (cmd === 'default') {
        await db.query(
          'update payment_gateway_configs set "isDefault"=false where code<>$1',
          [code],
        );
        await db.query(
          'update payment_gateway_configs set enabled=true,"isDefault"=true where code=$1',
          [code],
        );
      }
      if (cmd === 'disable') {
        const { rows } = await db.query(
          'select count(*)::int n from payment_gateway_configs where enabled and code<>$1',
          [code],
        );
        if (rows[0].n === 0) {
          await db.query('rollback');
          fail('At least one payment method must stay enabled.');
        }
        await db.query(
          'update payment_gateway_configs set enabled=false,"isDefault"=false where code=$1',
          [code],
        );
        // keep exactly one default among the enabled gateways
        const { rows: d } = await db.query(
          'select count(*)::int n from payment_gateway_configs where enabled and "isDefault"',
        );
        if (d[0].n === 0)
          await db.query(
            `update payment_gateway_configs set "isDefault"=true where code=(select code from payment_gateway_configs where enabled order by "sortOrder" limit 1)`,
          );
      }
      await db.query('commit');
      console.log(`✔ ${cmd} ${code}: done.\n`);
    }

    const { rows } = await db.query(
      'select code,"displayName",enabled,"isDefault" from payment_gateway_configs order by "sortOrder"',
    );
    console.log(
      `Env files read (first wins): ${loaded.join(', ') || '(none found!)'}   NODE_ENV=${NODE_ENV}\n`,
    );
    const offered = [];
    for (const r of rows) {
      const m = REQUIRED[r.code] ? missing(r.code) : [];
      const configured = REQUIRED[r.code] ? m.length === 0 : true;
      const isOffered = r.enabled && configured;
      if (isOffered)
        offered.push(r.displayName + (r.isDefault ? ' (default)' : ''));
      console.log(
        `${isOffered ? '✔' : '✖'} ${r.displayName.padEnd(9)} env: ${configured ? 'complete' : 'MISSING ' + m.join(', ')}   switch: ${r.enabled ? 'ON' : 'OFF'}${r.isDefault ? '   default' : ''}   → ${isOffered ? 'offered at checkout' : 'NOT offered'}`,
      );
      if (configured && !r.enabled)
        console.log(
          `    ↳ credentials are fine, but it is switched OFF. Fix:  npm run gateways -- enable ${r.code}`,
        );
    }
    console.log(
      `\nCustomers will see: ${offered.length ? offered.join(' + ') : 'NOTHING (no usable gateway!)'}`,
    );
    if (offered.length === 1)
      console.log(
        'Only one method is offered, so the frontend hides the payment-method picker and uses it.',
      );
  } finally {
    await db.end().catch(() => {});
  }
}
function fail(msg) {
  console.error('✖ ' + msg);
  process.exit(1);
}
main().catch((e) => fail(e.message));
