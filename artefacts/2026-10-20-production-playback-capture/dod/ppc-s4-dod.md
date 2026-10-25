# Definition of Done: Recognise pipeline-state.json DoD-complete features in self-service playback capture

**PR:** https://github.com/heymishy/skills-repo/pull/1022 | **Merged:** 2026-10-25
**Story:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s4-pipeline-state-dod-fallback.md
**Test plan:** artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s4-test-plan.md
**DoR artefact:** artefacts/2026-10-20-production-playback-capture/dor/ppc-s4-dor.md
**Assessed by:** Claude (session)
**Date:** 2026-10-25

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `tests/check-ppc-s4-pipeline-state-dod-fallback.js` — "no existing journey, flat stories all dodStatus:complete -> 200 with non-empty acs", "epic-nested stories shape also resolves via the fallback", "a GitHub fetch failure is treated as not-found (404), not a crash" | `integration-real-code` (real `_resolveJourney`/`_resolveViaPipelineState`/`_featureDodStatus` code, mocked GitHub Contents API adapter and Postgres pool) | None |
| AC2 | ✅ | "second request for the same product/feature reuses the provisioned journey, no second GitHub fetch" (call-count assertion), "the provisioned journey is tenant/product-scoped with a definition-of-done completedStages entry" | `integration-real-code` | None |
| AC3 | ✅ | "one flat story not dodStatus:complete -> still 404", "one epic-nested story not dodStatus:complete -> still 404" | `integration-real-code` | None |
| AC4 | ✅ | "product has no connected repo -> 404, identical body to pre-fix behaviour", "the products query itself failing -> 404, no unhandled rejection" | `integration-real-code` | None |
| AC5 | ✅ | "tenant B cannot reach a feature that is only DoD-complete in tenant A's repo", "same featureSlug DoD-complete in two different products never cross-matches journeys" — mirrors `ppc-s1`'s own AC6/AC7 regression shape directly | `integration-real-code` | None |
| AC6 | ✅ | "`_getDodAcList` falls back to GitHub content when no Postgres artefact rows exist", "aggregates AC rows across every DoD-complete story, not just the first" | `integration-real-code` | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None recorded.

---

## Scope Deviations

None. Touch-points matched the DoR contract exactly: `src/web-ui/routes/playback-evidence.js`, `src/web-ui/modules/product-rollup.js` (extraction only — `fetchPipelineState`'s behaviour is identical to the code it was extracted from, confirmed by `syncProductRollup`'s own existing test suite still passing unchanged), `src/web-ui/adapters/journey-store-pg.js` (one field added to the `_sanitise` allowlist), and the new test file. `src/web-ui/modules/journey-store.js` was not modified, as the DoR contract required.

One additional file was touched beyond the original DoR contract's list: `tests/check-ppc-s1-playback-evidence-route.js`. This was necessary, not scope creep — the new fallback's extra async hop exposed a pre-existing dispatch race in that test (`authGuard` never awaits its own callback, so `await router(req, res)` does not reliably run after the real response write). Fixed using the exact same `dispatchAndAwaitResponse` pattern `check-vrne-s1-server-wiring.js` already established for the identical class of race — not a new pattern invented for this story.

---

## Test Plan Coverage

**Tests from plan implemented:** 18 / 18 (6 ACs × integration tests, plus 4 unit tests for `_featureDodStatus`, plus the NFR-SEC test — matches the test plan's own AC Coverage table exactly, no gaps)
**Tests passing in CI:** 18 / 18 in the new file; 21 + 17 + 6 + 3 (unchanged) across `ppc-s1`/`ppc-s2`/`ppc-s3`'s own existing suites, re-run clean after the race-condition fix

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 (3 tests: flat, epic-nested, fetch-failure) | ✅ | ✅ | |
| AC2 (2 tests: reuse/no-second-fetch, scoped+dodComplete) | ✅ | ✅ | |
| AC3 (2 tests: flat, epic-nested) | ✅ | ✅ | |
| AC4 (2 tests: no-repo, query-failure) | ✅ | ✅ | |
| AC5 (2 tests: cross-tenant, slug-collision) | ✅ | ✅ | |
| AC6 (2 tests: fallback-fetch, aggregation) | ✅ | ✅ | |
| `_featureDodStatus` unit tests (4) | ✅ | ✅ | |
| NFR-SEC fail-closed test (1) | ✅ | ✅ | |

**Gaps (tests not implemented):** None against the test plan. The test plan's own stated out-of-scope items (real GitHub truncation-fallback re-testing, load/concurrency testing of the provisioning race) remain correctly out of scope — not newly discovered gaps.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance (fetch only on cold path) | ✅ | "second request ... reuses the provisioned journey, no second GitHub fetch" — direct call-count assertion |
| Security (ADR-025 tenant/product scoping, fail-closed) | ✅ | AC5's two tests plus a dedicated NFR-SEC test asserting `_resolveViaPipelineState` returns `null` when either `tenantId` or `productId` is missing — added as an explicit defense-in-depth guard inside the function itself, not relying solely on the caller's own existing check |
| Accessibility | ✅ N/A | No UI change |
| Audit | ✅ N/A | No new audit requirement beyond what `ppc-s1`/`ppc-s2` already log |

---

## Metric Signal

**Measurement-ready gate:** Not yet — this story removes a false-negative gate on `m1`/`m3`, but real tenant adoption data still requires live tenant usage, which did not occur this session (no test tenant with a connected repo was available).

| Metric | Signal | Evidence | Date measured |
|--------|--------|----------|----------------|
| m1: Self-service DoD validation adoption | not-yet-measured | This story removes a structural blocker (a false 404 for CLI-delivered DoD-complete features) that would have suppressed adoption regardless of real usage — but the metric itself still requires real tenant usage data, which does not exist yet (pre-launch beta, same as `ppc-s1`/`ppc-s2`'s own DoDs record) | null |
| m3: Engineer manual-demo load removed | not-yet-measured | Same reasoning — the blocker this story removes was structural, but the metric requires real adoption to measure | null |

---

## Outcome

**COMPLETE**

No deviations. No test gaps. One file touched beyond the original DoR contract (documented above as necessary, not scope creep). Full regression suite (797 files) re-run clean after this change, aside from 3 pre-existing failures in an unrelated feature's pipeline-state.json entry — found to be blocking CI on every open PR in this repo, and fixed directly as its own separate bookkeeping commit (`9c609c25`, master) before this PR was merged, since it was pre-existing breakage unrelated to this story's own scope.

**Follow-up actions:**
1. Owner: Hamish King — Live verification against a real staging/production tenant with a connected repo (e.g. re-attempt the original ask: open `feature-playback-demo`'s playback-evidence page in production and confirm it now returns 200 with real AC rows instead of 404). No test tenant with a connected repo was available this session to do this directly.
2. Owner: Hamish King — The parked "PPC Capture Live Test" feature (`2026-10-25-ppc-capture-live-test`, sitting at a `/definition-of-ready` chat session) may now be unnecessary, since this fix makes `ppc` work directly against already-DoD-complete features like `feature-playback-demo` without needing a dedicated freshly-built test feature. Not abandoned silently — flagged here for a decision on whether to continue, finish, or discard it.

---

## DoD Observations

1. This story's own build surfaced and fixed a second, unrelated pre-existing defect: 3 missing required schema fields (`name`, `health`, `track`) on the `2026-10-25-ppc-capture-live-test` feature's pipeline-state.json entry, which was silently failing `Validate traceability chain` CI on every open PR in the repo (confirmed via `git show` against `origin/master` before this branch existed). Fixed as its own isolated bookkeeping commit directly on master, not bundled into this PR's own diff, per CLAUDE.md's bundling guidance for unrelated fixes.
2. The fix's core design choice — lazy, on-demand auto-provisioning of a bare journey on a cold miss, rather than a bulk backfill of every existing DoD-complete feature into Postgres — keeps the change bounded to the actual broken request path, matching this codebase's own "no unrequested scope expansion" convention. See `decisions.md`'s 2026-10-25 ARCHITECTURE entry for the full rationale.
3. `product-rollup.js`'s `fetchPipelineState` extraction is a pure refactor with no behavioural change to `syncProductRollup` — confirmed by that function's own pre-existing test suite (`check-pr-s2-product-rollup.js`, `check-psbf-s1-blob-fallback.js`) passing unchanged after the extraction.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Recognise pipeline-state.json DoD-complete features in self-service playback capture (ppc-s4).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
