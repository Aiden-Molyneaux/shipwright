// testing-kit · destructive-guard — fail-closed disposable-DB guard.
//
// THE MECHANISM: every destructive runner (reset, truncate, seed-fresh, migrate-drop) calls
// assertDisposableDb() FIRST — and the check is an ALLOWLIST, not a denylist. An operation is
// refused unless the target database is POSITIVELY marked disposable, so a leaked/injected
// production DATABASE_URL cannot be truncated from a test, a CI job, or an agent session:
// production creds structurally LACK the sentinel. (The agent is part of the threat model — a
// stray env var must not be unrecoverable.)
//
// Positive markers (either suffices):
//   1. DISPOSABLE_DB=1 (or "true") in the environment — set by the test harness itself.
//   2. The database NAME carries a disposable prefix/word: local_* · staging_* · test_* · *_test*.
//
// Verify the guard FIRES as part of your tooling-phase gate: point it at a fake "prod" URL and
// watch it throw. A guard nobody has seen fire is a hope, not a guard.

export interface DestructiveGuardEnv {
  DATABASE_URL?: string;
  DISPOSABLE_DB?: string;
}

export class DestructiveGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DestructiveGuardError';
  }
}

export function isDisposableDb(env: DestructiveGuardEnv = process.env): boolean {
  const flag = (env.DISPOSABLE_DB ?? '').toLowerCase();
  if (flag === '1' || flag === 'true') return true;

  const url = env.DATABASE_URL ?? '';
  // last path segment, sans query string → the database name
  const dbName = (url.split('/').pop() ?? '').split('?')[0] ?? '';
  return /^(local|staging|test)_/.test(dbName) || /(^|_)test(_|$)/.test(dbName);
}

/** Throws unless the target DB is positively marked disposable. Call FIRST in every destructive runner. */
export function assertDisposableDb(env: DestructiveGuardEnv = process.env): void {
  if (!isDisposableDb(env)) {
    throw new DestructiveGuardError(
      'Refusing a destructive DB operation — no disposable-DB marker (allowlist, not denylist). ' +
        'Set DISPOSABLE_DB=1, or use a local_/staging_/test_ database name, ONLY on a disposable ' +
        'database. Production credentials must structurally lack this marker.',
    );
  }
}
