# /discovery pipeline skill — Make the API Faster

No context given, so I'll systematically surface every high-leverage lever. Pick the ones that match your stack.

---

## 1. Diagnose First (Don't Guess)

```bash
# Where is time actually going?
curl -w "\n\ntime_namelookup: %{time_namelookup}
time_connect:      %{time_connect}
time_appconnect:   %{time_appconnect}
time_pretransfer:  %{time_pretransfer}
time_ttfb:         %{time_starttransfer}
time_total:        %{time_total}\n" \
-o /dev/null -s https://your-api/discovery
```

Profile **before** changing anything. The bottleneck is almost always one of:

| Layer | Typical Culprit |
|---|---|
| Network | No keep-alive, no HTTP/2, cold TLS |
| App server | Blocking I/O, thread starvation |
| Discovery logic | N+1 queries, serial fan-out |
| Data layer | Missing indexes, no cache |
| Serialization | Huge payloads, no compression |

---

## 2. Network / Transport Layer

```nginx
# nginx — enable HTTP/2 + keep-alive
listen 443 ssl http2;
keepalive_timeout 65;
keepalive_requests 1000;

# gzip responses
gzip on;
gzip_types application/json;
gzip_min_length 1024;
```

```python
# Client side — reuse connections (requests / httpx)
import httpx

# Bad  ❌ — new TCP+TLS handshake every call
requests.get("https://api/discovery")

# Good ✅ — persistent connection pool
client = httpx.Client(http2=True)
client.get("https://api/discovery")
```

---

## 3. Discovery Logic — Kill Serial Fan-Out

```python
# Bad ❌ — sequential source queries
results = []
for source in sources:
    results.append(query(source))   # each blocks

# Good ✅ — parallel async fan-out
import asyncio

async def discover():
    tasks = [async_query(src) for src in sources]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return [r for r in results if not isinstance(r, Exception)]
```

```go
// Go — parallel with bounded concurrency
sem := make(chan struct{}, 10) // max 10 in flight
var wg sync.WaitGroup
for _, src := range sources {
    wg.Add(1)
    go func(s Source) {
        defer wg.Done()
        sem <- struct{}{}
        defer func() { <-sem }()
        query(s)
    }(src)
}
wg.Wait()
```

---

## 4. Caching Strategy

```python
# Three-tier cache for discovery results

# Tier 1 — in-process (sub-ms)
from functools import lru_cache

@lru_cache(maxsize=512)
def get_static_topology(region: str): ...

# Tier 2 — Redis (1-5ms), short TTL for dynamic data
def discover(key: str):
    cached = redis.get(f"discovery:{key}")
    if cached:
        return deserialize(cached)           # fast path
    
    result = run_full_discovery(key)
    redis.setex(f"discovery:{key}", 30, serialize(result))  # 30s TTL
    return result

# Tier 3 — stale-while-revalidate pattern
# Return stale data immediately, refresh in background
def discover_swr(key: str):
    cached, age = redis.get_with_age(f"discovery:{key}")
    if cached:
        if age > 20:                         # getting stale
            background_task(refresh, key)    # async refresh
        return cached                        # always return immediately
    return run_full_discovery(key)
```

---

## 5. Database / Query Layer

```sql
-- Discovery queries typically filter by type, status, region
-- Make sure these indexes exist

CREATE INDEX CONCURRENTLY idx_services_discovery
  ON services (region, status, type)
  WHERE status = 'active';          -- partial index = smaller + faster

-- If you're doing full-text service name search
CREATE INDEX idx_services_name_trgm
  ON services USING gin (name gin_trgm_ops);
```

```python
# Bad ❌ — N+1: one query per discovered service
services = db.query("SELECT * FROM services WHERE region = ?", region)
for svc in services:
    svc.metadata = db.query("SELECT * FROM metadata WHERE id = ?", svc.id)

# Good ✅ — single JOIN or batch fetch
services = db.query("""
    SELECT s.*, m.*
    FROM services s
    LEFT JOIN metadata m ON m.service_id = s.id
    WHERE s.region = ? AND s.status = 'active'
""", region)
```

---

## 6. Response Shape — Send Less

```python
# Sparse fieldsets — only return what callers need
@app.get("/discovery")
def discovery(fields: str = "id,name,endpoint"):
    wanted = set(fields.split(","))
    results = run_discovery()
    return [{k: v for k, v in svc.items() if k in wanted}
            for svc in results]

# Pagination — never return unbounded lists
@app.get("/discovery")
def discovery(cursor: str = None, limit: int = 50):
    limit = min(limit, 200)          # cap it
    return paginate(run_discovery(), cursor, limit)
```

---

## 7. Streaming for Large Result Sets

```python
# Instead of buffering everything then sending:
from fastapi.responses import StreamingResponse
import json

async def stream_discovery():
    async for service in discover_incrementally():
        yield json.dumps(service) + "\n"   # NDJSON

@app.get("/discovery/stream")
def discovery_stream():
    return StreamingResponse(stream_discovery(),
                             media_type="application/x-ndjson")
```

---

## 8. Infrastructure Quick Wins

```yaml
# If running in Kubernetes — tune connection handling
resources:
  requests: { cpu: "500m", memory: "256Mi" }
  limits:   { cpu: "2",    memory: "512Mi" }

# Readiness probe — don't send traffic to cold pods
readinessProbe:
  httpGet: { path: /healthz, port: 8080 }
  initialDelaySeconds: 5
  periodSeconds: 5

# Horizontal scaling with KEDA or HPA on request rate
```

```python
# Uvicorn / Gunicorn — tune workers
# workers = (2 × CPU cores) + 1  for I/O bound
gunicorn app:app \
  --workers 9 \
  --worker-class uvicorn.workers.UvicornWorker \
  --keepalive 5 \
  --timeout 30
```

---

## 9. Observability — Know When You've Won

```python
from opentelemetry import trace
import time

tracer = trace.get_tracer("discovery")

async def discover(region: str):
    with tracer.start_as_current_span("discovery.run") as span:
        span.set_attribute("region", region)
        
        t0 = time.perf_counter()
        result = await _inner_discover(region)
        elapsed = time.perf_counter() - t0
        
        span.set_attribute("result.count", len(result))
        span.set_attribute("duration_ms", elapsed * 1000)
        
        # Emit histogram metric
        DISCOVERY_DURATION.observe(elapsed, {"region": region})
        return result
```

---

## Decision Tree

```
Slow API
├── > 500ms TTFB?
│   ├── Yes → check network (TLS, keep-alive, HTTP/2)
│   └── No  → problem is inside the app
├── Discovery hitting many sources?
│   └── Yes → parallelize with asyncio.gather / goroutines
├── Same queries repeated?
│   └── Yes → add Redis cache with stale-while-revalidate
├── DB queries slow?
│   └── Yes → EXPLAIN ANALYZE, add indexes, fix N+1
└── Huge responses?
    └── Yes → sparse fieldsets, pagination, compression
```

---

**Tell me your stack** (language, DB, infra, current p99 latency) and I'll make this concrete and specific.