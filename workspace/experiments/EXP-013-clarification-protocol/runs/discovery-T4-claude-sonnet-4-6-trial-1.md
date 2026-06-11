# /discovery pipeline skill

## Analyzing: "Make the API faster"

This is underspecified. Before writing a single line of code, I need to know what's actually slow.

---

## What I'd Actually Do

### Step 1: Measure First, Assume Nothing

```bash
# Where is time being spent?
curl -w "@curl-format.txt" -o /dev/null -s https://api.example.com/endpoint

# curl-format.txt
time_namelookup:  %{time_namelookup}s
time_connect:     %{time_connect}s
time_appconnect:  %{time_appconnect}s
time_pretransfer: %{time_pretransfer}s
time_starttransfer: %{time_starttransfer}s
time_total:       %{time_total}s
```

---

### Step 2: Identify the Bottleneck Category

```
Slow API
├── Network layer       → CDN, compression, HTTP/2, keep-alive
├── Application layer   → N+1 queries, missing indexes, sync where async works
├── Database layer      → slow queries, no caching, bad schema
├── Infrastructure      → undersized instances, no horizontal scaling
└── External deps       → third-party calls blocking response
```

**Each has a completely different fix.**

---

### Step 3: Common High-ROI Fixes (ranked by typical impact)

#### 🔴 Database (usually the culprit)

```sql
-- Find slow queries (PostgreSQL)
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

```python
# N+1 killer — eager load relationships
# Before
users = User.query.all()
for user in users:
    print(user.orders)  # N queries

# After
users = User.query.options(joinedload(User.orders)).all()
```

```sql
-- Add the missing index you probably need
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123;
-- If you see "Seq Scan" on a filtered column → add index
CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders(user_id);
```

---

#### 🟠 Caching

```python
# Cache expensive reads
from functools import lru_cache
import redis

r = redis.Redis()

def get_user_profile(user_id: str):
    cache_key = f"user:{user_id}"
    
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)          # ~1ms
    
    user = db.query(User).get(user_id)     # ~50ms
    r.setex(cache_key, 300, json.dumps(user.to_dict()))
    return user.to_dict()
```

---

#### 🟡 Async / Parallelism

```python
# Before: sequential external calls = sum of latencies
def get_dashboard(user_id):
    profile  = fetch_profile(user_id)   # 200ms
    orders   = fetch_orders(user_id)    # 150ms
    recs     = fetch_recs(user_id)      # 300ms
    return {profile, orders, recs}      # 650ms total

# After: parallel = max of latencies
import asyncio

async def get_dashboard(user_id):
    profile, orders, recs = await asyncio.gather(
        fetch_profile(user_id),
        fetch_orders(user_id),
        fetch_recs(user_id),
    )
    return {profile, orders, recs}      # ~300ms total
```

---

#### 🟢 Response / Transport

```python
# Pagination — never return unbounded result sets
@app.get("/orders")
def get_orders(page: int = 1, limit: int = 20):  # enforce limit
    return db.query(Order).offset((page-1)*limit).limit(limit).all()

# Compression
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Only return fields the client needs
# Instead of SELECT * → SELECT id, name, status
```

---

## What I Actually Need From You

| Question | Why it matters |
|----------|---------------|
| What does your current p50/p95/p99 latency look like? | Defines the target |
| Where is time spent? (profiler output, APM traces) | Directs the fix |
| What's the stack? (language, DB, infra) | Changes the solution entirely |
| Is this read-heavy or write-heavy? | Caching strategy differs |
| What's "fast enough"? | Prevents over-engineering |

---

## The Honest Answer

**"Make the API faster"** without measurement data is just **guessing at expensive problems**.

The fastest path to a faster API is:
```
1. Instrument → 2. Find the actual bottleneck → 3. Fix that specific thing
```

**Share traces, query times, or a flamegraph — and I'll give you a precise fix.**