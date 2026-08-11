export async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 20): Promise<T> {
  let last: unknown;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); } catch (e) {
      last = e;
      if (i === retries) break;
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw last instanceof Error ? last : new Error(String(last));
}
