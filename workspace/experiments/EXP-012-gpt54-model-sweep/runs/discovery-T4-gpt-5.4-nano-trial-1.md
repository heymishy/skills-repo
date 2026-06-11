To make the **/discovery** pipeline skill faster, I need a bit more context—right now you only provided “Make the API faster” with no details about what you’re running, what “/discovery” calls, or what the current bottlenecks are.

Please paste:
1) The **current /discovery pipeline** configuration/inputs (or the code snippet)  
2) Any **logs/trace** showing where time is spent (e.g., slow steps, timeouts, number of calls)  
3) Expected output format and typical **request size** (how many items/entities it processes)  
4) Whether you can change infrastructure (caching, parallelism, database indexes, CDN, etc.)

Meanwhile, here are the most common high-impact changes for discovery-style APIs:

### Fast wins (usually safe)
- **Parallelize independent calls**: run I/O-bound subtasks concurrently (e.g., fetching metadata, enrichment, indexing).
- **Reduce round trips**: batch requests to downstream services instead of per-item calls.
- **Add caching**:
  - Cache discovery results (short TTL) keyed by request parameters.
  - Cache stable reference data (schemas, static catalogs).
- **Early exit / limit scope**: avoid full scans—apply filters early and cap “max results” or depth.
- **Use streaming where possible**: return partial results sooner instead of waiting for the full pipeline.

### Backend/index wins
- **Database indexing** on the fields used for filtering/joining/sorting.
- **Avoid N+1 queries**: prefetch/join instead of per-record lookups.
- **Tune query plans** (explain plans) and reduce large intermediate result sets.

### API-level wins
- **Connection reuse**: keep-alive for HTTP calls to downstream services.
- **Compression**: enable gzip/brotli if responses are large.
- **Request validation up front** to fail fast before heavy work.

---

If you paste your **/discovery pipeline skill** definition/code + one example request and timing breakdown, I can give you a concrete set of edits (often 2–5 changes) to cut latency significantly.