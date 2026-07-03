// testing-kit · concurrency — the race harness.
//
// THE MECHANISM: any "can only happen once" invariant (a unique constraint, a spend, a claim, a
// register) is only proven by firing N identical operations IN PARALLEL against a REAL database
// and asserting exactly one winner with friendly losers. Sequential tests cannot catch
// check-then-act races; mocked repos cannot catch them either — the constraint/transaction IS
// the thing under test. Standing usage (from the reference project's suite):
//
//   const results = await race(6, () => addEntry(token, gameId));
//   expectOneWinner(results, { winner: 201 });          // one 201, five 4xx, zero 500s
//
// Assertion-library-agnostic: expectOneWinner throws plain Errors, so it works under
// vitest/jest/node:test unchanged.

/** Fire `n` invocations of `op` truly concurrently; settle them all (rejections become throws). */
export async function race<T>(n: number, op: (i: number) => Promise<T>): Promise<T[]> {
  return Promise.all(Array.from({ length: n }, (_, i) => op(i)));
}

export interface StatusLike {
  status: number;
}

export function byStatus(results: StatusLike[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const r of results) m.set(r.status, (m.get(r.status) ?? 0) + 1);
  return m;
}

export interface OneWinnerOpts {
  /** The success status exactly one call must return. Default 201. */
  winner?: number;
  /** Losers must fall in this inclusive range — friendly refusals, never crashes. Default 400–499. */
  loserMin?: number;
  loserMax?: number;
}

/**
 * Assert the race invariant: EXACTLY ONE winner; every other result a friendly loser (typed 4xx);
 * and — the part that catches real bugs — ZERO 500s: the race loser must be a handled refusal,
 * not an unhandled constraint explosion.
 */
export function expectOneWinner(results: StatusLike[], opts: OneWinnerOpts = {}): void {
  const { winner = 201, loserMin = 400, loserMax = 499 } = opts;
  const counts = byStatus(results);
  const summary = [...counts.entries()].map(([s, c]) => `${c}×${s}`).join(', ');

  const winners = results.filter((r) => r.status === winner).length;
  if (winners !== 1) throw new Error(`race: expected exactly one ${winner}, got ${winners} (${summary})`);

  const bad = results.filter((r) => r.status !== winner && (r.status < loserMin || r.status > loserMax));
  if (bad.length > 0)
    throw new Error(
      `race: ${bad.length} loser(s) outside ${loserMin}–${loserMax} (${summary}) — a race loser ` +
        `must be a handled, typed refusal, never a 500.`,
    );
}

/** Idempotency variant: EVERY call succeeds and the end-state count is 1 (e.g. notify toggles). */
export function expectAllIdempotent(results: StatusLike[], okStatus = 200): void {
  const counts = byStatus(results);
  const summary = [...counts.entries()].map(([s, c]) => `${c}×${s}`).join(', ');
  if (results.some((r) => r.status !== okStatus))
    throw new Error(`race(idempotent): expected all ${okStatus}, got ${summary}`);
}
