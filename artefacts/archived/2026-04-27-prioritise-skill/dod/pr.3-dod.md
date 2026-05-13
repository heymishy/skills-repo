# Definition of Done: Detect ambiguous single-framework results and explain divergence when multiple frameworks are run

**PR:** https://github.com/heymishy/skills-repo/pull/197 | **Merged:** 2026-04-28
**Story:** artefacts/2026-04-27-prioritise-skill/stories/pr.3.md
**Test plan:** artefacts/2026-04-27-prioritise-skill/test-plans/pr.3-test-plan.md
**DoR artefact:** artefacts/2026-04-27-prioritise-skill/dor/pr.3-dor.md
**Assessed by:** Copilot
**Date:** 2026-04-28

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Test suite verifies tie detection is explicit, with three options offered (tiebreaker pass / manual reorder / accept draw); no silent arbitrary ordering | Automated — tests/check-pr.3.js | None |
| AC2 | ✅ | Test suite verifies rank changes of ≥2 positions between frameworks are flagged as divergence; minor reorders not flagged | Automated — tests/check-pr.3.js | None |
| AC3 | ✅ | Test suite verifies divergence explanation names the specific model difference (e.g. WSJF prioritises job-size efficiency; RICE weights confidence) — not a generic "these frameworks disagree" statement | Automated — tests/check-pr.3.js | None |
| AC4 | ✅ | Test suite verifies three resolution options offered (accept one framework / manual reorder / third-framework tiebreaker); operator decides, skill does not choose | Automated — tests/check-pr.3.js | None |
| AC5 | ✅ | Test suite verifies divergence explanation and operator resolution choice are preserved in scoring record for pr.5 output inclusion | Automated — tests/check-pr.3.js | None |
| AC6 | ✅ | Test suite verifies no second-pass prompt when only one framework run and no tie exists — proceeds directly to output offer | Automated — tests/check-pr.3.js | None |
| NFR | ✅ | T3.10 — `node .github/scripts/check-skill-contracts.js` exits 0; 39 skills, 165 contracts OK | Automated — tests/check-pr.3.js | None |

---

## Scope Deviations

None. Automatic second-pass triggering (without operator confirmation), score averaging across frameworks, and workshopping facilitation of divergence discussion are all confirmed out of scope and not present in the pr.3 SKILL.md additions.

---

## Test Plan Coverage

**Tests from plan implemented:** 10 / 10
**Tests passing in CI:** 10 / 10

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T3.1 — Tie detected explicitly | ✅ | ✅ | |
| T3.2 — Three tiebreaker options offered | ✅ | ✅ | |
| T3.3 — No silent arbitrary ordering on tie | ✅ | ✅ | |
| T3.4 — ≥2 rank position change flagged as divergence | ✅ | ✅ | |
| T3.5 — Minor reorder not flagged | ✅ | ✅ | |
| T3.6 — Model-level divergence explanation (not generic) | ✅ | ✅ | |
| T3.7 — Three resolution options; operator decides | ✅ | ✅ | |
| T3.8 — Resolution choice preserved in scoring record | ✅ | ✅ | |
| T3.9 — No second-pass prompt when no tie / single framework | ✅ | ✅ | |
| T3.10 — NFR: check-skill-contracts.js exits 0 | ✅ | ✅ | |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Skill contract: SKILL.md passes check-skill-contracts.js | ✅ | T3.10 — 39 skills, 165 contracts OK |
| No performance constraint (conversational skill) | ✅ | Not applicable — instruction text only |
| No credentials or external data access | ✅ | Instruction-text only SKILL.md |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Session completion rate | ❌ (0 sessions run) | After first 5 real sessions | pr.3's divergence handling prevents tie/divergence from being a session-ending blocker. Signal requires real sessions. |
| M2 — Rationale completeness | ❌ (0 sessions run) | After first completed multi-framework artefact | Divergence explanation (AC3) is preserved in the artefact as the highest-quality rationale content in a multi-framework session. Signal requires real sessions. |
