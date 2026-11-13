/**
 * Run `worker` over `items` with at most `limit` in flight.
 * Preserves input order in the returned array. Worker errors should be
 * handled inside the worker (return an error object) so one failure
 * doesn't abort the whole batch.
 */
async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(runners);
  return results;
}

module.exports = { mapLimit };
