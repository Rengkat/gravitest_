// Loads env files EXACTLY like the app does (src/app.module.ts):
//   `.env.<NODE_ENV>` first, then `.env` as the fallback; the first file that
//   defines a variable wins. `npm run start:dev` runs with NODE_ENV=development,
//   so `.env.development` OVERRIDES `.env` — editing only `.env` is a common trap.
// Values already set in the shell win over both files (dotenv never overrides).
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const NODE_ENV = process.env.NODE_ENV || 'development';
const candidates = [`.env.${NODE_ENV}`, '.env'].map((f) =>
  path.resolve(__dirname, '..', f),
);
const loaded = candidates.filter((f) => fs.existsSync(f));
dotenv.config({ path: loaded, quiet: true });

/** Trimmed value; blank counts as unset (same rule the app's config uses). */
const val = (name) => (process.env[name] ?? '').trim() || undefined;
/** Remove any occurrence of a secret from text before it is printed. */
const redact = (text, secrets) =>
  secrets
    .filter(Boolean)
    .reduce((t, s) => t.split(s).join('«redacted»'), String(text));

module.exports = {
  NODE_ENV,
  loaded: loaded.map((f) => path.basename(f)),
  val,
  redact,
};
