# /discovery pipeline skill

## Analyzing the Problem Space

You've given me a deliberately vague directive. Let me surface the right questions before touching anything.

---

## What I Need to Know First

```
"Make the API faster" is not a task. It's a direction.
Without measurement, you're guessing.
```

### The Discovery Questions

**1. Faster than what? (Baseline)**
- Do you have current p50/p95/p99 latency numbers?
- Is there a performance budget (e.g., "must be under 200ms")?
- Is this user-perceived slowness or a metric regression?

**2. Which API? Which endpoints?**
- All endpoints equally slow, or specific ones?
- Read vs. write paths?
- Authenticated vs. public routes?

**3. Under what conditions?**
- Slow at all times, or under load?
- Specific payload sizes?
- Specific regions/clients?

**4. What does the stack look like?**
- Language/framework?
- DB layer (ORM queries? N+1? missing indexes?)
- Caching layer present?
- Sync vs. async I/O?
- Any external service calls in the hot path?

---

## The Diagnostic Framework I'd Run

```
Latency = compute time + I/O wait + serialization + network + queue time
```

Pick the biggest slice. That's where you work first.

### Phase 1 — Instrument Before Touching Anything

```python
# If you don't have this, add it today
@app.middleware
def trace_request(request, next):
    start = time.perf_counter()
    response = next(request)
    duration = time.perf_counter() - start
    
    log.info({
        "endpoint": request.path,
        "method":   request.method,
        "status":   response.status_code,
        "duration_ms": duration * 1000,
        "db_query_count": g.query_count,  # ← this one matters
    })
```

**You want to see:**
- Latency distribution per endpoint
- DB query count per request (N+1 will show up immediately)
- External call durations
- Memory/CPU during slow periods

---

### Phase 2 — Common Culprits, Ranked by Frequency

| Culprit | Signal | Fix |
|---|---|---|
| **N+1 queries** | High query count per request | Eager load / join |
| **Missing DB index** | Slow queries in DB logs | `EXPLAIN ANALYZE`, add index |
| **Synchronous external calls** | Thread blocked on HTTP/RPC | Async, parallelize, cache |
| **Over-fetching** | Large payloads, SELECT * | Projection, pagination |
| **No caching** | Identical queries repeated | Redis/in-memory cache |
| **Serialization cost** | CPU-bound, fast DB but slow response | orjson, MessagePack, schema review |
| **Connection pool exhaustion** | Latency spikes under load | Pool sizing, connection reuse |
| **GIL / single-threaded** | CPU-bound at scale | Worker processes, async I/O |

---

### Phase 3 — The Questions That Unlock 80% of Fixes

```
1. Run EXPLAIN ANALYZE on your 5 slowest queries.
   → Missing index? You're done in 10 minutes.

2. Log query count per request for 1 hour.
   → Anything above 10 queries for a single GET is suspicious.

3. Add a /health or /metrics endpoint if you don't have one.
   → Gives you a synthetic canary.

4. Check if external HTTP calls are in the critical path.
   → If yes: parallelize with asyncio.gather() or Promise.all()
```

---

## What I'd Ask You Right Now

```
┌─────────────────────────────────────────────────┐
│  1. What's the current p95 latency?             │
│  2. What's the stack? (lang, DB, framework)     │
│  3. Do you have query-level or trace-level logs?│
│  4. Is this a throughput or latency problem?    │
└─────────────────────────────────────────────────┘
```

---

## What I Won't Do

I won't give you a list of generic tips like *"add caching"* or *"use a CDN"* without knowing where your time is actually going.

**Premature optimization = shipping the wrong fix with confidence.**

---

**Give me the stack, a slow endpoint, and a latency number — and I'll give you a specific, ordered action plan.**