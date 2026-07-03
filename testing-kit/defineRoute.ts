// testing-kit · defineRoute — the un-forgettable authz-test mechanism.
//
// THE MECHANISM (stack-agnostic): make the route inventory a DATA STRUCTURE, and make the
// authz-test obligation a CONSTRUCTION-TIME invariant. A mutating route — or a read that can
// return another principal's data — cannot be *defined* without naming its standing authz test.
// The app won't boot with an unguarded route; forgetting is structurally impossible. The
// companion inventory test (authz-coverage.test.ts) then diffs the registry against the suite.
//
// `mutates` is an EXPLICIT flag, not a verb guess — a state-changing GET still trips it.
// `crossPrincipal` covers the read side: an endpoint returning another user's data needs the
// actor-B shape/4xx test just as much as a write does.
//
// STACK SEAM: only `mountRoutes` knows Express. For Fastify/Hono/Koa, rewrite that one function
// (and the RequestHandler type); the invariant lives in defineRoute and ports untouched. For a
// backend-less app, delete this file.

import { Router, type RequestHandler } from 'express';

export type HttpMethod = 'get' | 'post' | 'patch' | 'put' | 'delete';

export interface RouteDef {
  method: HttpMethod;
  path: string;
  /** State-changing route → the standing cross-user authz-test obligation (CONVENTIONS rule 4). */
  mutates: boolean;
  /** A read that can return ANOTHER principal's data → same obligation, read-shaped. */
  crossPrincipal?: boolean;
  /**
   * Stable id of the standing authz test guarding this route (e.g. 'authz:patch_me').
   * The test it names MUST hit this real route as actor-B and assert a 4xx (or the limited
   * shape, for cross-principal reads) — a name-match satisfied by a 200 is padding, and murr's
   * tripwire treats it as such.
   */
  authzTest?: string;
  /** Stable spec IDs this route serves (grep-traceability: spec ↔ route ↔ tests). */
  specIds: string[];
  handler: RequestHandler | RequestHandler[];
}

const registry: RouteDef[] = [];

export function defineRoute(def: RouteDef): RouteDef {
  if ((def.mutates || def.crossPrincipal) && !def.authzTest) {
    throw new Error(
      `defineRoute ${def.method.toUpperCase()} ${def.path}: a mutating/cross-principal route ` +
        `requires an authzTest id. The route inventory is the coverage check's source of truth — ` +
        `write the actor-B test, name it here, then define the route.`,
    );
  }
  registry.push(def);
  return def;
}

/** The queryable inventory — read by authz-coverage.test.ts and any future lint. */
export function getRouteRegistry(): readonly RouteDef[] {
  return registry;
}

/** Test-only: reset the in-memory registry between suites. */
export function clearRouteRegistry(): void {
  registry.length = 0;
}

/** The only Express-aware line in the mechanism — swap this for your framework. */
export function mountRoutes(defs: readonly RouteDef[]): Router {
  const router = Router();
  for (const def of defs) {
    const handlers = Array.isArray(def.handler) ? def.handler : [def.handler];
    router[def.method](def.path, ...handlers);
  }
  return router;
}
