// testing-kit · authz-coverage — the inventory-vs-suite diff (TEMPLATE — adjust the two paths).
//
// defineRoute guarantees every mutating/cross-principal route NAMES an authz test; this suite
// guarantees the named test EXISTS. Together: you can't boot with an unguarded route, and you
// can't merge with a phantom guard. What neither can prove mechanically is that the named test
// is HONEST — that it hits the real route as actor-B and asserts the 4xx / limited shape, rather
// than name-matching around a 200. That last mile is murr's anti-padding tripwire and the
// convention below (each authz id appears inside a describe/it that makes the actor-B call).
//
// Convention: the authzTest id string (e.g. 'authz:patch_me') appears VERBATIM in the test title
// of the test that performs the actor-B assertion:
//   it('authz:patch_me — actor B PATCHing actor A → 404, row untouched (SYS-07)', …)

import { describe, it, expect, beforeAll } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// ── adjust these two to your layout ─────────────────────────────────────────
import { getRouteRegistry } from '../src/http/defineRoute'; // the inventory
const TEST_DIRS = [join(__dirname, '.')]; //                    where the suites live
import '../src/http/routes'; //                                 side-effect: registers every route
// ─────────────────────────────────────────────────────────────────────────────

function allTestSource(dirs: string[]): string {
  let out = '';
  const walk = (d: string) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(test|spec)\.[jt]sx?$/.test(f)) out += readFileSync(p, 'utf8');
    }
  };
  dirs.forEach(walk);
  return out;
}

describe('authz coverage: the route inventory vs the suite', () => {
  let suiteSource = '';
  beforeAll(() => {
    suiteSource = allTestSource(TEST_DIRS);
  });

  it('every mutating/cross-principal route names an authzTest (construction already enforces this — this is the receipt)', () => {
    const unguarded = getRouteRegistry().filter(
      (r) => (r.mutates || r.crossPrincipal) && !r.authzTest,
    );
    expect(unguarded).toEqual([]);
  });

  it('every named authzTest id appears in the suite (no phantom guards)', () => {
    const missing = getRouteRegistry()
      .filter((r) => r.authzTest)
      .filter((r) => !suiteSource.includes(r.authzTest as string))
      .map((r) => `${r.method.toUpperCase()} ${r.path} → ${r.authzTest}`);
    expect(missing).toEqual([]);
  });

  it('inventory sanity: registered route count is nonzero (the import side-effect worked)', () => {
    expect(getRouteRegistry().length).toBeGreaterThan(0);
  });
});
