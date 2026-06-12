# /discovery Pipeline Skill — Making the API Faster

Let me work through this systematically, since "make the API faster" with no other context requires me to **discover the problem space first**, then act.

---

## Phase 1: Discover Before Optimizing

> *"Premature optimization is the root of all evil."* — Knuth
> The corollary: **blind optimization is worse.**

### What I need to know before touching anything:

```
┌─────────────────────────────────────────────────────┐
│  WHERE IS THE ACTUAL BOTTLENECK?                    │
│                                                     │
│  [ ] Network I/O        [ ] Database queries        │
│  [ ] Compute/CPU        [ ] Memory pressure         │
│  [ ] External API calls [ ] Serialization           │
│  [ ] Cold starts        [ ] Lock contention         │
└─────────────────────────────────────────────────────┘
```

---

## Phase 2: The Discovery Checklist

### 2.1 — Measure First

```bash
# What does the latency distribution look like?
# p50? p95? p99? Are you optimizing the median or the tail?

curl -w "@curl-format.txt" -o /dev/null -s https://api.example.com/discovery

# Expected output:
#   time_namelookup:  0.004s
#   time_connect:     0.012s
#   time_appconnect:  0.034s   ← TLS handshake worth fixing?
#   time_pretransfer: 0.034s
#   time_redirect:    0.000s
#   time_starttransfer: 0.287s ← TTFB — is this the problem?
#   time_total:       1.432s   ← Is payload transfer the problem?
```

### 2.2 — Instrument the Pipeline

```python
# Add timing spans at each stage
import time
from contextlib import contextmanager

@contextmanager
def span(name: str):
    t0 = time.perf_counter()
    yield
    elapsed = (time.perf_counter() - t0) * 1000
    print(f"[SPAN] {name}: {elapsed:.2f}ms")

async def discovery_pipeline(query):
    with span("auth"):          token = await verify_token()
    with span("parse"):         params = parse_query(query)
    with span("db_lookup"):     candidates = await db.find(params)
    with span("score"):         ranked = rank(candidates)
    with span("enrich"):        enriched = await enrich(ranked)
    with span("serialize"):     return serialize(enriched)

# → Find which span is eating time BEFORE touching code
```

---

## Phase 3: The Most Common Culprits (in order of frequency)

### 🔴 #1 — Serial I/O that should be parallel

```python
# SLOW: Sequential awaits
async def enrich(items):
    results = []
    for item in items:
        data = await fetch_metadata(item)   # waits for each
        results.append(data)
    return results

# FAST: Concurrent I/O
async def enrich(items):
    return await asyncio.gather(
        *[fetch_metadata(item) for item in items]
    )
    # If N=20 items each take 100ms:
    # Before: 2000ms  →  After: ~100ms
```

### 🔴 #2 — Missing database indexes

```sql
-- Check what the query planner is actually doing
EXPLAIN ANALYZE
  SELECT * FROM discoveries
  WHERE pipeline_id = $1
    AND status = 'active'
  ORDER BY score DESC
  LIMIT 50;

-- If you see "Seq Scan" on a large table → you need an index
-- Seq Scan on discoveries (rows=2847291) → BAD

CREATE INDEX CONCURRENTLY idx_discoveries_pipeline_status_score
  ON discoveries(pipeline_id, status, score DESC);

-- "Index Scan" (rows=50) → GOOD
```

### 🔴 #3 — No caching on repeated work

```python
from functools import lru_cache
import redis

# In-process cache for hot, static data
@lru_cache(maxsize=1024)
def get_pipeline_config(pipeline_id: str):
    return db.fetch_config(pipeline_id)

# Distributed cache for shared, semi-static data
class DiscoveryCache:
    def __init__(self, redis_client, ttl=300):
        self.r = redis_client
        self.ttl = ttl

    async def get_or_compute(self, key, compute_fn):
        cached = await self.r.get(key)
        if cached:
            return deserialize(cached)          # ~0.5ms

        result = await compute_fn()             # ~200ms
        await self.r.setex(key, self.ttl, serialize(result))
        return result
```

### 🔴 #4 — Over-fetching data (N+1 queries)

```python
# SLOW: N+1 problem
pipelines = db.query("SELECT * FROM pipelines WHERE active=true")
for p in pipelines:
    p.stages = db.query(f"SELECT * FROM stages WHERE pipeline_id={p.id}")
    # 1 query + N queries = terrible

# FAST: Single join or batch fetch
pipelines = db.query("""
    SELECT p.*, json_agg(s.*) as stages
    FROM pipelines p
    LEFT JOIN stages s ON s.pipeline_id = p.id
    WHERE p.active = true
    GROUP BY p.id
""")
```

### 🔴 #5 — Payload bloat

```python
# Are you sending fields the client never uses?

# SLOW: Return everything
return {
    "id": ..., "name": ..., "score": ...,
    "raw_embedding": [...],      # 1536 floats nobody asked for
    "full_document": "...",      # 50KB of text
    "audit_log": [...],          # 200 history entries
    "internal_metadata": {...},  # debug fields
}

# FAST: Sparse fieldsets
class DiscoveryResponse(BaseModel):
    id: str
    name: str
    score: float
    # Everything else: opt-in via ?fields=

# Also: enable compression
# gzip/brotli on text responses easily cuts 70-90% of payload size
```

### 🔴 #6 — Connection pool exhaustion

```python
# Are requests queuing waiting for a DB connection?

# Check: log pool wait time
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,          # default is often 5 — too small
    max_overflow=10,
    pool_timeout=30,
    pool_pre_ping=True,    # detect stale connections
)

# Monitor:
# SELECT count(*), state
# FROM pg_stat_activity
# WHERE datname = 'discovery'
# GROUP BY state;
# → If "idle in transaction" is high, you have a leak
# → If "active" > pool_size, you have contention
```

---

## Phase 4: Quick Wins Checklist

```
INFRASTRUCTURE (no code changes)
─────────────────────────────────────────────────────
[ ] Enable HTTP/2 (multiplexing, header compression)
[ ] Move CDN/edge closer to users
[ ] Enable TLS session resumption
[ ] Tune TCP: tcp_nodelay, keepalives
[ ] Right-size instances (CPU-bound? add cores. IO-bound? more concurrency)

DATABASE
─────────────────────────────────────────────────────
[ ] Add missing indexes (run EXPLAIN ANALYZE on slow queries)
[ ] Analyze table statistics (ANALYZE tablename)
[ ] Increase work_mem for sort-heavy queries
[ ] Use connection pooling (PgBouncer if on Postgres)
[ ] Read replicas for read-heavy workloads

APPLICATION
─────────────────────────────────────────────────────
[ ] Parallelize independent I/O operations
[ ] Add caching layer (Redis) with appropriate TTLs
[ ] Implement pagination (never return unbounded results)
[ ] Use streaming responses for large payloads
[ ] Move heavy work to background jobs (respond fast, process async)
[ ] Enable response compression (gzip/brotli)
[ ] Keep-alive connections to downstream services

CODE
─────────────────────────────────────────────────────
[ ] Fix N+1 query patterns
[ ] Use bulk/batch APIs instead of loops of single calls
[ ] Lazy-load data you might not need
[ ] Profile hot paths (py-spy, async-profiler, pprof)
```

---

## Phase 5: How to Respond to This Ticket Correctly

Here's the honest answer about the original request:

```
"Make the API faster"
       ↓
This is a goal, not a task.

Without knowing:
  • Current p50/p95/p99 latency
  • Target latency
  • Where time is being spent
  • Traffic patterns
  • Tech stack

...any changes made are guesses.

The first PR should be:
  → Add distributed tracing (OpenTelemetry)
  → Ship to staging
  → Run load test (k6, Locust, wrk)
  → Read the flame graph
  → THEN optimize the thing on fire
```

---

## Recommended First Action

```bash
# If you have nothing else, start here:

# 1. Add this to every request handler
import opentelemetry  # or your preferred tracer

# 2. Run a realistic load test
k6 run --vus 50 --duration 60s discovery_load_test.js

# 3. Look at the results and come back with:
#    "The bottleneck is [X], it takes [Y]ms, 
#     it's called [Z] times per request"

# THAT is when optimization becomes engineering
# instead of folklore
```

---

**TL;DR**: I won't make random changes to make an API "faster." I'll instrument it, measure it, find the actual bottleneck, and fix *that*. Tell me what you're seeing and I'll go deep on the specific problem.