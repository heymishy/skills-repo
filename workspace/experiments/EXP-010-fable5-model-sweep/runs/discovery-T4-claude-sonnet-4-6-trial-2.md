# Discovery Pipeline: Make the API Faster

Since I have no codebase, I'll work the problem systematically — diagnosing likely bottlenecks and prescribing concrete fixes.

---

## Step 1: Instrument First

Before changing anything:

```bash
# Add timing middleware to every request
# Find the actual slow path — don't guess
```

```python
import time
import logging

@app.middleware("http")
async def add_timing(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = time.perf_counter() - start
    response.headers["X-Response-Time"] = str(elapsed)
    logging.info(f"{request.method} {request.url.path} → {elapsed:.3f}s")
    return response
```

**Run this in staging for 10 minutes. Look at the p50, p95, p99.**

---

## Step 2: Diagnose — The Usual Suspects

For a discovery pipeline specifically, the bottlenecks are almost always one of these:

```
[ DB query ]  →  [ external service call ]  →  [ serial fan-out ]  →  [ N+1 queries ]
     ^                     ^                          ^                      ^
  most likely           second most              third                  fourth
```

### Check each:

```python
# 1. Are you doing N+1 queries?
#    Symptom: slow when result set grows
#    Evidence: query count scales with result count

# 2. Are discovery calls serial when they could be parallel?
#    Symptom: latency = sum(all_service_latencies)
#    Evidence: trace shows sequential spans

# 3. Are you re-fetching things that don't change?
#    Symptom: same queries on every request
#    Evidence: cache miss rate = 100%

# 4. Are you loading full objects when you need 2 fields?
#    Symptom: large payloads, slow serialization
#    Evidence: SELECT * everywhere
```

---

## Step 3: The Fixes (Ordered by Impact/Effort)

### Fix 1 — Parallelize Discovery Fan-out (High impact, low effort)

```python
# BEFORE: serial — latency = A + B + C + D
results = []
results.append(discover_service_a(query))
results.append(discover_service_b(query))
results.append(discover_service_c(query))
results.append(discover_service_d(query))

# AFTER: parallel — latency = max(A, B, C, D)
import asyncio

async def run_discovery(query):
    results = await asyncio.gather(
        discover_service_a(query),
        discover_service_b(query),
        discover_service_c(query),
        discover_service_d(query),
        return_exceptions=True  # don't let one failure kill others
    )
    return [r for r in results if not isinstance(r, Exception)]
```

**Typical gain: 3–10x on fan-out heavy pipelines.**

---

### Fix 2 — Cache Aggressively at the Right Layer

```python
from functools import lru_cache
import redis

# For in-process, short-lived cache (< 1s overhead, zero network)
@lru_cache(maxsize=1024)
def get_discovery_config(namespace: str) -> dict:
    return db.fetch_config(namespace)

# For shared cache across instances
redis_client = redis.Redis(connection_pool=redis.ConnectionPool(
    host='localhost', max_connections=20
))

async def get_registry_entry(service_id: str):
    cache_key = f"discovery:registry:{service_id}"
    
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    
    entry = await db.fetch_registry_entry(service_id)
    redis_client.setex(cache_key, 30, json.dumps(entry))  # 30s TTL
    return entry
```

**What to cache in a discovery pipeline:**
- Service registry entries (change rarely)
- Resolved endpoints (change on deploy)
- Health check results (with short TTL)
- Auth tokens (until expiry)

---

### Fix 3 — Fix N+1 Queries

```python
# BEFORE: 1 query to get services + N queries to get metadata
services = db.query("SELECT id FROM services WHERE namespace = ?", ns)
for service in services:
    service.metadata = db.query("SELECT * FROM metadata WHERE service_id = ?", 
                                 service.id)  # N queries!

# AFTER: 2 queries total, or 1 with JOIN
services = db.query("SELECT id FROM services WHERE namespace = ?", ns)
service_ids = [s.id for s in services]

# Batch fetch
metadata = db.query(
    "SELECT * FROM metadata WHERE service_id = ANY(?)", 
    service_ids
)
metadata_by_id = {m.service_id: m for m in metadata}

for service in services:
    service.metadata = metadata_by_id.get(service.id)
```

---

### Fix 4 — Add a Connection Pool (if missing)

```python
# BEFORE: new connection per request (expensive!)
def query_registry(sql):
    conn = psycopg2.connect(DATABASE_URL)  # ~50ms overhead
    result = conn.execute(sql)
    conn.close()
    return result

# AFTER: pool (connection reuse)
from psycopg2 import pool

connection_pool = pool.ThreadedConnectionPool(
    minconn=5,
    maxconn=20,
    dsn=DATABASE_URL
)

def query_registry(sql):
    conn = connection_pool.getconn()
    try:
        result = conn.execute(sql)
        return result
    finally:
        connection_pool.putconn(conn)
```

**Also applies to HTTP clients — reuse sessions:**

```python
# Module-level, not per-request
import httpx
_client = httpx.AsyncClient(
    limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
    timeout=httpx.Timeout(5.0)
)
```

---

### Fix 5 — Paginate and Stream Large Result Sets

```python
# BEFORE: load everything, then respond
@app.get("/discovery/all")
async def get_all():
    results = await db.fetch_all_services()  # 50,000 rows, 2GB RAM
    return {"services": results}

# AFTER: paginate
@app.get("/discovery/services")
async def get_services(cursor: str = None, limit: int = 100):
    results = await db.fetch_services(after_cursor=cursor, limit=limit)
    return {
        "services": results,
        "next_cursor": results[-1].id if len(results) == limit else None
    }

# OR: stream
@app.get("/discovery/services/stream")
async def stream_services():
    async def generate():
        async for service in db.iter_services():
            yield json.dumps(service) + "\n"
    
    return StreamingResponse(generate(), media_type="application/x-ndjson")
```

---

### Fix 6 — Reduce Payload Size

```python
# BEFORE: return everything
return service.to_dict()  # 40 fields, 3KB per object

# AFTER: return only what callers actually use
@app.get("/discovery/services/{id}")
async def get_service(id: str, fields: str = None):
    service = await get_service_by_id(id)
    
    if fields:
        requested = set(fields.split(","))
        return {k: v for k, v in service.items() if k in requested}
    
    # Default: sparse representation
    return {
        "id": service["id"],
        "endpoint": service["endpoint"],
        "health": service["health"],
        "version": service["version"],
    }
```

---

### Fix 7 — Add HTTP Caching Headers

```python
from fastapi import Response
from hashlib import md5

@app.get("/discovery/registry")
async def get_registry(response: Response):
    data = await build_registry()
    
    etag = md5(json.dumps(data).encode()).hexdigest()
    response.headers["ETag"] = etag
    response.headers["Cache-Control"] = "public, max-age=10"  # 10s CDN cache
    
    return data
```

---

## Step 4: Quick Wins Checklist

```
[ ] Enable gzip compression on responses
[ ] Add database indexes on discovery query columns
[ ] Move to async I/O throughout (no blocking calls in async handlers)
[ ] Set appropriate timeouts everywhere (no infinite waits)
[ ] Use HTTP/2 if multiple requests go to same upstream
[ ] Profile with py-spy or async-profiler — confirm your fix actually helps
```

```python
# Are you blocking the event loop?
import asyncio

# BAD — blocks all other requests while this runs
@app.get("/discovery")
async def discover():
    result = requests.get(upstream_url)  # sync HTTP in async handler!
    return result

# GOOD
@app.get("/discovery")  
async def discover():
    async with httpx.AsyncClient() as client:
        result = await client.get(upstream_url)
    return result.json()
```

---

## Step 5: Measure the Result

```python
# Before and after — compare these numbers:
# - p50 latency
# - p95 latency  
# - p99 latency
# - requests/second at saturation
# - DB query count per request
# - Cache hit rate

# Simple load test:
# wrk -t12 -c400 -d30s http://localhost:8000/discovery/services
# or: hey -n 10000 -c 100 http://localhost:8000/discovery/services
```

---

## Summary: Do These in Order

| Priority | Fix | Expected Gain |
|---|---|---|
| 1 | Instrument — find actual bottleneck | N/A |
| 2 | Parallelize fan-out calls | 3–10x |
| 3 | Fix N+1 queries | 2–50x |
| 4 | Add connection pooling | 2–5x |
| 5 | Cache registry/config data | 5–100x (on cache hits) |
| 6 | Reduce payload size | 1.5–3x |
| 7 | HTTP caching headers | 10–100x (at edge) |

**The single most important thing:** measure first, then fix the actual bottleneck. The worst outcome is spending a week optimizing serialization when the problem is serial HTTP calls.

---

**Want me to go deeper on any specific fix, or do you have traces/query plans/profiler output I can analyze directly?**