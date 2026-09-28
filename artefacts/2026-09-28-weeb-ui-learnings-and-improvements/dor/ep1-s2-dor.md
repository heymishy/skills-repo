# Definition of Ready — ep1-s2: Signals panel route handler

**Story:** Signals panel route handler: `/api/signals` endpoint
**Feature slug:** 2026-09-28-weeb-ui-learnings-and-improvements
**Status:** PROCEED — Signed off for inner loop

---

## Scope Contract

**What you are building:**

A server-side HTTP route handler (`src/web-ui/routes/signals.js`) that exposes a `GET /api/signals` JSON endpoint. The handler calls the `signals-aggregator.js` module (ep1-s1), receives a normalized `Signal[]` array, and returns it as JSON with HTTP 200 status. On error, returns HTTP 500 with error summary. Response is JSON only; dashboard JavaScript owns rendering.

**What you are NOT building:**

- Signal filtering, sorting, display logic, or per-source robustness — deferred
- Caching or performance optimization beyond MVP <250ms — deferred to Phase 5
- HTML rendering — dashboard JavaScript owns this
- Multi-tenant isolation or error file logging — deferred

**Acceptance Criteria:**

1. **AC1:** `GET /api/signals` returns HTTP 200 with JSON array of Signal objects matching ep1-s1 aggregator output
2. **AC2:** All required Signal fields present: `id`, `source`, `type`, `text`, `timestamp`, `cta.label`, `cta.skill`
3. **AC3:** If aggregator throws, endpoint returns HTTP 500 with `{ error: '<message>', timestamp: '<ISO8601>' }` — never partial 200
4. **AC4:** Endpoint latency <250ms for solo operator scale
5. **AC5:** Repeated calls return identical responses (deterministic)

**Files you will touch:**
- `src/web-ui/routes/signals.js` (new, ~80–120 lines)
- `tests/signals-route.test.js` (new, ~200–300 lines)

**Files you must NOT touch:**
- `src/web-ui/modules/signals-aggregator.js` (ep1-s1 owns this)
- `src/web-ui/skill-launcher.js` (ep1-s3 owns this)
- `dashboards/`, `.github/context.yml`, `package.json`

---

## Architecture Guardrails

**Mandatory constraints:**

- **No new npm dependencies** (tech-stack.md) — use Node.js built-ins; call aggregator synchronously
- **ADR-024 compliance** — your endpoint must return a well-defined JSON shape with all required fields
- **Graceful error handling** — aggregator exceptions caught and returned as 500, never propagated
- **No file I/O in route** — aggregator owns all file reading; route handler is stateless

**Referenced architecture decisions:**
- ADR-024 (GET response shape contract)
- D37 (injectable adapter rule)
- ADR-028 (canonical builder pattern)

---

## Test Execution

**Required before opening PR:**

1. Unit tests (2.1–2.2): `npm test -- tests/signals-route.test.js` — all must pass
2. Integration tests (2.3–2.6): verify endpoint returns complete Signal array, handles errors, meets latency <250ms
3. Determinism test (2.5): repeated calls return identical response
4. Manual AC review: sign off AC1–AC5

**Pass criteria:** All tests pass, latency <250ms, ACs signed off.

---

## Implementation Notes

**Route handler skeleton:**

```javascript
const router = require('express').Router();
const { getSignals } = require('../modules/signals-aggregator');

router.get('/api/signals', (req, res) => {
  try {
    const signals = getSignals(process.cwd());
    res.status(200).json(signals);
  } catch (err) {
    res.status(500).json({
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
```

**Performance target:** <250ms end-to-end (aggregator <200ms + route overhead <50ms).

---

## Coding Agent Instructions

**Your task:** Implement the signals panel route handler (`GET /api/signals` endpoint) following this specification.

**Entry point:** You are implementing ep1-s2 (Signals panel route handler) in the feature 2026-09-28-weeb-ui-learnings-and-improvements. The ep1-s1 (Signals aggregator module) story is already merged and available for import.

**What to build:**
1. Create `src/web-ui/routes/signals.js` with a route handler that:
   - Accepts GET requests to `/api/signals`
   - Calls `getSignals()` from the aggregator module (ep1-s1)
   - Returns HTTP 200 with the Signal array as JSON
   - On aggregator exception: returns HTTP 500 with `{ error: '<message>', timestamp: '<ISO8601>' }`

2. Create `tests/signals-route.test.js` with tests covering:
   - AC1: endpoint returns 200 with Signal array
   - AC2: all required Signal fields present
   - AC3: aggregator exception returns 500 with error details
   - AC4: latency <250ms
   - AC5: repeated calls return identical response

**Constraints:**
- No new npm dependencies
- No file I/O in the route handler (aggregator owns that)
- Graceful error handling (catch aggregator exceptions, never propagate)
- Deterministic output (same input → same response every time)

**Test execution:**
- Run `npm test -- tests/signals-route.test.js` before opening PR
- All tests must pass; no skipped tests

**What NOT to do:**
- Do not modify the aggregator module (ep1-s1 is separate story)
- Do not add signal filtering, sorting, or display logic (route returns raw array; dashboard owns rendering)
- Do not implement caching (on-demand parsing acceptable for MVP <250ms)
- Do not modify launcher, dashboards, or config files

**Definition of success:**
- `GET /api/signals` endpoint works end-to-end
- All AC tests pass
- Latency <250ms for solo operator scale
- Ready to be integrated into dashboard (ep1-s2 complete, ep1-s3 next)

---

## Sign-off

**Hard blocks:** 0/0 — no hard blocks identified; entry conditions met

**Warnings:** 0/0 — no warnings

**Oversight level:** Low (straightforward route handler implementation; no ambiguity in spec or aggregator contract)

**Status:** ✅ PROCEED

All ACs are clear, contract is binding, test plan is complete, architecture constraints are documented. Ready for inner loop implementation.