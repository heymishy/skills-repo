# Definition of Done: Show a product's own guardrails and standards, read live from its connected repo

**PR:** https://github.com/heymishy/skills-repo/pull/724 | **Merged:** 2026-08-12
**Story:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s2-product-level-guardrails-view.md
**Test plan:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/test-plans/wugs-s2-product-level-guardrails-view-test-plan.md
**DoR artefact:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/dor/wugs-s2-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-12

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `AC1: handleGetGuardrailsView_productHasGuardrailsFile_rendersRealContent` passes | automated test (`tests/check-wugs-s2-product-level-guardrails-view.js`) | None |
| AC2 | ✅ | `AC2: handleGetGuardrailsView_productHasStandardsFolder_listsEntries` passes | automated test | None |
| AC3 | ✅ | `AC3: handleGetGuardrailsView_emptyRepo_showsExplicitEmptyState` passes | automated test | None |
| AC4 | ✅ | `AC4: handleGetGuardrailsView_fetchFails_sectionIsolatedError` passes — asserts named error state plus nav still renders | automated test | None |
| AC5 | ✅ | `AC5: handleGetGuardrailsView_nav_rendersFullSidebarAndActiveProduct` passes | automated test | None |

All 11 tests (5 ACs plus empty/error branch coverage for both pieces, plus `NFR-SEC-01` and route-wiring) re-run fresh against merged `master` (post-merge, not just pre-merge CI) on 2026-08-12: `11 passed, 0 failed`.

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. Confirmed via diff review of the merged PR: no org-level content added (wugs-s3's scope), no editing capability added (Epic 2's scope — the handler is GET-only), no caching layer introduced, and no duplicate GitHub-API call site created outside `wugs-s1`'s `fetchRepoPath` adapter (ADR-012).

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5 (plus additional empty/error branch tests added during code-quality review, beyond the test plan's original 1-test-per-AC minimum)
**Tests passing in CI:** 11 / 11

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1: renders real guardrails content | ✅ | ✅ | Plus empty/error branch tests, added during Task 1 code-quality review |
| AC2: lists real standards entries | ✅ | ✅ | Plus empty/error branch tests, added during Task 2 code-quality review |
| AC3: combined empty-repo state | ✅ | ✅ | Includes a folded-in accessibility (MC-A11Y-02) sub-assertion |
| AC4: isolated per-section error state | ✅ | ✅ | First test to combine a real fetch error with nav-still-renders |
| AC5: nav/activeProductId regression guard | ✅ | ✅ | Implementation-agnostic `/products/:id` link assertion, matching `rapp-s2`'s own established convention |
| NFR-SEC-01: content escaping | ✅ | ✅ | Added during Task 5 |
| Route wiring | ✅ | ✅ | Added during Task 6 |

**Gaps (tests not implemented):** None.

**Pre-existing, unrelated CI note:** none for this story specifically — the 33-file pre-existing baseline (documented in `decisions.md`) was confirmed unrelated to this story's touchpoints (`products.js`, `server.js` wiring) at every task boundary during implementation.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — no hard SLO, GitHub API latency accepted as a known tradeoff | ✅ (as scoped) | Matches `nfr-profile.md`'s stated tradeoff; no caching layer added, per `decisions.md` ARCH entry #4 |
| Performance — reasonable fetch timeout expected | ❌ (gap, RISK-ACCEPTed) | No `AbortController`/timeout wrapper exists in `wugs-s1`'s `fetchRepoPath`/`realFetchRepoPath` adapter, which this story consumes. Found during final story-level review; RISK-ACCEPTed in `decisions.md` (2026-08-12) and logged in `nfr-profile.md`'s Gaps table, since the fix belongs in the already-merged shared adapter, not in this story's own touchpoints. Revisit trigger: before or shortly after `wugs-3`/`wugs-4` ship (both share the same adapter) |
| Security — repo content escaped before rendering (`MC-SEC-01`) | ✅ | `NFR-SEC-01` test confirms `<script>`/`onerror` content is escaped via `_escapeHtml`; code review confirms `_escapeHtml` wraps `guardrailsPiece.value`, `guardrailsPiece.errorMessage`, `e.name` (standards entries), and `standardsPiece.errorMessage` — every interpolation point (`src/web-ui/routes/products.js:1185,1189,1198,1203`) |
| Accessibility — error/empty states via text, not colour alone (`MC-A11Y-02`) | ✅ | `AC3` test's folded-in sub-assertion confirms the empty-state text is a real matchable sentence |

---

## Metric Signal

**Measurement-ready gate:** Is measurement possible yet for this story? **Not yet.**

`m1` ("Guardrail/standard visibility in the web UI") lists this story as a genuine contributing story — this is the first user-facing story in the feature that actually renders guardrails/standards content in the web UI. However, no real tenant has yet used the shipped view in production (it merged moments ago), so no real signal is observable yet.

> **Guardrail/standard visibility in the web UI**
> Signal: not-yet-measured
> Evidence note: wugs-s2 just merged — no real product view has been loaded by an actual tenant yet; org-level content (wugs-s3) and the no-repo fallback (wugs-s4) are still outstanding, so the metric's "100% of active products" target isn't meaningfully assessable until those ship too.
> Date measured: null

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Guardrail/standard visibility in the web UI | ✅ (0%) | After `wugs-s3`/`wugs-s4` ship and a real tenant loads the view | First contributing story to ship; not yet independently measurable |

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:**
1. Add `AbortController`-based timeout handling to `wugs-s1`'s `fetchRepoPath`/`realFetchRepoPath` adapter (`src/web-ui/adapters/artefact-fetcher.js`) before or shortly after `wugs-3`/`wugs-4` ship — owner: Hamish King, tracked via RISK-ACCEPT in `decisions.md` (2026-08-12) and `nfr-profile.md`'s Gaps table.

---

## DoD Observations

1. The story's test plan specified 5 tests (one per AC); the shipped implementation has 11, because two consecutive code-quality reviews (Task 1, Task 2) caught real code paths (`empty`/`error` branches) shipped with zero test coverage and required fixes before approval. This produced materially better coverage than the test plan alone would have, and is worth noting as a pattern: a test plan's "1 test per AC" minimum does not automatically cover every branch a handler's own internal helper functions grow — code-quality review caught what test-plan authoring missed.
2. One redundant test (`NFR-A11Y`, a strict logical subset of the `AC3` test next to it) was caught during Task 3's code-quality review and merged into `AC3` as a documented sub-assertion rather than shipped as a separate, zero-signal test. Tag as a `/improve` candidate: consider whether `/test-plan` or `/implementation-plan` should explicitly warn against writing an NFR test using the exact same mock/assertion shape as an adjacent AC test.
3. The missing-fetch-timeout NFR gap (see Follow-up actions) was present in `wugs-s1`'s adapter from that story's own merge, but wasn't caught until `wugs-s2`'s final story-level review actually exercised and read that adapter's code closely. Tag as a `/improve` candidate: NFR checks stated in a story's own DoR (e.g. "a reasonable fetch timeout... is expected") should perhaps be verified against the actual shared-adapter code they depend on at DoR time, not just at final review of a downstream consumer.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Show a product's own guardrails and standards, read live from its connected repo.
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
