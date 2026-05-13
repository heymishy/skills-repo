# /discovery pipeline skill

## Analyzing the problem space first

You gave me nothing concrete — no codebase, no language, no metrics, no architecture. So I'm going to do what a good engineer actually does: **map the likely bottleneck space, then give you actionable patterns for each layer.**

---

## The Discovery Pipeline Mental Model

A "discovery pipeline" typically looks like:

```
[Ingest] → [Parse/Normalize] → [Enrich] → [Index/Store] → [Serve/Query]
```

Each stage has different failure modes. Speed problems are almost never "everywhere" — they're **one or two stages hiding behind a slow P99.**

---

## Step 1: Measure Before Touching Anything

```bash
# If you don't have this data, get it first.
# Instrument each stage boundary:

stage_start = time.monotonic()
result = run_stage(data)
metrics.histogram("pipeline.stage.duration", 
                  time.monotonic() - stage_start,
                  tags=["stage:enrich"])
```

**Find:**
- Which stage has the highest latency?
- Which stage has the highest variance (P50 vs P99 gap)?
- Where does throughput drop under load?

---

## Step 2: The Most Common Culprits (ranked by frequency)

### 🔴 #1 — Serial I/O that should be parallel

```python
# SLOW — waiting on each one
for item in items:
    result = await fetch_metadata(item)   # 50ms × 1000 = 50s

# FAST — concurrent
results = await asyncio.gather(
    *[fetch_metadata(item) for item in items]
)

# CAREFUL — unbounded concurrency kills downstream
semaphore = asyncio.Semaphore(50)
async def bounded_fetch(item):
    async with semaphore:
        return await fetch_metadata(item)

results = await asyncio.gather(
    *[bounded_fetch(item) for item in items]
)
```

---

### 🔴 #2 — N+1 queries in the enrichment stage

```python
# SLOW — one query per item
for item in pipeline_items:
    item.tags = db.query(
        "SELECT * FROM tags WHERE item_id = ?", item.id
    )

# FAST — batch fetch
item_ids = [item.id for item in pipeline_items]
all_tags = db.query(
    "SELECT * FROM tags WHERE item_id = ANY(?)", item_ids
)
tags_by_id = group_by(all_tags, key="item_id")

for item in pipeline_items:
    item.tags = tags_by_id.get(item.id, [])
```

---

### 🔴 #3 — Blocking the hot path with work that can be deferred

```python
# SLOW — doing everything synchronously before returning
def process(item):
    normalized = normalize(item)
    enriched   = enrich(normalized)      # calls 3 external APIs
    indexed    = write_to_index(enriched) # synchronous disk write
    notify_downstream(indexed)           # HTTP call
    return indexed

# FAST — return early, defer the rest
def process(item):
    normalized = normalize(item)
    write_to_queue(normalized)           # fast, async
    return normalized                    # caller unblocked

# Worker pool handles enrich → index → notify separately
```

---

### 🔴 #4 — Missing or wrong caching layer

```python
# Common mistake: caching at the wrong granularity

# BAD — caching the whole pipeline result (too coarse, low hit rate)
@cache(ttl=300)
def run_pipeline(query):
    ...

# BETTER — cache expensive sub-operations
@cache(ttl=3600, key=lambda item: item.source_id)
def fetch_external_metadata(item):
    ...  # This is what's actually slow and repeated

# ALSO CHECK — are you serializing/deserializing cache values
# with something expensive (pickle, full JSON) on every hit?
```

---

### 🔴 #5 — Parsing/deserialization in a tight loop

```python
# If you're doing this per-item in a hot loop:
for raw in stream:
    data = json.loads(raw)          # GC pressure, slow in Python
    schema = MySchema().load(data)  # Marshmallow/Pydantic cold path

# Consider:
# 1. orjson instead of json (3-10x faster)
# 2. Batch-validate schemas
# 3. Compile regex patterns outside the loop
# 4. Use __slots__ on hot data classes

import orjson
data = orjson.loads(raw)  # drop-in, much faster
```

---

### 🔴 #6 — Thread/process pool starvation

```python
# If you're using a thread pool executor for I/O-bound work:
executor = ThreadPoolExecutor(max_workers=4)  # 4 threads for 500 items → queue

# Size it to your workload:
import os
executor = ThreadPoolExecutor(
    max_workers=min(32, (os.cpu_count() or 1) + 4)  # Python 3.8+ default
)

# For CPU-bound stages (parsing, ML inference):
executor = ProcessPoolExecutor(max_workers=os.cpu_count())
```

---

### 🔴 #7 — Index writes with no batching

```python
# SLOW — one write per document
for doc in documents:
    search_client.index(doc)          # network round-trip × N

# FAST — bulk indexing
search_client.bulk_index(documents)   # one round-trip

# If you can't bulk all at once:
BATCH_SIZE = 500
for batch in chunks(documents, BATCH_SIZE):
    search_client.bulk_index(batch)
```

---

## Step 3: Structural Changes (if the above aren't enough)

### Fan-out the pipeline stages

```
Before:
[Worker] → stage1 → stage2 → stage3 (sequential, one worker)

After:
[Ingest Queue] → [Stage1 Workers ×N] 
              → [Stage2 Queue] → [Stage2 Workers ×M]
              → [Stage3 Queue] → [Stage3 Workers ×K]

Scale N, M, K independently based on where the bottleneck is.
```

### Add a read-through cache in front of the API serving layer

```
Client → [CDN / Edge Cache]
              ↓ miss
         [API Server] → [In-memory cache (Redis)]
                              ↓ miss
                         [Pipeline / DB]
```

---

## Step 4: The Checklist

Run through this before shipping any optimization:

```
[ ] Profiled — I know the actual bottleneck stage
[ ] Baseline metric captured (P50, P99, throughput)
[ ] Change is isolated to one variable
[ ] Load tested, not just unit tested
[ ] Didn't trade latency for correctness (cache invalidation, race conditions)
[ ] Monitoring in place to detect regression
```

---

## What I need from you to go deeper

| Question | Why it matters |
|---|---|
| What language/runtime? | Async model, GIL, threading behavior |
| What does "discovery" mean here? (crawling? search indexing? service mesh?) | Changes which stage is likely hot |
| What's the current P50/P99 latency? | Tells me if this is a 2× or 20× problem |
| Where in the pipeline is it slow? | Everything else is noise until you know this |
| What's the data volume? (items/sec, payload size) | Changes batching and concurrency recommendations |

**Tell me any of those and I'll get specific.**