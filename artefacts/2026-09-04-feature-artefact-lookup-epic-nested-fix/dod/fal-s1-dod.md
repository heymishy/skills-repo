# Definition of Done: Feature artefact page resolves epic-nested stories (object and bare-string shaped) to their real feature directory before looking up artefacts

**PR:** https://github.com/heymishy/skills-repo/pull/823 | **Merged:** 2026-09-03 (commit `724eaa67`)
**Story:** artefacts/2026-09-04-feature-artefact-lookup-epic-nested-fix/stories/fal-s1-resolve-real-feature-slug-before-artefact-lookup.md
**Test plan:** artefacts/2026-09-04-feature-artefact-lookup-epic-nested-fix/test-plans/fal-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-04-feature-artefact-lookup-epic-nested-fix/dor/fal-s1-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-03

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `object-shaped epic-nested story: _listArtefacts and getJourneyByFeatureSlug called with the real parent feature slug` | automated test (`tests/check-fal-s1-artefact-lookup-epic-nested-fix.js`) | None |
| AC2 | ✅ | `computeTaxonomyRollup resolves a bare-string slug correctly` + `bare-string epic-nested story: _listArtefacts called with the real parent feature slug` | automated test (2 tests) | None |
| AC3 (regression) | ✅ | `top-level feature uses the fast path -- no taxonomy scan, _listArtefacts gets the raw slug` | automated test | None |
| AC4 (regression) | ✅ | `genuinely unresolvable slug: "No artefacts found for this feature" still renders` | automated test | None |
| AC5 (regression) | ✅ | `tests/check-pdt-s4-story-breadcrumb.js` — 7/7 passing unmodified | automated test (reused, not rewritten) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

One recorded, non-blocking item — real work discovered and resolved within this same story, not silently absorbed:

1. **A real regression found and fixed within the story itself, before commit.** The first implementation pass moved the taxonomy-scan resolver call (`_resolveFeatureContext`) outside the `acceptsHtml` conditional it was previously scoped to under the old `_resolveBreadcrumbContext` — this broke the JSON API path, since some existing callers (`tests/check-alrf-s4-postgres-artefact-fallback.js` AC5/AC6, `tests/check-wuce6-feature-navigation.js`) invoke `handleGetFeatureArtefacts` for a JSON request without a `pool` argument at all, and `pool.query` was never previously reachable from that path. Caught only by a full-suite run (`npm test`), not by running the individually-DoR-identified related test files. Fixed by gating the resolver call behind `if (acceptsHtml)`, restoring the exact pre-existing JSON-path behaviour — matching the DoR's own H9 note, which flagged this exact class of risk in advance.

Additionally, two factual corrections were made during DoR preparation (before any code was written, so not scope deviations from the implemented behaviour, but worth recording for traceability): the story's Architecture Constraints originally claimed 3 downstream call sites needed the resolved slug threaded through; direct code reading showed `_resolveResumeLinksForFeature` takes the `journeyForPage` object (not a slug) and is corrected automatically once `getJourneyByFeatureSlug` receives the resolved slug — only 2 call sites needed explicit threading.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6 (5 new + 1 reused unmodified)
**Tests passing in CI:** 6 / 6 (all 8 PR checks green: Validate traceability chain, Lint/typecheck/test/build, Cross-tenant isolation spec, Playwright E2E smoke tests, Run assurance gate, Scenario A E2E staging, Scenario B E2E staging, Watermark gate)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 object-shaped epic-nested resolution | ✅ | ✅ | Spy-captured call arguments, not just rendered output |
| AC2 (part 1) computeTaxonomyRollup bare-string handling | ✅ | ✅ | |
| AC2 (part 2) bare-string end-to-end routing | ✅ | ✅ | |
| AC3 top-level feature fast-path regression guard | ✅ | ✅ | Also asserts taxonomy query call count is 0 |
| AC4 unresolvable-slug regression guard | ✅ | ✅ | |
| AC5 breadcrumb regression guard | ✅ | ✅ | `check-pdt-s4-story-breadcrumb.js`, 7 assertions, unmodified |

**TDD verification performed (RED confirmed, not assumed):** before committing, the fix was temporarily stashed (`git stash push -u` with a unique tag, reapplied and dropped by SHA per this repo's worktree stash-safety convention) and the new test file re-run against the pre-fix code. Confirmed AC1 and both AC2 tests fail with exactly the expected wrong-slug values (`lphf-s2` instead of the real feature slug; `undefined` instead of `p3.1a`), while AC3/AC4's regression guards correctly pass either way — proving the new tests are load-bearing, not vacuously true.

**Gaps (tests not implemented):**
None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no new query added | ✅ | Confirmed via code review and AC3's own test: the taxonomy-scan query call count is asserted to be 0 when the fast path resolves; when it does run, it now runs at most once per request (was previously computed once for nothing, then a second time for the breadcrumb, under the pre-fix code) |
| Security — no new external input, tenant-scoped unchanged | ✅ | `WHERE p.tenant_id = $1` unchanged in the reused query |
| Audit — resolved slug logged, not raw | ✅ | Confirmed via code review: `feature_artefacts_accessed` log call now uses `resolvedSlug` |
| Data residency / Compliance | ✅ N/A | No new data storage, no regulatory clause |

`nfr-profile.md` status: `Active` — no NFR gaps were identified at DoR, and none surfaced during implementation.

---

## Metric Signal

Not applicable — short-track story, no formal benefit-metric artefact or `metrics[]` array entries reference `fal-s1` (per CLAUDE.md's short-track path, benefit-metric is skipped by design). Benefit linkage was stated directly in the story: Time to First Actionable Content, the same metric `dashboard-triage` and `ppg-s1` targeted.

---

## Outcome

**COMPLETE**

Unlike the `pst-s1`/`pgft-s1`/`psbf-s1` incident chain, this story's own correctness is already fully confirmed by 5/5 new automated ACs plus a clean full-suite run (603 files, 1 pre-existing unrelated failure) plus genuine RED→GREEN TDD verification (the new tests were proven to fail against the pre-fix code, not just written after the fact) — not contingent on a live production data path that could still fail in ways tests can't reach. The one scope deviation recorded was extra rigor caught and fixed within the story itself, not a gap left behind.

**Follow-up actions:**
1. ~~Approve `promote-to-prod` for this merge commit~~ **Done.** Approved by Hamish King on workflow run `33798455742` (superseded the original run `33797888904` — a later bookkeeping-only commit, `85fc1f10`, triggered a new Staging Deploy run before the original was approved, matching the same auto-supersession pattern flagged in every prior DoD this session). Confirmed via the GitHub API: `724eaa67` (the fal-s1 fix commit) is a git ancestor of `85fc1f10` (the commit actually deployed), and the "Deploy to production" step completed with `conclusion: success` at 2026-09-03T19:57:27Z. `skills-framework.fly.dev` is now running this fix.
2. **Optional live confirmation, next time `skills-framework` is viewed in production**: click into `lphf-s2` or `rb-s4` and confirm the artefact index now shows real artefacts instead of "No artefacts found for this feature". Not blocking — automated test coverage plus genuine TDD RED-state verification already proves the fix; this is the operator's own visual sign-off when convenient. Owner: Hamish King.

---

## DoD Observations

1. **Same recurring deploy-topology gap, fifth occurrence this session.** Reiterating the `/improve` candidate already flagged in every prior DoD this session (`pst-s1`, `pgft-s1`, `psbf-s1`, `ppg-s1`): every merge requires its own separate `promote-to-prod` approval, with no carry-forward from a prior approval. For this story the urgency is low (read-path visibility fix, not data-loss), reinforcing the same signal noted in `ppg-s1`'s own DoD: the cost of this pattern scales with how time-critical the underlying fix is, not a fixed cost — useful context for scoping any eventual platform fix to the promotion gate.
2. **A second, concrete example this session of a full-suite run catching a regression the DoR's own "estimated touch points" list would have missed.** The JSON-path regression (Scope Deviations item 1) was invisible to the individually-related test files identified at DoR time — `check-alrf-s4-postgres-artefact-fallback.js` and `check-wuce6-feature-navigation.js` were not obviously "related" to a breadcrumb/artefact-lookup change until the full suite actually broke. Combined with `ppg-s1`'s own identical DoD observation (its orphaned-checkbox regression), this is now a pattern worth a standing note in the DoR template itself, not just a per-story anecdote: **DoR's "estimated touch points" is a starting point for targeted regression checks, never a substitute for a full-suite run before considering implementation complete.**
3. **First story this session to include an explicit RED-state verification step** (temporarily stashing the fix and confirming the new tests fail against pre-fix code, not just reasoning about it) before considering the tests trustworthy. Worth carrying forward as a standing practice for any short-track story where the DoR's own W4 warning ("verification script reviewed by a domain expert") is acknowledged-and-proceed rather than a real human review — this RED-state check is a partial, automatable substitute for that missing human review, catching "the test would pass regardless of the fix" as a class of defect the domain-expert review step exists to catch.
4. **The pre-existing `check-pdt-s4-story-breadcrumb.js` test's own blind spot (mocks that ignore their call arguments) was identified at test-plan time, not discovered as a surprise during implementation** — the test plan's own Coverage gaps section named this explicitly before any code was written. Worth noting as a positive pattern: reading an existing test file's actual assertions (not just its test *names*) before reusing its harness pattern surfaced a real verification gap in already-shipped, DoD-complete code (`pdt-s4`), without that story's own tests being wrong for their own original purpose — they just never needed to check call arguments for what they were testing (breadcrumb *text*), until this story's fix depended on exactly that distinction.
5. **The `promote-to-prod` auto-supersession pattern (flagged as a known benign gotcha in every prior DoD this session) required active cross-run investigation to actually confirm this time**, not just a benign-status-note. The operator reported approving production promotion; the run ID I had been polling (`33797888904`, for the actual fix commit `724eaa67`) still showed an empty approvals list and status `waiting` even after a propagation-delay re-check. The operator's own approval had gone to a *later* run (`33798455742`, triggered by this DoD's own bookkeeping-only commit `85fc1f10`) that auto-cancelled/superseded the original. Confirming this was genuinely safe (not a false "it's fine" assumption) required checking that `724eaa67` is a git ancestor of `85fc1f10` and that the later run's own "Deploy to production" step succeeded — both confirmed. Worth escalating from "noted 5 times" to an actual `/improve` candidate: an operator who approves what looks like the right run, on a repo with this much bookkeeping-commit churn per story, has a real chance of approving a stale/superseded run without realizing it, and a naive DoD-writer could have marked this "approved" from the operator's word alone without the ancestor check actually confirming the fix commit was included.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Feature artefact page resolves epic-nested stories (object and bare-string shaped) to their real feature directory before looking up artefacts" (fal-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
6. Is it clear that production (skills-framework.fly.dev) still does not have this fix until promote-to-prod is approved for this specific merge commit (724eaa67), and that this is explicitly framed as non-urgent (a read-path visibility fix, not a data-loss risk)?
Report findings as HIGH / MEDIUM / LOW.
```
