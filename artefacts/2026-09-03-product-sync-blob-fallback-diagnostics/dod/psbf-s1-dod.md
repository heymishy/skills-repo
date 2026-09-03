# Definition of Done: Detect truncated Contents API content, fall back to Git Blobs API, and record diagnostics to logs + PostHog

**PR:** https://github.com/heymishy/skills-repo/pull/821 | **Merged:** 2026-09-03
**Story:** artefacts/2026-09-03-product-sync-blob-fallback-diagnostics/stories/psbf-s1-blob-fallback-diagnostics.md
**Test plan:** artefacts/2026-09-03-product-sync-blob-fallback-diagnostics/test-plans/psbf-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-03-product-sync-blob-fallback-diagnostics/dor/psbf-s1-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-03

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `syncProductRollup: truncation detected and captured to PostHog before any fallback` | automated test (`tests/check-psbf-s1-blob-fallback.js`) | None |
| AC2 | ✅ | `syncProductRollup: Blobs API fallback called with the correct sha` and `...rollup reflects the full Blobs-API content, not the truncated original` | automated test | None |
| AC3 (regression) | ✅ | `syncProductRollup: throws when the Blobs API fallback also fails, error propagates to caller` and `...fallback failure captured with fallbackAttempted:true` | automated test | None |
| AC4 (regression) | ✅ | `syncProductRollup: non-truncated content triggers zero fallback calls, zero PostHog captures, unchanged write` | automated test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. All 6 commits on `feature/psbf-s1` map cleanly to implementation-plan tasks — confirmed at `/verify-completion` via `git log --oneline`. Unlike `pgft-s1`, no additional pre-existing test files needed mock-fidelity fixes this time: the new truncation-detection code path is purely additive, gated behind a `raw.size` field every pre-existing mock omits, so it is a structural no-op for all of them (confirmed by all 37 pre-existing `product-rollup` tests, plus `pgft-s1`'s own 5-test file, the pre-existing adapter wiring test, the products-route tests, and `pst-s1`'s own tests, all passing unchanged).

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4 (10 assertions total across those 4 logical tests)
**Tests passing in CI:** 4 / 4 (all 8 PR checks green: Validate traceability chain, Lint/typecheck/test/build, Cross-tenant isolation spec, Playwright E2E smoke tests, Run assurance gate, Scenario A/B E2E staging, Watermark gate)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 truncation detected + captured | ✅ | ✅ | |
| AC2 Blobs API fallback used correctly | ✅ | ✅ | 2 assertions (correct sha called; rollup reflects full content) |
| AC3 fallback failure captured + propagates | ✅ | ✅ | 2 assertions |
| AC4 non-truncated common case unaffected | ✅ | ✅ | |

**Gaps (tests not implemented):**
None. The one named residual uncertainty from the test plan — whether the Blobs API fallback actually resolves the live production incident — is explicitly a post-merge production/PostHog observation item, not a test-plan gap (the detection+fallback *mechanism* is fully covered and proven correct by the tests above).

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — zero added latency for the common case | ✅ | AC4's own test asserts zero Blobs API calls when content is not truncated |
| Performance — one extra round-trip when truncation is detected | ✅ | Acceptable since the whole sync runs in the background (`pst-s1`'s fire-and-forget design); confirmed by code review |
| Security — no new external input or attack surface | ✅ | Same caller-supplied OAuth token (ADR-020) and tenant-scoped resolution reused |
| Availability — sync success rate for `skills-framework` specifically | ✅ Confirmed | Live production log: `reported size 1355793, decoded length 0` (definitive root-cause confirmation) followed by a successful Blobs API fallback, no retry needed. Operator confirmed via live UI: fresh data, "Last synced just now". |
| Data residency | ✅ N/A | No new data storage |
| Compliance | ✅ N/A | No named regulatory clause |

`nfr-profile.md` status updated to `Verified at 2026-09-03` — all NFRs, including the Availability NFR's own Gap, are now confirmed.

---

## Metric Signal

Not applicable — short-track story, no formal benefit-metric artefact or `metrics[]` array entries reference `psbf-s1` (per CLAUDE.md's short-track path, benefit-metric is skipped by design).

---

## Outcome

**COMPLETE**

(Upgraded from the initial COMPLETE WITH DEVIATIONS classification once the two follow-up actions below were resolved same-day: promotion approved, and the live production test directly confirmed both the root cause and the fix. No scope or AC gap ever existed — the "with deviations" classification was solely about the then-unconfirmed production outcome, which is now confirmed.)

**Follow-up actions:** None outstanding — both prior follow-up actions are now resolved.

1. ~~Approve `promote-to-prod`~~ — **Done.** Approved by Hamish King; commit `14f4e263` is live on `skills-framework.fly.dev`.
2. ~~The real test~~ — **Done, and confirmed successful.** Operator clicked "Refresh" in production immediately after promotion. Production logs show the definitive root-cause confirmation this entire 3-story chain was chasing:
   ```
   [psbf-s1] Contents API content truncated for product dd3fbea3-8cb5-46dd-97e1-8bd7725185e4: reported size 1355793, decoded length 0
   ```
   GitHub's Contents API returned a completely empty `content` field (not partial truncation — literally 0 bytes) for this 1.36MB file, exactly matching GitHub's documented ~1MB Contents API threshold behaviour. No subsequent fallback-failure log line — the Git Blobs API fallback fired once and succeeded on the first attempt. Operator confirmed via the live UI: "Last synced just now", real data (477 stories, 214 healthy / 27 warning, 95.1% test coverage, 81.4% AC coverage) — the product page that had shown a 45-day-stale snapshot through the entire incident is now genuinely current.

---

## DoD Observations

1. **Third consecutive story in this chain to hit the identical deploy-topology gap — now clearly a systemic pattern, not incident-specific noise.** `pst-s1`, `pgft-s1`, and now `psbf-s1` have each required their own separate, manually-gated `promote-to-prod` approval, with no carry-forward between merges. Reiterating the `/improve` candidate raised in both prior DoDs, now with three data points instead of one or two: for a same-day, same-incident sequence of fast-follow short-track fixes, requiring a fresh manual production approval after every single merge adds real friction and real delay to resolving a live incident, without adding meaningful safety over (for example) a single approval covering "promote master to production" regardless of which commit triggered it. This is a genuine platform/process decision for the operator, not something to change unilaterally — but it has now recurred often enough in one session to be worth a deliberate decision rather than repeated ad-hoc friction.
2. **This story is the empirical payoff of the whole incident chain's own layered diagnosability improvements.** `pst-s1`'s background-failure logging is what first surfaced this exact failure as distinguishable from a client-side timeout. `pgft-s1`'s retry+diagnostics, once live in production, definitively proved the failure was NOT where it was first assumed to be — narrowing the search to the one remaining unprotected parse call. `psbf-s1` both fixes that root cause AND adds the PostHog instrumentation that should prevent a fourth round of "reproduce, diagnose, guess, ship, re-test" for any *future* failure mode in this same sync path. Worth recording as a positive delivery-pattern example: each story's own diagnostic investment measurably shortened the next story's own investigation, rather than each fix being diagnosed from scratch.
3. **`realFetchBlobBySha` is this story's own new D37 adapter** — confirmed via the DoR's own H-ADAPTER hard-block detail and the implementation's own dedicated wiring test (Task 5). No gap to record; noted here only for `/trace`'s own audit trail, since this is the first story in the chain to introduce a genuinely new adapter rather than modifying an existing one.
4. **Root cause confirmed, same-day, with byte-level precision.** The production log line `reported size 1355793, decoded length 0` is the single most concrete piece of evidence in this entire 3-story chain: GitHub's Contents API did not partially truncate this repo's 1.36MB `pipeline-state.json` — it returned a completely empty `content` field on an otherwise-`ok:200` response, exactly matching GitHub's own documented ~1MB Contents API threshold behaviour (the "object media type, content field empty" case). Every earlier hypothesis in this chain (reverse-proxy timeout, outbound network truncation) was a reasonable, evidence-driven inference at the time it was made, but this is the first point where the actual mechanism was directly observed rather than inferred. The Blobs API fallback resolved it on the first attempt, no retry needed. This closes the incident: `pst-s1` (#819), `pgft-s1` (#820), and `psbf-s1` (#821) are now all DoD-complete, merged, promoted to production, and — uniquely for this last one — directly confirmed working against the real data that motivated the entire chain.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Detect truncated Contents API content, fall back to Git Blobs API, and record diagnostics to logs + PostHog" (psbf-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Is it clear that production (skills-framework.fly.dev) still does not have this fix until promote-to-prod is approved for THIS specific merge commit (14f4e263), and that the real confirmation of whether this incident is actually resolved is still outstanding?
Report findings as HIGH / MEDIUM / LOW.
```
