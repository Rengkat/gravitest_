import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Request scope bubbles up the dependency tree: one provider injecting REQUEST
 * makes every service that depends on it request-scoped, and @nestjs/schedule
 * (cron) and @nestjs/event-emitter (@OnEvent) both skip request-scoped
 * providers. That is how renewals and payment-success handlers silently stop
 * working. This test fails the build if REQUEST injection or Scope.REQUEST
 * appears anywhere outside the allow-list.
 */
const ALLOWED: string[] = [];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (full.endsWith('.ts') && !full.endsWith('.spec.ts')) out.push(full);
  }
  return out;
}

describe('no request-scoped providers', () => {
  it('nothing injects REQUEST or declares Scope.REQUEST', () => {
    const root = join(__dirname, '..', '..');
    const offenders = walk(root).filter((f) => {
      if (ALLOWED.some((a) => f.endsWith(a))) return false;
      // Ignore comments: explaining the rule must not trip the rule.
      const src = readFileSync(f, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');
      return /@Inject\(\s*REQUEST\s*\)|Scope\.REQUEST|scope:\s*Scope\.(REQUEST|TRANSIENT)/.test(src);
    });
    expect(offenders).toEqual([]);
  });
});
