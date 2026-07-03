// testing-kit · pg-harness — the real-database integration harness.
//
// THE MECHANISM: integration tests run against a THROWAWAY, containerized Postgres with the
// project's REAL migrations applied — never a mock, never a shared dev DB. Lifecycle:
// start container → mark disposable → migrate → (per test) reset → stop. Ownership-scoping, SQL
// correctness, transactions, and constraint races only prove out here.
//
// Usage (vitest/jest, one suite):
//
//   let db: StartedTestDb;
//   beforeAll(async () => {
//     db = await startTestDb({ migrate: () => import('../src/db/migrate').then(m => m.runMigrations()) });
//   }, 120_000);                     // container pull can be slow the first time — budget for it
//   afterAll(() => db.stop());
//   beforeEach(() => resetViaYourResetRunner());   // which itself calls assertDisposableDb()
//
// STACK SEAMS: swap PostgreSqlContainer for the mysql/mongo testcontainers module, or replace
// startTestDb's body with `docker run` + a ready-poll if you don't want the dependency; the
// contract (url · env marked disposable · migrations applied · stop()) is the mechanism.
// Requires: dev-deps `testcontainers` + `@testcontainers/postgresql`, Docker available.

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';

export interface StartTestDbOpts {
  /** Postgres image. Pin it — "latest" makes CI weather. */
  image?: string;
  /** The project's real migration runner. Runs after the container is up and env is set. */
  migrate?: () => Promise<unknown>;
  /** Extra env to set alongside DATABASE_URL/DISPOSABLE_DB (e.g. PGSSLMODE). */
  env?: Record<string, string>;
}

export interface StartedTestDb {
  url: string;
  container: StartedPostgreSqlContainer;
  stop(): Promise<void>;
}

export async function startTestDb(opts: StartTestDbOpts = {}): Promise<StartedTestDb> {
  const { image = 'postgres:16-alpine', migrate, env = {} } = opts;

  const container = await new PostgreSqlContainer(image).start();
  const url = container.getConnectionUri();

  // The harness marks its own DB disposable — this is the ONLY place that flag is set, and it is
  // what lets reset/truncate runners (guarded by assertDisposableDb) operate in tests.
  process.env.DATABASE_URL = url;
  process.env.DISPOSABLE_DB = '1';
  for (const [k, v] of Object.entries(env)) process.env[k] = v;

  if (migrate) await migrate();

  return {
    url,
    container,
    stop: async () => {
      await container.stop();
    },
  };
}
