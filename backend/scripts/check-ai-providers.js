#!/usr/bin/env node
/**
 * AI provider diagnostics — answers "why isn't the AI working?" in one run.
 *
 *   npm run check:ai            test every configured key + that the models the app uses exist
 *   npm run check:ai -- --ping  also send one tiny real request per active model (uses a few tokens)
 *
 * For each provider with a key it calls the provider's model-list endpoint with
 * that key. Keys are NEVER printed; any echo of a key in an error body is
 * redacted. Active models are read from your database (ai_model_configs) when
 * reachable, otherwise the app's seeded defaults are used.
 *
 * Google: both the old "AIza…" and the new "AQ.…" auth keys are sent in the
 * x-goog-api-key header, exactly as the app does.
 */
const { Client } = require('pg');
const { NODE_ENV, loaded, val, redact } = require('./_load-env');

const PING = process.argv.includes('--ping');
const TIMEOUT = 20_000;

const PROVIDERS = {
  groq:      { key: 'GROQ_API_KEY',      base: val('GROQ_BASE_URL')      || 'https://api.groq.com/openai/v1' },
  mistral:   { key: 'MISTRAL_API_KEY',   base: val('MISTRAL_BASE_URL')   || 'https://api.mistral.ai/v1' },
  google:    { key: 'GOOGLE_AI_API_KEY', base: val('GOOGLE_AI_BASE_URL') || 'https://generativelanguage.googleapis.com/v1beta' },
  deepseek:  { key: 'DEEPSEEK_API_KEY',  base: val('DEEPSEEK_BASE_URL')  || 'https://api.deepseek.com/v1' },
  openai:    { key: 'OPENAI_API_KEY',    base: val('OPENAI_BASE_URL')    || 'https://api.openai.com/v1' },
  anthropic: { key: 'ANTHROPIC_API_KEY', base: val('ANTHROPIC_BASE_URL') || 'https://api.anthropic.com/v1' },
  openrouter:{ key: 'OPENROUTER_API_KEY',base: val('OPENROUTER_BASE_URL')|| 'https://openrouter.ai/api/v1' },
};

// What the app seeds (src/ai/ai-seed.service.ts) — used only if the DB can't be read.
const SEEDED = {
  groq: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'],
  mistral: ['mistral-small-latest'],
  google: ['gemini-3.5-flash-lite', 'gemini-3.8-flash'],
  deepseek: ['deepseek-v4-flash'],
};

async function activeModels() {
  const db = new Client({
    host: val('DATABASE_HOST') || 'localhost', port: parseInt(val('DATABASE_PORT') || '5432', 10),
    user: val('DATABASE_USERNAME') || 'postgres', password: val('DATABASE_PASSWORD'),
    database: val('DATABASE_NAME') || 'gravitest_dev', connectionTimeoutMillis: 4000,
  });
  try {
    await db.connect();
    const { rows } = await db.query(`select "modelId", provider from ai_model_configs where "isActive" = true`);
    const out = {};
    for (const r of rows) (out[r.provider] ||= []).push(r.modelId);
    return { models: out, source: 'your database (active models)' };
  } catch (e) {
    const why = e.code === '42P01' ? 'table ai_model_configs does not exist yet — start the backend once' : 'database not reachable';
    return { models: SEEDED, source: `the app's seeded defaults (${why})` };
  }
  finally { await db.end().catch(() => {}); }
}

async function http(url, init) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT) });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, ok: res.ok, text, json };
}

async function listModels(name, key, base) {
  if (name === 'google') {
    const ids = []; let token = '';
    do {
      const r = await http(`${base}/models?pageSize=1000${token ? `&pageToken=${token}` : ''}`, { headers: { 'x-goog-api-key': key } });
      if (!r.ok) return r;
      ids.push(...(r.json?.models ?? []).map((m) => String(m.name).replace(/^models\//, '')));
      token = r.json?.nextPageToken || '';
    } while (token);
    return { ok: true, status: 200, ids };
  }
  const headers = name === 'anthropic'
    ? { 'x-api-key': key, 'anthropic-version': '2023-06-01' }
    : { Authorization: `Bearer ${key}` };
  const r = await http(`${base}/models`, { headers });
  if (!r.ok) return r;
  return { ok: true, status: r.status, ids: (r.json?.data ?? []).map((m) => m.id) };
}

async function ping(name, key, base, model) {
  if (name === 'google') {
    const body = { contents: [{ role: 'user', parts: [{ text: 'Reply with the single word OK.' }] }], generationConfig: { maxOutputTokens: 256 } };
    return http(`${base}/models/${model}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body) });
  }
  if (name === 'anthropic') {
    return http(`${base}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model, max_tokens: 32, messages: [{ role: 'user', content: 'Reply with the single word OK.' }] }) });
  }
  const body = { model, messages: [{ role: 'user', content: 'Reply with the single word OK.' }] };
  if (name === 'openai' && /^(gpt-5|gpt-6|o\d)/i.test(model)) body.max_completion_tokens = 2000;
  else if (name === 'openai') body.max_completion_tokens = 32;
  else if (name === 'groq' && /^openai\/gpt-oss/i.test(model)) { body.max_tokens = 1000; body.reasoning_effort = 'low'; }
  else body.max_tokens = 32;
  return http(`${base}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify(body) });
}

function explain(name, r, key) {
  const body = redact((r.text || '').replace(/\s+/g, ' ').slice(0, 220), [key]);
  let hint = '';
  if (r.status === 401 || r.status === 403 || /UNAUTHENTICATED|API_KEY_INVALID|PERMISSION_DENIED/i.test(body)) {
    hint = name === 'google' && /ACCESS_TOKEN_TYPE_UNSUPPORTED/i.test(body)
      ? '  → Google rejected the key TYPE. AQ. keys are valid on this endpoint; create a fresh key in a NEW AI Studio project, confirm "Generative Language API" is enabled, paste with no quotes/spaces.'
      : `  → ${key ? 'the key was rejected: wrong, revoked, truncated or has stray quotes/spaces' : 'no key set'}. Check ${PROVIDERS[name].key} (and that .env.${NODE_ENV} does not override it).`;
  } else if (r.status === 404) hint = '  → model/endpoint not found (model id may be retired for this provider).';
  else if (r.status === 429) hint = '  → rate-limited / quota exhausted on this key.';
  return `HTTP ${r.status}: ${body}${hint}`;
}

(async () => {
  console.log(`Env files read (first wins): ${loaded.join(', ') || '(none found!)'}   NODE_ENV=${NODE_ENV}`);
  const { models, source } = await activeModels();
  console.log(`Models checked come from ${source}.\n`);
  let problems = 0;

  for (const [name, p] of Object.entries(PROVIDERS)) {
    const key = val(p.key);
    const wanted = models[name] ?? [];
    if (!key) {
      if (wanted.length) { problems++; console.log(`✖ ${name.padEnd(10)} NO KEY (${p.key} is blank) but ${wanted.length} active model(s) use it: ${wanted.join(', ')}`); }
      else console.log(`- ${name.padEnd(10)} no key, no active models — fine`);
      continue;
    }
    let r;
    try { r = await listModels(name, key, p.base); } catch (e) { problems++; console.log(`✖ ${name.padEnd(10)} could not reach ${p.base} (${e.cause?.code || e.name}) — network/DNS/firewall?`); continue; }
    if (!r.ok) { problems++; console.log(`✖ ${name.padEnd(10)} ${explain(name, r, key)}`); continue; }
    const absent = wanted.filter((m) => !r.ids.includes(m));
    if (absent.length) { problems++; console.log(`⚠ ${name.padEnd(10)} key OK, but these active model ids are NOT available to it: ${absent.join(', ')}  (edit them in Admin → AI → Models)`); }
    else console.log(`✔ ${name.padEnd(10)} key accepted — ${wanted.length ? `all ${wanted.length} active model(s) available` : 'no active models use it'}`);

    if (PING) for (const m of wanted.filter((x) => r.ids.includes(x))) {
      try {
        const pr = await ping(name, key, p.base, m);
        console.log(`    ${pr.ok ? '✔' : '✖'} ping ${m}: ${pr.ok ? 'answered' : explain(name, pr, key)}`);
        if (!pr.ok) problems++;
      } catch (e) { problems++; console.log(`    ✖ ping ${m}: ${e.name}`); }
    }
  }
  console.log(problems ? `\n${problems} problem(s) found — fix the ✖/⚠ lines above, restart the backend, re-run.` : '\nAll configured providers look healthy.');
  process.exit(problems ? 1 : 0);
})();
