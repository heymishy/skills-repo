# /discovery pipeline skill — Make the API Faster

No context provided, so I'll run a structured discovery: surface every meaningful lever, ranked by impact, with concrete actions.

---

## Phase 1: Diagnose Before Optimizing

**The cardinal rule:** You cannot optimize what you haven't measured.

```
Before touching any code, answer these:

1. What is "slow"? (p50? p95? p99? absolute ms?)
2. Where is the time going? (network, compute, DB, serialization, I/O wait?)
3. Which endpoints / call paths are slow?
4. What is the traffic shape? (bursty? steady? read-heavy? write-heavy?)
```

---

## Phase 2: The Diagnostic Stack

Run these first — they tell you where to go.

```bash
# 1. Get a latency baseline per endpoint
# (replace with your APM tool: Datadog, New Relic, Grafana, etc.)
SELECT endpoint, 
       percentile(duration_ms, 50)  AS p50,
       percentile(duration_ms, 95)  AS p95,
       percentile(duration_ms, 99)  AS p99,
       count(*)                     AS req_count
FROM   request_logs
WHERE  timestamp > now() - interval '1 hour'
GROUP  BY endpoint
ORDER  BY p95 DESC;

# 2. Find the top slow traces
# Look for: DB queries, external calls, serialization, lock contention
```

---

## Phase 3: Optimization Levers (Ranked by ROI)

### 🔴 Tier 1 — Highest Impact, Often Overlooked

#### A. N+1 Query Problem
```python
# BAD — fires 1 + N queries
orders = Order.query.all()
for order in orders:
    print(order.user.name)   # ← query per row

# GOOD — 2 queries total
orders = Order.query.options(joinedload(Order.user)).all()

# BETTER — 1 query with JOIN when fields are known
orders = db.session.query(Order, User)\
           .join(User, Order.user_id == User.id)\
           .all()
```

#### B. Missing Indexes
```sql
-- Find slow queries (Postgres)
SELECT query, mean_exec_time, calls
FROM   pg_stat_statements
ORDER  BY mean_exec_time DESC
LIMIT  20;

-- Check if index exists / is being used
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM orders WHERE user_id = 123 AND status = 'pending';

-- Add the index
CREATE INDEX CONCURRENTLY idx_orders_user_status 
ON orders(user_id, status);
--          ^^^^^^^^^^^^^^ composite: match your WHERE + ORDER BY
```

#### C. Synchronous calls that should be async
```python
# BAD — user waits for email to send
def create_order(data):
    order = save_order(data)
    send_confirmation_email(order)   # ← blocks response
    return order

# GOOD — fire and forget
def create_order(data):
    order = save_order(data)
    send_confirmation_email.delay(order.id)  # Celery / RQ / SQS
    return order
```

---

### 🟠 Tier 2 — High Impact, Moderate Effort

#### D. Caching
```python
# Pattern 1: Cache expensive reads (Redis)
def get_user_profile(user_id):
    key = f"user:profile:{user_id}"
    
    cached = redis.get(key)
    if cached:
        return json.loads(cached)           # ← ~0.1ms
    
    profile = db.query(User).get(user_id)  # ← 5-50ms
    redis.setex(key, 300, json.dumps(profile))  # TTL = 5min
    return profile

# Pattern 2: HTTP response caching
# Add to read-only endpoints:
response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
```

#### E. Database Connection Pooling
```python
# SQLAlchemy — tune pool for your workload
engine = create_engine(
    DATABASE_URL,
    pool_size=10,          # persistent connections
    max_overflow=20,       # burst capacity
    pool_pre_ping=True,    # drop stale connections
    pool_timeout=30,
)

# PgBouncer (sidecar) — for high-concurrency APIs
# transaction mode: 1000s of app connections → 20 DB connections
```

#### F. Pagination — Never Return Unbounded Sets
```python
# BAD
return db.query(Event).all()   # could be 500k rows

# GOOD — keyset pagination (faster than OFFSET at scale)
def get_events(after_id=None, limit=100):
    q = db.query(Event).order_by(Event.id)
    if after_id:
        q = q.filter(Event.id > after_id)
    return q.limit(limit).all()
```

---

### 🟡 Tier 3 — Architecture / Infrastructure

#### G. Horizontal Scaling + Load Balancing
```
                    ┌─────────────┐
                    │  Load       │
clients ──────────► │  Balancer   │
                    └──────┬──────┘
              ┌────────────┼────────────┐
              ▼            ▼            ▼
          API Pod 1    API Pod 2    API Pod 3
              │            │            │
              └────────────┴────────────┘
                           │
                      DB Primary
                      + Read Replicas  ◄── route read queries here
```

#### H. Async / Non-blocking I/O
```python
# FastAPI / asyncio — don't block the event loop
# BAD
@app.get("/data")
def get_data():
    result = requests.get("https://external-api.com")  # blocks thread
    return result.json()

# GOOD
@app.get("/data")
async def get_data():
    async with httpx.AsyncClient() as client:
        result = await client.get("https://external-api.com")
    return result.json()
```

#### I. Payload Size
```python
# Only return what the client needs
# BAD: serialize entire ORM object (50 fields)
return user.__dict__

# GOOD: explicit projection
return {
    "id": user.id,
    "name": user.name,
    "email": user.email
}

# BETTER: GraphQL or sparse fieldsets (?fields=id,name,email)
# + gzip/brotli compression on responses (trivial to enable in nginx/CDN)
```

---

### 🟢 Tier 4 — Quick Wins

| Action | Effort | Gain |
|---|---|---|
| Enable HTTP/2 on your gateway | Low | Multiplexing, header compression |
| Add CDN for static + cacheable responses | Low | Eliminate origin hits |
| Enable gzip/brotli response compression | Low | 60-80% payload reduction |
| Move session/auth to JWT (avoid DB lookup per request) | Medium | Removes a DB call per req |
| Use `SELECT` projections, never `SELECT *` | Low | Less data transferred, better index usage |
| Pre-warm caches on deploy | Low | Eliminates cold-start latency spike |
| Set DB statement timeout | Low | Kill runaway queries before they cascade |

---

## Phase 4: Measurement Loop

```
Measure → Hypothesize → Change ONE thing → Measure again
          ↑                                      │
          └──────────────────────────────────────┘

Tools:
  • Load testing:  k6, Locust, wrk, hey
  • Profiling:     py-spy, cProfile, clinic.js, async-profiler (JVM)
  • APM:           Datadog, Honeycomb, Grafana Tempo, OpenTelemetry
  • DB:            pg_stat_statements, EXPLAIN ANALYZE, Percona PMM
```

```bash
# Quick load test
k6 run --vus 50 --duration 30s script.js

# Profile a running Python process non-intrusively
py-spy top --pid $(pgrep -f gunicorn)
```

---

## Decision Tree

```
Is p99 >> p50?
├── YES → tail latency problem → look at DB lock contention, 
│         GC pauses, thread pool exhaustion, retry storms
└── NO  → systemic slowness →
          ├── All endpoints slow? → Infrastructure (DB pool, server capacity)
          └── Specific endpoints? → Profile those call paths specifically
                                    (N+1, missing index, external calls)
```

---

## What I Need to Go Deeper

Tell me any of these and I'll drill into specifics:

- **Language / framework** (Python/FastAPI, Node/Express, Go, Java/Spring…)
- **Database** (Postgres, MySQL, MongoDB, DynamoDB…)
- **Current p95 latency and target**
- **Bottleneck you've already identified** (or a slow query / trace)
- **Scale** (req/sec, DB size, number of services)

The above is the complete map. Where do you want to dig?