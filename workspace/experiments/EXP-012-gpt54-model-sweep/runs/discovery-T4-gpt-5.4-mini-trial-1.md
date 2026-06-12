To make the API faster, I’d approach it in this order:

1. **Measure first**
   - Add request timing, DB timing, cache hit rate, and external dependency latency.
   - Identify the top slow endpoints and the 95th/99th percentile offenders.

2. **Cut avoidable work**
   - Remove redundant queries and duplicate serialization.
   - Avoid loading fields/data you don’t return.
   - Short-circuit early on validation/auth failures.

3. **Optimize database access**
   - Add missing indexes for common filters/joins/sorts.
   - Fix N+1 query patterns.
   - Use pagination and limit result sizes.
   - Select only needed columns.
   - Consider query plan review for slow SQL.

4. **Add caching**
   - Cache expensive, frequently requested responses.
   - Use read-through caching for reference data.
   - Cache computed aggregates where freshness can tolerate it.
   - Add HTTP caching headers if applicable.

5. **Reduce external latency**
   - Batch downstream calls.
   - Add timeouts and retries with backoff.
   - Parallelize independent I/O.
   - Cache third-party lookups where possible.

6. **Tune the app/runtime**
   - Enable connection pooling.
   - Reuse HTTP clients.
   - Increase worker/process counts appropriately.
   - Check GC/memory pressure and payload sizes.

7. **Trim payloads**
   - Return less data by default.
   - Support field selection/compression.
   - Use gzip/brotli where suitable.

8. **Scale smartly**
   - Add horizontal replicas if bottleneck is CPU-bound or concurrency-limited.
   - Put a load balancer in front and verify autoscaling thresholds.

If you want, I can turn this into a **prioritized investigation plan** or a **concrete checklist for your specific stack**.