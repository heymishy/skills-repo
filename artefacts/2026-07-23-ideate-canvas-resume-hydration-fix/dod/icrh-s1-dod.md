# Definition of Done: Hydrate the ideate canvas from restored session.canvasBlocks on page load/session-resume

**PR:** https://github.com/heymishy/skills-repo/pull/569 (merge commit `b4d03471`) | **Merged:** 2026-07-23T10:25:44Z. Note: the task brief for this DoD pass cited PR #613 — that PR number actually belongs to a later, related-but-separate story (`csd-e1`, "fix(csd-e1): /design and /definition sessions never rendered CANVAS-JSON diagrams"). Verified against `git log` and `gh pr view`: icrh-s1's real merge is PR #569.
**Story:** artefacts/2026-07-23-ideate-canvas-resume-hydration-fix/stories/icrh-s1.md
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|----------------------|-----------|
| AC1 — non-empty `canvasBlocks` on ideate session → init script present, matches exactly | Yes | `check-icrh-s1-ideate-canvas-resume-hydration.js` AC1 block: "AC1: response status 200", "AC1: init script variable present in HTML", "AC1: init script JSON payload is extractable", "AC1: payload parses as an array", "AC1: payload length matches session.canvasBlocks length", "AC1: entry 0 type matches", "AC1: entry 0 title matches", "AC1: entry 1 type matches", "AC1: entry 1 title matches" (9 assertions, all passing) | Unit | None |
| AC2 — empty/absent `canvasBlocks` → no init script | Yes | "AC2: no init script for empty canvasBlocks array", "AC2: no init script when canvasBlocks is absent entirely" (2 assertions, passing) | Unit | None |
| AC3 — non-canvas-supporting session with `canvasBlocks`-shaped field → no leak | Yes | "AC3: a skill outside supportsCanvas (ideate/design/definition) never gets the canvas-blocks init script, even if the field happens to be set" (1 assertion, passing). Note: the test file's own comment records that this boundary case was retargeted from `definition` to `discovery` on 2026-07-26 (post-DoD, story `csd-s3`/`csd-s4`) after `/design` and `/definition` were later added to the canvas-supporting set — an accepted, documented evolution of the same boundary guarantee, not a defect in this story's original fix. | Unit | None |
| AC4 — inline script hydrates via `appendCanvasBlock`, once per entry, in order | Yes | "AC4: inline script calls appendCanvasBlock(block) once per __SW_INITIAL_CANVAS_BLOCKS__ entry, guarded by SUPPORTS_CANVAS", "AC4: entry order preserved -- index 0 is 'First'", "AC4: entry order preserved -- index 1 is 'Second'" (3 assertions, passing) | Unit | None |
| AC5 — full `npm test` regression, no new baseline failures | Yes (self-reported at merge time, not independently re-run this session) | PR #569 body, Test plan section: "Full `npm test` -- zero new regressions vs `tests/known-baseline-failures.json` (all 36 locally-failing files match the documented baseline exactly)." | Integration (self-reported in PR body) | Not independently re-verified in this retroactive pass — brief for this pass supplied only the icrh-s1-scoped unit test's fresh results, not a fresh full-suite run |
| AC6 — real `wuce-staging` deploy + `a4-ideate-session-resume.spec.js` AC2/AC3 re-run passes | **Closed 2026-09-11, see DoD Observation #2** (was: Partial / gap) | Deploy itself confirmed: PR #569 body states "Deployed to real `wuce-staging` (v70, after confirming no concurrent deploy activity...)"; PR comment #2 confirms "Deployed fix (v70) confirmed live on real wuce-staging via `flyctl status`". The automated Playwright spec's own precondition gate (credits top-up + turn-1 render) could not be exercised via the automated harness (see `csvg-s1`'s own findings on why), but the underlying behaviour AC6 exists to prove — canvas re-hydrates correctly from `session.canvasBlocks` on page reload — was directly, live-verified 2026-09-11 against real `wuce-staging`: a real `/ideate` session with 2 real canvas blocks ("Opportunity map", "Assumption inventory") was hard-reloaded, and both blocks plus the full 2688-char chat history rendered correctly from server-persisted state, with zero new `turn-stream` network calls fired on reload. | Live browser verification (network-request + DOM inspection), operator-authenticated session, not the automated Playwright harness | The automated spec itself (`a4-ideate-session-resume.spec.js`) still cannot run end-to-end on CI — its own credits-topup precondition and the real-API-cost blocker (see `csvg-s1`) remain open infrastructure gaps, tracked separately (`srmw-s1`). This closure is a live, direct confirmation of AC6's actual behaviour, not a claim that the automated spec itself now passes in CI. |

---

## Scope Deviations

**AC6 was not conclusively verified against real staging at the time of the original 2026-08-17 DoD pass — closed 2026-09-11, see DoD Observation #2.** The fix was deployed to `wuce-staging` (v70) and CI's Scenario A E2E run went from 2 failures pre-fix to 0 failures post-fix — a genuine regression-free signal — but the one test that specifically exercises this story's behaviour (`a4-ideate-session-resume.spec.js`'s AC2/AC3 canvas-hydration assertion) was skipped rather than executed in that CI run, due to a pre-existing precondition gate unrelated to this fix. The author's own PR comment flagged this honestly and said a manual re-run was in progress, blocked by rate limiting — but no follow-up ever landed. This is consistent with the test plan's own documented contingency ("if it cannot complete, reported as not run, not fabricated as passing") — but the PR's auto-generated Acceptance Criteria audit table nonetheless shows AC6 as ✅, which overstates what was actually observed at that time. AC1-AC5 (all deterministic, staging-independent) fully verified the fix's own correctness regardless of this gap even before the live closure.

No other scope deviations. The story's declared Out of Scope items (data-layer restore, live-SSE rendering path, `/definition`'s separate incremental-hydration gap, CSS/layout changes) were all respected — confirmed by decisions.md and the DoR contract, and none were touched by this fix.

## Test Plan Coverage

- `check-icrh-s1-ideate-canvas-resume-hydration.js` (AC1-AC4): **15 passed, 0 failed** (freshly re-run 2026-08-17, per this session's supplied results) — matches the 15/15 reported at original merge time.
- Full `npm test` (AC5): reported at merge time in PR #569 body as zero new regressions vs `tests/known-baseline-failures.json`; not independently re-run in this retroactive pass.
- `a4-ideate-session-resume.spec.js` AC2/AC3 (AC6): still skipped (not executed) in CI — the automated spec's own precondition gate and the separate `srmw-s1` real-API-cost gap remain open infrastructure issues. The underlying behaviour itself was live-verified directly 2026-09-11 (see DoD Observation #2), outside the automated spec.

## NFR Status

| NFR | Story's stated position | Status |
|-----|--------------------------|--------|
| Performance | Negligible — one extra `JSON.stringify` server-side, one extra client `forEach` | No evidence of measurement beyond the story's own reasoning; consistent with the change's small surface area |
| Security | No new attack surface — `session.canvasBlocks` is server-populated only, HTML-entity-escaped the same way sibling init scripts already are | Confirmed by code-shape description in decisions.md; no dedicated security test, none required per story |
| Accessibility | No DOM/ARIA change — only changes *when* `.canvas-block` elements are created | Consistent with fix reusing the existing `appendCanvasBlock` renderer unmodified |
| Audit | Not applicable | N/A, as declared |

## Metric Signal

No dedicated benefit-metric artefact exists for this story — it is explicit, declared short-track scope per the story's own Benefit Linkage section, which ties the fix instead to the parent feature's existing metric (`2026-07-23-e2e-core-journey-coverage`'s m1, real staging-verified E2E coverage of the core product journey). The mechanism of "metric moved" is indirect: this fix closes a real defect that m1's own E2E gate (`a4-ideate-session-resume.spec.js`) surfaced, and CI's Scenario A run shows 2 fewer failures post-fix than pre-fix — a directionally positive signal for m1 — but, per the AC6 gap above, the specific assertion this story targets was never observed passing on record, so the metric linkage should be read as "consistent with progress" rather than "conclusively closed."

## Outcome

**COMPLETE**

**Follow-up actions:**
1. ~~Re-run `tests/e2e/a4-ideate-session-resume.spec.js`'s AC2/AC3 test against real `wuce-staging`...~~ — the underlying behaviour was directly live-verified 2026-09-11 (see DoD Observation #2), closing the verification gap this action described. The automated spec itself still cannot run end-to-end in CI due to a separate, already-tracked infrastructure gap (`srmw-s1`) — that remains open as its own item, not this story's own follow-up.

---

## DoD Observations

1. Merged 2026-07-23; as of the original DoD pass (2026-08-17, ~4 weeks later) no regression or incident against this fix had surfaced, and a later related story (`csd-s3`/`csd-s4`, 2026-07-26) extended canvas support to `/design`/`/definition` and updated this story's own AC3 boundary test accordingly without needing to touch this fix's code — a reasonable signal of stability in production use.
2. **Backfilled 2026-09-11, following a repo-wide DoD-verification-method stocktake, as part of `csvg-s1`.** `csvg-s1` (`artefacts/2026-08-18-canvas-fix-staging-verification-gap/`) was created specifically to close this AC6 gap plus `icv-s1`'s equivalent one, but itself never progressed past a bare story artefact. Investigating it surfaced a real, already-documented blocker: the real chat UI's streaming endpoint (`handlePostTurnStreamHtml`) never honours `MOCK_LLM_GATEWAY`, so any real browser-driven turn calls the real Anthropic API regardless of the toggle (tracked separately as `srmw-s1`, still unfixed, `stage: definition-of-ready`). Rather than silently attempt a real-cost turn or silently skip the verification, this was surfaced to the operator, who authorized one bounded real turn. That one turn (plus the session's own automatic, cost-free `__init__` priming call, confirmed via `src/web-ui/routes/skills.js:3246`'s "empty thread" guard, not a duplicate/runaway call) produced 2 real canvas blocks with real, coherent LLM-generated content — then a full page reload (zero additional cost) confirmed both blocks and the complete chat history hydrate correctly from server-persisted `session.canvasBlocks`, with no new network calls fired. This directly confirms AC6's real behaviour, even though the automated Playwright spec itself remains blocked by `srmw-s1` and by its own credits-topup precondition for a from-scratch, zero-credit e2e-test tenant.
