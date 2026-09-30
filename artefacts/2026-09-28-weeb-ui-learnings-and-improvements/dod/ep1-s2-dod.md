# Definition of Done: Signals panel route handler — `/api/signals` endpoint

**PR:** https://github.com/heymishy/skills-repo/pull/933 | **Merged:** 2026-09-30
**Story:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep1-s2.md
**Test plan:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep1-s2-test-plan.md
**DoR artefact:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/dor/ep1-s2-dor.md
**Assessed by:** Claude Sonnet 5 (session_011G2Sb9VPpFgBu42csYMjS5)
**Date:** 2026-09-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — Endpoint returns Signal array as JSON | ✅ | Confirmed on master post-merge: `node tests/check-ep1-s2-signals-route.js` → 7/7 pass; live-verified twice (once pre-merge on `feature/ep1-s2-wuli`, once post-merge on master) against a real local dev server — `GET /api/signals` returns HTTP 200 with a real, non-empty JSON array from `ep1-s1`'s real (non-stubbed) aggregator | `integration-real-code` + `live-verified` (real dev server, real HTTP) | None |
| AC2 — Response includes all required Signal fields | ✅ | Unit-tested with signals both with and without optional `context`; live response inspected directly (real `dod-follow-up` signal sampled, all required fields present) | `integration-real-code` + `live-verified` | None |
| AC3 — Endpoint gracefully handles aggregator exceptions | ✅ | Confirmed at handler level and via real router dispatch (`require('../src/web-ui/server').router`) — structured 500 + `{error, timestamp}`, never a partial 200 | `integration-real-code` | None |
| AC4 — Endpoint latency acceptable for solo operator scale | ✅ | Confirmed under a simulated 150ms aggregator, total <250ms | `integration-real-code` | None |
| AC5 — Endpoint is cacheable and repeatable | ⚠️ | Satisfied exactly as scoped: a stubbed aggregator returns byte-identical JSON across 2 calls. **Not satisfied end-to-end against the real, non-stubbed `ep1-s1` aggregator** — confirmed live, twice, that real signal `id`s differ across successive real calls (see Deviation) | `unit` (as scoped) / `live-verified` (the gap itself) | See below |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

**Deviation on AC5:** `ep1-s2`'s own AC5/NFR language ("no random IDs... calling the endpoint twice with no file changes returns identical responses") describes a real requirement on the data the endpoint serves, not only on this story's own route-handler code. The route handler itself is fully correct and deterministic — it passes `ep1-s1`'s aggregator output through untransformed, with no non-determinism introduced at this story's own layer. The non-determinism originates entirely in `ep1-s1`'s already-shipped, already-DoD'd `_makeSignal` (`Math.random()`-based `id`; a fresh `new Date().toISOString()` per `parse-error` signal), confirmed live via 3 separate real HTTP calls across 2 different dev-server sessions (pre-merge and post-merge) — different `id`s and `parse-error` timestamps every time, with no underlying workspace file changes between calls. This is fully documented in `decisions.md` with a recommended follow-up story; not fixed in either `ep1-s1` or `ep1-s2` because `ep1-s2`'s own DoR explicitly instructed "Do NOT modify `ep1-s1`'s own aggregator module," and fixing it in `ep1-s1` after its own DoD would itself be undocumented scope creep on an already-closed story.

---

## Scope Deviations

None beyond the AC5 finding above (which is a data-contract gap between two stories, not unrequested behaviour this story added). The merged PR is exactly what the DoR contract described: `src/web-ui/routes/signals.js` (new), `src/web-ui/server.js` (route registration only), `tests/check-ep1-s2-signals-route.js` (new). All 3 commits map 1:1 to the implementation plan's 6 tasks — confirmed via `git log --oneline master..HEAD` at `/verify-completion` time.

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7 (test plan specified 10 test descriptions across unit + integration; several ACs share one confirmation test each per the plan's own explicit "confirmation-only, no new code needed" design once Task 1's passthrough/try-catch logic was in place — 0 coverage gap, matches the story's own H8 gate)
**Tests passing in CI:** 7 / 7, confirmed on PR #933's real Ubuntu CI run (`Lint, typecheck, test, build`), plus Scenario A/B E2E and the cross-tenant isolation spec all green

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 unit (200 + passthrough) | ✅ | ✅ | |
| AC2 unit (required fields, optional tolerated absent) | ✅ | ✅ | |
| AC3 unit (structured 500) | ✅ | ✅ | |
| AC4 unit (latency budget) | ✅ | ✅ | |
| AC5 unit (repeatability, stubbed) | ✅ | ✅ | |
| AC1 integration (real router dispatch) | ✅ | ✅ | |
| AC3 integration (real router dispatch, 500 path) | ✅ | ✅ | |

**Gaps (tests not implemented):** None against the test plan's own scope. The real, unstubbed repeatability gap (AC5) was explicitly out of the test plan's own scope by its own words ("appropriate for a post-merge smoke test... not a pre-implementation unit/integration test") and was addressed at that exact post-merge smoke-test step, live, per below.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Endpoint latency (<250ms) | ✅ | Confirmed under simulated 150ms aggregator delay |
| Error handling (500 on exception, never propagated) | ✅ | Confirmed both at handler level and real router dispatch |
| Response shape consistency | ✅ | Confirmed via AC2's own test; live-sampled real signal also conforms |
| Repeatability | ⚠️ | Satisfied for the route handler's own logic; not satisfied end-to-end against `ep1-s1`'s real output — see AC5 deviation above |

---

## Metric Signal

**Measurement-ready gate:** Yes — Metric 2's own "Minimum validation signal" (`benefit-metric.md`) explicitly required the real `/api/signals` endpoint to exist; it now does, and was live-verified twice (pre- and post-merge).

> **Metric 2 — Improvement signal surfacing**
> Signal: on-track
> Evidence: `GET /api/signals` confirmed live against a real local dev server both pre-merge (`feature/ep1-s2-wuli`) and post-merge (master) — HTTP 200, a real non-empty `Signal[]` array sourced from `ep1-s1`'s real aggregator output (5265 signals pre-merge; a smaller but real, non-empty set post-merge from the then-current workspace state). This satisfies the metric's own explicit minimum validation signal ("At least 1 signal source... surfaced correctly end-to-end via the real `/api/signals` endpoint"). Full target ("all 12 sources... displayed per active feature") depends on `ep1-s3`'s dashboard rendering, not yet built.
> Date measured: 2026-09-30

---

## Outcome

**COMPLETE WITH DEVIATIONS**

All 5 ACs are satisfied exactly as this story's own DoR scoped them; AC5's real-world gap is a genuine, already-documented cross-story data-contract issue in `ep1-s1`, not a defect in this story's own implementation. Marked "with deviations" to keep it visibly tracked at the outcome level rather than letting the all-green AC table obscure a real, confirmed limitation a future dashboard consumer needs to know about.

**Follow-up actions:**
1. A new story to change `ep1-s1`'s `_makeSignal` to derive `id` deterministically (e.g. a stable hash of `source + type + text + timestamp`) instead of `Math.random()`, and to give `parse-error` signals a stable, content-derived timestamp instead of "time of this specific call." Candidate already flagged in `decisions.md`. Owner: future story.
2. `ep1-s3` (dashboard rendering) should be aware of this gap when designing any client-side behaviour that assumes stable signal `id`s (list keys, dedup, "seen" tracking) until the follow-up above ships.

---

## DoD Observations

1. **Chrome browser validation was requested by the operator but not directly possible in this session** — the Claude-in-Chrome extension reported "not connected." A real local dev server + direct HTTP calls were substituted as the closest available live-environment check, and this substitution is explicitly documented (both here and in `decisions.md`) rather than silently treated as equivalent to an actual rendered-browser check. **/improve candidate:** none specific to this repo's own pipeline — this is an environment/tooling availability constraint of this particular session, not a gap in the story or its verification approach.
2. **A genuine, real cross-story data-contract gap was found and correctly NOT fixed**, respecting the explicit scope boundary set at `ep1-s2`'s own DoR time ("Do NOT modify `ep1-s1`'s own aggregator module"). This is a positive example of a boundary holding under real pressure to "just fix it while I'm here" — the finding was investigated, reproduced live (twice), fully documented with a concrete recommended fix, and left for a proper follow-up story rather than expanding this story's own scope or silently working around it in the route handler (e.g. by re-deriving a stable ID at the route layer, which would have hidden the real problem in `ep1-s1` rather than fixing it at its source).

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for ep1-s2 (Signals panel route
handler: GET /api/signals endpoint).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
