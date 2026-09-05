# Definition of Done: Fix artefact detail links so nested and archived artefacts resolve instead of 404ing

**PR:** https://github.com/heymishy/skills-repo/pull/840 | **Merged:** 2026-09-05 (commit `34f24d3cf332216d5e0abf1b9dbbf27e67063d1b`)
**Story:** artefacts/2026-09-06-artefact-detail-link-resolution-fix/stories/adlr-s1-fix-artefact-detail-link-resolution.md
**Test plan:** artefacts/2026-09-06-artefact-detail-link-resolution-fix/test-plans/adlr-s1-test-plan.md
**DoR artefact:** artefacts/2026-09-06-artefact-detail-link-resolution-fix/dor/adlr-s1-dor.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-06

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `check-adlr-s1-artefact-link-resolution.js` — link generation encodes the full relative path for nested, archived, and root-level cases | automated unit | None |
| AC2 | ✅ | Same file — direct resolution with exactly 1-2 fetch calls, no subdirectory guessing for a slash-containing input | automated unit | None |
| AC3 | ✅ | Same file — `archived/` prefix fallback confirmed for both nested and root-level types | automated unit | None |
| AC4 | ✅ | Same file — existing root-level, non-archived resolution unchanged (regression guard) | automated unit | None |
| AC5 | ✅ | Same file — bare legacy input resolved via bounded subdirectory probe; genuinely-missing bare input exhausts all candidates and throws within a bounded call count | automated unit | None |
| AC6 | ✅ | Live production verification, post-deploy: `2026-07-05-product-stds-hierarchy`'s DoR link (`dor%2Fpsh-s1-dor`) renders real content; `2026-04-14-skills-platform-phase3` (archived)'s root-level `discovery` link and nested `dod%2Fp3.3-...-dod` link both render real content instead of "artefact not found" | manual (live production verification) | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. Deviations are not necessarily failures — they must be recorded and will be surfaced by `/trace`.

---

## Scope Deviations

None against the ACs as written. Two adjacent-looking defects found during this story's own investigation were deliberately excluded from scope, not silently absorbed:
- A dead `/artefacts/:path` (plural) route referenced by `listArtefacts`'s own unused `viewUrl` field — no handler exists for it anywhere.
- `commit-view.js`'s post-commit "View artefact" link, confirmed currently unreachable for an unrelated, pre-existing reason (`getCommitResult` never wired via `setGetCommitResult`).

Both logged as follow-ups in `workspace/capture-log.md` (2026-09-06) rather than fixed here.

---

## Test Plan Coverage

**Tests from plan implemented:** 15 / 15
**Tests passing in CI:** 15 / 15 — confirmed via PR #840's own CI run and directly, locally, before merge. Full suite: 621 files, 2 failures — both confirmed pre-existing/unrelated (`check-p3.5-validate-trace.js`'s known baseline; `check-pcr-s1-test-runner.js`'s timing-sensitive perf threshold, ~3% over, reproduces standalone regardless of this diff). Directly-relevant regression suites all unaffected: `check-wuce2-read-render-artefact` (54/54), `check-wugs-s14` (5/5), `check-wugs-s1` (6/6), `check-avpf-s1` (15/15), `check-fapg-s1` (7/7), `check-bsgm-s1` (8/8), `check-sri-s1` (10/10).

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 nested/archived/root-level link generation (3 tests) | ✅ | ✅ | `check-adlr-s1-artefact-link-resolution.js` |
| AC2 direct resolution, no guessing for nested input (2 tests) | ✅ | ✅ | Same file |
| AC3 archived fallback, nested and root-level (2 tests) | ✅ | ✅ | Same file |
| AC4 root-level regression guard (1 test) | ✅ | ✅ | Same file |
| AC5 bare-input probe success and bounded exhaustion (2 tests) | ✅ | ✅ | Same file |

**TDD verification performed (RED confirmed, not assumed):** all fetcher-resolution assertions (AC2/AC3/AC5) were confirmed failing for the right reason before `fetchArtefact`'s resolution-order change landed (wrong call counts, uncaught `ArtefactNotFoundError` for the archived-fallback cases); all 15 passing after. AC1's link-generation tests were confirmed failing against the original bare-basename extraction before the `_relativeArtefactPath` helper was added.

**Coverage gap audit (Step 4):** AC6 is the story's own designated manual-verification AC (per the DoR contract's own RISK-ACCEPT — the fix touches real GitHub-hosted repo content, which cannot be meaningfully simulated beyond what AC1–AC5's unit tests already prove at the resolution-logic layer). Executed directly against real production across three distinct scenarios (nested/non-archived, root-level/archived, nested/archived — the compound case), not deferred: `layoutGapsAtMerge`: **false** — the gap was open at merge (deploy pipeline was still in flight) but is now closed as of this DoD, with concrete evidence recorded above.

**Gaps (tests not implemented):**
None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — bounded worst-case latency for a genuinely-missing bare-name artefact | ✅ | AC5's "exhausts all candidates" test asserts a hard ceiling (≤24 calls); the fallback-probe phase (only reached for bare, no-slash inputs) uses a reduced 3-second timeout per attempt specifically so this worst case doesn't compound to minutes. Every correctly-generated link (the overwhelming majority going forward) resolves in 1-2 requests at the normal timeout. |
| Security — none identified | ✅ N/A | Pure routing/adapter change, no new input surface beyond decoding an already-percent-encoded URL segment (standard `decodeURIComponent`, wrapped in try/catch for malformed sequences) |
| Accessibility — not applicable | ✅ N/A | No markup or interaction change beyond the `href` value itself |
| Audit — not applicable | ✅ N/A | No new state-changing action introduced |

---

## Metric Signal

No formal benefit-metric artefact exists for this short-track story (per `CLAUDE.md`'s short-track convention). The story's own "Benefit linkage" section names the defect closed directly: 93.5% of all artefact files repo-wide (4,606/4,926) were unreachable via the web UI. First signal: confirmed closed in production 2026-09-06 via direct verification of all three distinct resolution paths (nested, archived-root-level, archived-nested) — each previously 404ing, each now rendering real content.

---

## Outcome

**COMPLETE**

All 6 ACs satisfied with concrete, automated (AC1–AC5) and direct live-production (AC6) evidence, covering every distinct resolution path this defect affected. No scope deviations against the ACs as written. No test gaps.

**Follow-up actions:**
1. The dead `/artefacts/:path` (plural) route — needs a dedicated pass to either wire it up properly or remove the dead `viewUrl` computation in `listArtefacts` (logged in `workspace/capture-log.md`, 2026-09-06).
2. `commit-view.js`'s unreachable post-commit link — a genuine D37 injectable-adapter wiring gap (`getCommitResult` never wired), needing its own scoping pass to determine the real implementation and wire it (logged in `workspace/capture-log.md`, 2026-09-06).

---

## DoD Observations

1. **A defect reported as scoped to one page turned out to affect 93.5% of the entire platform's artefacts.** The operator's report named a single feature; direct code tracing (not assumption) revealed the true root cause lived in shared link-generation and fetch-adapter code affecting every feature. Worth reinforcing as a standing practice: when a "this one page is broken" report traces back to shared infrastructure code rather than page-specific data, always check whether the blast radius is wider before scoping the fix narrowly.
2. **An already-correct computation existed one layer away from where it was needed.** `listArtefacts` had already solved the "what is this artefact's real relative path, including the archived/ prefix" problem (via `aada-s1`'s own earlier fix) — the consuming code in `features.js` simply never used it, rebuilding a cruder, buggy version from scratch instead. Before designing a fix for a resolution/path-construction bug, check whether the correct logic already exists elsewhere in the same call chain and is just not being consumed, rather than re-deriving it independently.
3. **Investigating one defect surfaced two more, both correctly left alone rather than folded in.** The dead `/artefacts/:path` route and `commit-view.js`'s unwired-adapter issue both looked adjacent to this story's own symptom but had genuinely different root causes and different fix shapes (dead code cleanup vs. adapter wiring vs. this story's resolution-order fix). Bundling them in would have either produced speculative fixes for problems not fully understood, or silently expanded scope beyond what was reviewed at DoR. Keeping them as separate, explicitly-logged follow-ups preserved both delivery speed and correctness.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Fix artefact detail links so nested and archived artefacts resolve instead of 404ing" (adlr-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Is the AC6 manual verification backed by actual observations covering all 3 distinct resolution paths (nested, archived-root, archived-nested), not just the originally-reported case?
4. Are the two explicitly-out-of-scope follow-ups (dead plural route, unwired commit-view adapter) tracked somewhere durable, not just mentioned in passing?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
