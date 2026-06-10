# /discovery pipeline skill — Make the API Faster

No additional context provided, so I'll operate as the skill: **discover what's slow, explain why, and give actionable fixes.**

---

## Phase 1 — Discovery: Where APIs Lose Time

```
Latency Budget Breakdown (typical REST API)
─────────────────────────────────────────────
DNS + TLS handshake          5–200ms   (network, first request)
Routing / middleware stack   1–20ms    (framework overhead)
Auth / token validation      5–50ms    (often repeated, uncached)
Database query               10–500ms  ← most common culprit
External service calls       20–2000ms ← second most common
Serialization / response     1–10ms
─────────────────────────────────────────────
```

---

## Phase 2 — Diagnosis Tree

```
Is it slow for ALL requests?
├── YES → Infrastructure / framework / middleware problem
│         → Check: cold starts, connection pools, middleware chain
└── NO  → Is it slow for SPECIFIC endpoints?
          ├── YES → Query / business logic problem
          │         → Check: N+1 queries, missing indexes, no cache
          └── NO  → Is it slow INTERMITTENTLY?
                    → Check: connection pool exhaustion, GC pauses,
                              lock contention, noisy neighbor
```

---

## Phase 3 — Fixes, Ranked by Impact/Effort

### 🔴 High Impact, Low Effort

#### 1. Add Database Indexes
```sql
-- Find slow queries first
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123;

-- Missing index is almost always the answer
CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders(user_id);
```

#### 2. Fix N+1 Queries
```python
# BAD — 1 query per user = 100 queries for 100 users
users = User.all()
for user in users:
    print(user.orders.count())   # query fires here

# GOOD — 2 queries total
users = User.includes(:orders).all()
# or in SQL:
SELECT users.*, COUNT(orders.id)
FROM users
LEFT JOIN orders ON orders.user_id = users.id
GROUP BY users.id;
```

#### 3. Cache Auth Token Validation
```python
# BAD — validate JWT against DB on every request
def validate_token(token):
    return db.query("SELECT * FROM sessions WHERE token=?", token)

# GOOD — cache the result
@cache(ttl=60)  # 60-second TTL
def validate_token(token):
    return db.query("SELECT * FROM sessions WHERE token=?", token)
```

---

### 🟡 High Impact, Medium Effort

#### 4. Connection Pooling
```python
# BAD — new connection per request
def get_db():
    return psycopg2.connect(DATABASE_URL)

# GOOD — reuse connections
from psycopg2 import pool
connection_pool = pool.ThreadedConnectionPool(
    minconn=5,
    maxconn=20,
    dsn=DATABASE_URL
)
```

#### 5. Parallelize Independent I/O
```python
# BAD — sequential: 300ms + 200ms + 150ms = 650ms
user    = await fetch_user(id)
orders  = await fetch_orders(id)
profile = await fetch_profile(id)

# GOOD — parallel: max(300, 200, 150) = 300ms
user, orders, profile = await asyncio.gather(
    fetch_user(id),
    fetch_orders(id),
    fetch_profile(id)
)
```

#### 6. HTTP Response Caching
```python
# Add cache headers for static/slow-changing data
@app.get("/products")
async def get_products(response: Response):
    response.headers["Cache-Control"] = "public, max-age=300"
    return await db.fetch_products()
```

#### 7. Pagination — Never Return Unbounded Results
```sql
-- BAD
SELECT * FROM events;

-- GOOD
SELECT * FROM events
WHERE id > :cursor
ORDER BY id
LIMIT 100;
```

---

### 🟢 Medium Impact, Medium Effort

#### 8. Compress Responses
```python
# FastAPI / Express — enable gzip
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
# Typical reduction: 60–80% payload size
```

#### 9. Select Only What You Need
```sql
-- BAD — transfers entire row including BLOBs
SELECT * FROM users WHERE id = 1;

-- GOOD
SELECT id, name, email FROM users WHERE id = 1;
```

#### 10. Use a Read Replica for Read-Heavy Endpoints
```python
def get_db(write=False):
    if write:
        return primary_pool.getconn()
    return replica_pool.getconn()   # offload reads
```

---

### 🔵 Architectural (High Effort, Lasting Impact)

#### 11. Add a Caching Layer (Redis)
```
Request → Redis hit? → Return immediately (< 1ms)
                ↓ miss
          Database → Store in Redis → Return
```

```python
async def get_user(user_id: int):
    cache_key = f"user:{user_id}"
    
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)           # ~0.5ms
    
    user = await db.fetch_one(user_id)     # ~20ms
    await redis.setex(cache_key, 300, json.dumps(user))
    return user
```

#### 12. Move Slow Work Out of the Request Path
```
# BAD — user waits for email to send (2s)
POST /signup → create user → send welcome email → 200 OK

# GOOD — user gets instant response
POST /signup → create user → enqueue job → 200 OK
                                  ↓
                           worker sends email async
```

---

## Phase 4 — Measurement (Don't Guess)

```bash
# Load test before AND after every change
wrk -t12 -c400 -d30s https://api.example.com/endpoint

# Profile a specific endpoint
curl -w "@curl-format.txt" -o /dev/null -s https://api.example.com/endpoint

# curl-format.txt:
#   time_namelookup:  %{time_namelookup}s
#   time_connect:     %{time_connect}s
#   time_starttransfer: %{time_starttransfer}s
#   time_total:       %{time_total}s
```

---

## Quick-Start Checklist

```
[ ] Run EXPLAIN ANALYZE on your 5 slowest queries
[ ] Check for N+1 with query logging enabled
[ ] Verify connection pooling is configured
[ ] Add Redis for repeated reads (user sessions, config)
[ ] Parallelize any concurrent I/O calls
[ ] Set Cache-Control headers on stable resources
[ ] Paginate all list endpoints
[ ] Move email/notifications to async queues
[ ] Enable response compression
[ ] Load test: establish a baseline, then measure each fix
```

---

**Give me your stack, slow endpoint, or query and I'll go deeper.**