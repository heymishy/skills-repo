To make the **/discovery** pipeline faster, you should focus on reducing total I/O, cutting sequential steps, shrinking the search space, and parallelizing independent work. Here are the most common high-impact changes (in priority order):

1. **Avoid re-scanning / re-fetching**
   - Cache discovery results (per run or long-lived).
   - Use conditional requests (ETags/If-Modified-Since) where applicable.
   - Deduplicate input targets before processing.

2. **Parallelize independent stages**
   - Run per-target work concurrently (bounded concurrency).
   - Parallelize external calls (HTTP, DB queries) with a worker pool.
   - Ensure you’re not blocking on sequential awaits where parallelism is safe.

3. **Reduce payload size and number of calls**
   - Request only required fields (“select” / “projection”).
   - Prefer bulk endpoints over N small calls (batch APIs).
   - Compress responses if supported (gzip/deflate).

4. **Short-circuit early**
   - If a target is already “known”/unchanged, skip deep discovery.
   - Add thresholds/timeouts so slow branches don’t stall the whole run.
   - Stop scanning once required evidence is found.

5. **Tune discovery heuristics to shrink the search space**
   - Apply filtering rules early (cheap predicates first).
   - Limit recursion depth / max fan-out.
   - Use sampling or staged discovery (quick pass → deep pass only for matches).

6. **Optimize database queries (if it hits DB)**
   - Add/verify indexes on the fields used for filtering/joining.
   - Avoid N+1 query patterns; use joins/batches.
   - Stream large result sets instead of loading everything.

7. **Improve concurrency + backpressure**
   - Use bounded queues; don’t spawn unbounded tasks.
   - Respect rate limits; implement exponential backoff without serial bottlenecks.
   - Add backpressure so slow downstream services don’t blow up memory.

8. **Upgrade and profile**
   - Turn on tracing/profiling to identify the true bottleneck (network vs CPU vs DB).
   - Reduce CPU-heavy parsing/transformations (or move to compiled/optimized paths).

---

### If you want, paste:
- the high-level steps in your `/discovery` pipeline,
- typical target count,
- where it spends time (network/DB/CPU),
- and any logs/metrics (p50/p95 latency, error rates),

…and I’ll suggest a concrete set of changes (including concurrency settings and where to add caching/short-circuiting) tailored to your pipeline.