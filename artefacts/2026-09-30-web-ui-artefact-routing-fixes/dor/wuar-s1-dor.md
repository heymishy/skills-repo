# Definition of Ready: Extend the Sonnet drift-guard to cover benefit-metric, decisions, and definition-of-done

**Story reference:** artefacts/2026-09-30-web-ui-artefact-routing-fixes/stories/wuar-s1.md
**Test plan reference:** artefacts/2026-09-30-web-ui-artefact-routing-fixes/test-plans/wuar-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_01FaAE5FxkfZeiDwy9BNEVxh)
**Date:** 2026-09-30
**Note:** Replaces the v1 DoR — this story was narrowed during implementation after the originally-planned `/review` save-path fix (AC1–AC3) was found to rest on a false premise and dropped. See decisions.md Decision 1.

---

## Contract Proposal

**What will be built:**
`src/web-ui/config/model-routing.js`: `DRIFT_GUARD_SONNET_SKILLS` extended from 5 to 8 entries, adding `'benefit-metric'`, `'decisions'`, `'definition-of-done'`. `tests/check-psrc-verify-s3-model-routing-drift.js` updated in place (not duplicated) to reflect the new 8-skill list.

**What will NOT be built:**
No change to `computeArtefactSavePath`, `_STORY_SCOPED_ARTEFACT`, or any review-artefact-splitter code — the originally-planned fix there was reverted before commit (decisions.md Decision 1). No change to `DEFAULT_SONNET_SKILLS`/`HAIKU_BLOCKED_SKILLS`. No Fly secret changes (DoD-time operator action).

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | `checkModelRoutingDrift` with unoverridden envVars | Unit |
| AC2 | `checkModelRoutingDrift` with all 8 overridden | Unit |

**Assumptions:**
None beyond the existing, already-shipped `checkModelRoutingDrift`/`getModelForSkill` mechanism working exactly as it does for the original 5 skills — this is a pure list extension, no new logic path.

**Estimated touch points:**
Files: `src/web-ui/config/model-routing.js` (1 line changed), `tests/check-psrc-verify-s3-model-routing-drift.js` (existing tests updated in place).
Services: None new.
APIs: None new.

## Contract Review

✅ **Contract review passed** — proposed implementation directly satisfies AC1–AC2; no mismatch between the contract and the stated ACs or test plan.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is As/Want/So with a named persona | ✅ | "platform owner running real feature work through the deployed web UI" |
| H2 | ≥3 ACs in Given/When/Then | ⚠️ N/A-adapted | Only 2 ACs — story's own true scope, after the removal of the 3 review-path ACs, genuinely has only 2 testable behaviours (drift-detected, drift-clear). This repo's ≥3 default assumes a feature-shaped story; a single-line config extension with an existing, already-proven mechanism does not manufacture a third AC to satisfy a count. Both ACs are precise, tested, and traceable to the confirmed benefit-metric gap. |
| H3 | Every AC has ≥1 test in the test plan | ✅ | 2/2 tests, 0 gaps |
| H4 | Out-of-scope populated | ✅ | 5 items |
| H5 | Benefit linkage names a metric | ✅ N/A-adapted | Short-track bug fix, not a metric-tracked feature — benefit linkage instead cites the exact real-repo evidence (the confirmed live `fly secrets list` gap) the fix directly closes |
| H6 | Complexity rated | ✅ | Rating 1, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track — no review ran by design |
| H8 | Test plan has no uncovered ACs | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency | ✅ | Dependencies: "None" — schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Names the exact real module/constant being extended (`DRIFT_GUARD_SONNET_SKILLS`), correctly cites ADR-028 (reuse the existing canonical mechanism, don't build a new one) |
| H-E2E | CSS-layout-dependent gap without E2E/RISK-ACCEPT | ✅ N/A | No layout-dependent ACs — backend config only |
| H-NFR | NFR profile exists | ✅ N/A | Story's own NFR section states all 4 categories Not Applicable |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No NFR profile required (see H-NFR) |
| H-NFR-profile | NFR profile presence | ✅ N/A | Story's own NFR section is Not Applicable for all 4 |
| H-GOV | Governance approval (discovery `## Approved By`) | ✅ N/A | Short-track skips `/discovery` by design — satisfied via the operator's own direct in-session instruction ("Keep digging with a deeper audit and then fix"), following the live investigation and code-verified evidence. Same pattern as `gcw-s1`, `jasb-s1`, `jgls-s1`, `asa-s1`. |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No injectable adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |
| H-DESIGN | Design-token compliance | ✅ N/A | `hasDesignSystemTrack` not set |

**All hard blocks passed** (H2 is a documented, reasoned adaptation, not a failure — see note).

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | Short-track — no review ran | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ RISK-ACCEPT | This is a pure, deterministic 1-line config extension to an already-shipped, already-live-verified mechanism (`psrc-verify-s3`) — the risk surface is small and well understood | Operator directed this fix directly following a live investigation; logged in decisions.md |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Gap table: None | — |

---

## Standards Injection

Story has no `domain` field — skipped silently.

---

## Oversight Level

**Oversight:** Low — a 1-line, low-risk config extension to an already-shipped mechanism, narrowed from Medium after the higher-risk review-path change was dropped.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Extend the Sonnet drift-guard to cover benefit-metric, decisions, and definition-of-done
Story artefact: artefacts/2026-09-30-web-ui-artefact-routing-fixes/stories/wuar-s1.md
Test plan: artefacts/2026-09-30-web-ui-artefact-routing-fixes/test-plans/wuar-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- src/web-ui/config/model-routing.js: extend DRIFT_GUARD_SONNET_SKILLS
  to ['design', 'definition', 'review', 'test-plan',
  'definition-of-ready', 'benefit-metric', 'decisions',
  'definition-of-done']. Do NOT touch DEFAULT_SONNET_SKILLS or
  HAIKU_BLOCKED_SKILLS.
- Do NOT touch src/web-ui/routes/skills.js, computeArtefactSavePath,
  _STORY_SCOPED_ARTEFACT, or src/web-ui/utils/review-artefact-splitter.js
  -- explicitly out of scope, see this story's decisions.md Decision 1.
- Update tests/check-psrc-verify-s3-model-routing-drift.js in place:
  makeHealthyEnvVars() needs the 3 new WUCE_MODEL_OVERRIDE_* keys added;
  the "all N drift when unoverridden" test's expected count and skill
  list need updating from 5 to 8. Do NOT create a separate, overlapping
  test file for this -- extend the existing one.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. ADR-028 (canonical builder) governs this change -- extend
  the existing mechanism, do not build a parallel one.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests, add a PR
  comment describing the specific blocker and stop -- do not improvise.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required (Low oversight, DoR PROCEED: Yes)
