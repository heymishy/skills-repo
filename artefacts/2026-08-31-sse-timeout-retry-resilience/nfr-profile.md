# NFR Profile: Retry an LLM stream call once when it fails before any content has streamed

**Feature:** 2026-08-31-sse-timeout-retry-resilience
**Created:** 2026-08-31
**Status:** Active

---

## Performance

| NFR | Target | Measurement method | Applies to story |
|-----|--------|--------------------|-----------------|
| Bounded worst-case added latency | At most one additional `DEFAULT_TIMEOUT_MS` (90s) window when a failure is not recoverable by retry | Code review — retry count hard-bounded to 1 | sstr-s1 |
| No regression to normal successful turns | A turn that succeeds on the first attempt has zero added latency or behavior change | `noRegressionToNormalSuccessfulTurnTiming` test | sstr-s1 |

**Source:** Story ACs and Architecture Constraints.

---

## Security

| NFR | Requirement | Standard or clause | Applies to story |
|-----|-------------|-------------------|-----------------|
| No new external call surface | Retry reuses the exact same LLM call path and credentials already in use — no new endpoint, no new adapter | Code review of the call site | sstr-s1 |

**Data classification:**
- [x] Internal — non-public but low sensitivity (turn-streaming resilience logic; no new data category)

---

## Data residency

Not applicable.

## Availability

**Improves** availability for the specific failure mode addressed (transient pre-content-stream stalls) — no new availability risk introduced, since the safety condition (`_ttfbMs === null`) guarantees no client-visible or session-state side effects occur before a retry.

## Compliance

Not applicable.

## Gaps and open questions

None identified at 2026-08-31.
