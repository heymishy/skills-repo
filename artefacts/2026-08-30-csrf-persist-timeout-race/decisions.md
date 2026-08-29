# Decision Log: csrf-persist-timeout-race

**Feature:** Graceful shutdown waits for pending session persists
**Discovery reference:** None — short-track, no discovery artefact
**Last updated:** 2026-08-30

---

## Decision categories

| Code | Meaning |
|------|---------|
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `GAP` | A skill-design gap surfaced by this feature, logged for future correction |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-08-30 | ARCH | pre-implementation**
**Decision:** Add a process-level graceful-shutdown handler (`SIGTERM` listener in `server.js`) that awaits all in-flight session-persist writes (tracked via a new pending-writes registry in `session.js`) before the process exits, capped at a 5000ms grace timeout. The existing 500ms response-side cap inside `persistSession` is left completely unchanged.
**Alternatives considered:** (1) Simply increase `_PERSIST_TIMEOUT_MS` from 500ms to a larger value (e.g. 3-5s) — rejected because it only makes the race rarer, does not close it, and adds latency to every session's first page render whenever Redis happens to be briefly slow.
**Rationale:** The prior fix (`cpr-s1`, PR #775, merged 2026-08-27) correctly closed the original "response sent before the write lands" race by making `generateCsrfToken` await `persistSession`. But `persistSession` itself races the real write against a 500ms timeout specifically so a slow/hung Redis never blocks the HTTP response (`cpr-s1`'s own AC4) — and `server.js` had zero `SIGTERM` handling, so Node's default behaviour terminates the process immediately on suspend, abandoning any write still in flight past that 500ms cap. This reintroduces the exact original bug whenever a real write takes longer than 500ms, which is entirely plausible under real network variance and was never exercisable against `cpr-s1`'s own test suite (its fake Redis adapter resolves synchronously). A graceful-shutdown handler closes this without touching the response-side latency guarantee at all: the response stays fast (500ms cap unchanged), but the *process* no longer dies before an already-in-flight write finishes. This also generalizes to any future fire-and-forget `persistSession` call, closing the class of bug `cpr-s1`'s own decisions.md explicitly flagged as likely to recur ("worth a lint rule or a structural test... if this recurs" — this is that recurrence).
**Made by:** Hamish King — Platform Owner (option selected via AskUserQuestion, after being shown both options with tradeoffs)
**Revisit trigger:** If Fly's actual `kill_timeout` (not currently pinned in `fly.toml` by this story) is ever configured to less than ~5.5s, the 5000ms grace timeout in this fix could itself be cut short by `SIGKILL` before it completes — revisit the grace-timeout value if `fly.toml`'s `kill_timeout` is ever explicitly set below that.
---

---
**2026-08-30 | ARCH | pre-implementation (SUPERSEDES the entry above)**
**Decision:** The SIGTERM-based graceful-shutdown approach above is **invalidated and abandoned before any code was written**. `fly.toml` sets `auto_stop_machines = 'suspend'` (confirmed by direct read of this repo's own `fly.toml`), not `'stop'`. Fly's own documentation (`https://fly.io/docs/reference/suspend-resume/`, fetched and confirmed 2026-08-30) states suspend uses a Firecracker VM snapshot to freeze the complete machine state — CPU registers, memory, open file handles — with **no signal sent to the guest process**. A `process.on('SIGTERM', ...)` handler would never fire under this configuration; the entire prior fix design would have been a silent no-op in production. Replaced with: increase `persistSession`'s existing `_PERSIST_TIMEOUT_MS` from 500ms to 8000ms. Since Fly can only suspend a machine once it looks genuinely idle (no active request/response cycle in flight), and the response is now held until the real write lands (up to the new, much larger bound), the false-idle window that let suspend race ahead of a still-pending write is closed by construction in the overwhelming majority of cases. The 8000ms bound remains as a last-resort circuit breaker for a genuinely broken/hung Redis (AC4's original "never hang forever" requirement still holds), not a routine race target.
**Alternatives considered:** (1) The abandoned SIGTERM-handler approach above. (2) Switch `auto_stop_machines` from `'suspend'` to `'stop'` in `fly.toml`, enabling a real SIGTERM+grace-period mechanism and making the original shutdown-handler design viable — declined because it trades away suspend's fast-resume benefit (a real product/cost tradeoff) purely to enable a more complex fix, when a much simpler fix (raising one timeout constant) closes the same race given suspend's actual "only triggers when idle" semantics.
**Rationale:** This is a case where an initial design was based on an incorrect assumption about the target platform's shutdown semantics (assumed `'stop'`-like SIGTERM behaviour without checking `fly.toml`'s actual configured mode or Fly's documented `'suspend'` mechanics first). Caught by deliberately verifying the assumption via Fly's own docs before writing any code, not after. The corrected fix is structurally simpler than the abandoned one: no new registry, no new process-level listener, no new file touched beyond `session.js`'s existing timeout constant and its surrounding documentation.
**Made by:** Hamish King — Platform Owner (option selected via AskUserQuestion, after the SIGTERM approach was shown to be invalid and two corrected options were presented)
**Revisit trigger:** If a future write pattern to Redis is found to routinely exceed 8000ms under normal (non-degraded) conditions, revisit the bound. If Upstash/Redis is ever swapped for a different backing store with materially different latency characteristics, re-derive this bound from that store's own realistic p99, not this one.
---
