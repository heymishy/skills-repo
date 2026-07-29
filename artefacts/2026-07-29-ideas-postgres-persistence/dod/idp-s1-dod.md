# Definition of Done: Persist the kanban Ideas backlog in Postgres instead of an ephemeral file

**PR:** https://github.com/heymishy/skills-repo/pull/638 | **Merged:** 2026-07-29
**Story:** artefacts/2026-07-29-ideas-postgres-persistence/stories/idp-s1-persist-ideas-in-postgres.md
**Test plan:** artefacts/2026-07-29-ideas-postgres-persistence/test-plans/idp-s1-persist-ideas-in-postgres-test-plan.md
**DoR artefact:** artefacts/2026-07-29-ideas-postgres-persistence/dor/idp-s1-dor.md
**Assessed by:** Copilot (autonomous, short-track)
**Date:** 2026-07-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `createIdea(pool, fields)`/`listIdeas(pool)` (merged, on master) write/read a real `ideas` table via the shared `_creditsPool`, confirmed by a real Postgres round-trip (IT1) | Automated test (`node tests/check-idp-s1-persist-ideas-in-postgres.js`, U1-U2, IT1), re-run against merged master AND real `wuce-staging` Postgres today | None |
| AC2 | ✅ | An idea created via one `Pool` instance was visible via a completely separate, freshly-created `Pool` instance (IT2) — the established proxy this repo uses for "survives a restart" | Automated integration test (IT2), re-run against real Postgres today | None |
| AC3 | ✅ | `deleteIdea(pool, id)` removes the row; confirmed via real Postgres round-trip (IT3) | Automated test (U3, IT3), re-run against real Postgres today | None |
| AC4 | ✅ | With no `setIdeasStore()` call, `handlePostIdea`/`handleGetIdeas`/`handleDeleteIdea` still read/write `workspace/ideas.json` byte-for-byte as before | Automated test (U4-U6), re-run against merged master | None |
| AC5 | ✅ | Two distinct ideas ("Idea A", "Idea B") created via the real wired handler both round-trip correctly and distinguishably (IT4) — proving genuine wiring correctness, not just "a function got assigned" | Automated integration test (IT4), re-run against real Postgres today | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

One deviation, already logged in `decisions.md` at DoR time and reaffirmed here: this story deliberately deviates from D37's literal "stub defaults MUST throw" rule — the new `_ideasStore` injectable's default is the existing, already-working file-based logic, not a throw-stub, because a genuinely safe default already exists (mirrors `journey-store.js`'s own disk-adapter-as-default shape). This was a considered, explicitly-logged design choice at DoR time, not a shortcut discovered during implementation.

No other scope deviations. The merged PR touches only `src/web-ui/adapters/ideas-store-pg.js` (new), `src/web-ui/routes/features.js`, `src/web-ui/server.js`, and the new test file — matching the story's estimated touch points exactly. No tenant scoping was added (confirmed, per Out of Scope); `kanban-view.js` was confirmed untouched (no UI change).

---

## Test Plan Coverage

**Tests from plan implemented:** 10 / 10 (6 unit + 4 integration)
**Tests passing in CI and against real Postgres:** 10 / 10

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| U1-U3 (AC1, AC3) | ✅ | ✅ | Re-run against merged master code today |
| U4-U6 (AC4) | ✅ | ✅ | Re-run against merged master code today |
| IT1 (AC1) | ✅ | ✅ | Re-run against real `wuce-staging` Postgres today |
| IT2 (AC2) | ✅ | ✅ | Re-run against real Postgres today — durability re-confirmed post-merge, not just at implementation time |
| IT3 (AC3) | ✅ | ✅ | Re-run against real Postgres today |
| IT4 (AC5) | ✅ | ✅ | Re-run against real Postgres today |

**Gaps (tests not implemented):** One permanent, accepted gap, documented in the test plan itself: proving an idea survives an actual `flyctl deploy`/container restart cannot be automated; IT2's fresh-pool-instance test is the established, precedented proxy (matching `dfr-s1`'s own approach). Real confirmation is the absence of a repeat data-loss report going forward.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — negligible, reuses an already-open pooled connection | ✅ | Confirmed by design; no new connection overhead |
| Security — no new secrets, reuses existing `DATABASE_URL`/`_creditsPool` | ✅ | Confirmed by code review |
| Audit — not separately audited before this story, unchanged | ✅ N/A | Confirmed unchanged, per story's own NFR section |

---

## Metric Signal

No metrics array entries reference this story (`2026-07-29-ideas-postgres-persistence` has an empty `metrics: []` in `pipeline-state.json` — short-track bug fix, no benefit-metric artefact). The story's Benefit Linkage section quantified the bug directly (ideas silently wiped on every redeploy); the fix is now live and confirmed against real Postgres, closing the loop the same day it was identified.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None blocking. Passive: confirm no future report of "my idea disappeared" recurs — the concrete, observable signal that this fix is working in practice.

---

## DoD Observations

1. This story was identified, root-caused, speced, implemented, verified against real infrastructure twice (once pre-merge, once post-merge), and shipped in a single session — starting from a broad capture-log/learnings synthesis review down to a concrete, currently-active production bug. Worth noting as a validated example of that review process paying off in a genuinely high-value fix, not just governance/tooling cleanup.
2. During CI verification, PR #638's Scenario A E2E check failed for a real (non-flaky) reason unrelated to this story: the operator had manually toggled `wuce-staging`'s mock LLM gateway off for their own testing, causing `dsh-s4-resume-conversation-survives-restart.spec.js` to hit a real model response instead of the deterministic mock fixture. Confirmed via direct investigation (the failure was in unrelated code, and the error content showed a genuine streaming model response) before concluding it was unrelated to this PR, rather than assuming a regression. Re-ran cleanly once the operator confirmed the gateway was back on. No fix needed; noting only as a reminder that shared staging infrastructure toggles can transiently affect any open PR's checks, independent of that PR's own content.
3. `flyctl`'s auth session and the `wuce-staging` machine both needed re-establishing/waking twice during this story (once pre-merge, once again at DoD time) — the machine appears to auto-suspend when idle. Not a defect, just an operational note for future sessions doing real-Postgres verification: expect to possibly need `flyctl auth login` and/or `flyctl machine start <id> --app wuce-staging` before `flyctl ssh console` succeeds.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Persist the kanban Ideas backlog in Postgres instead of an ephemeral file" (idp-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
