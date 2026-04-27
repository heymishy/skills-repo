# Definition of Done: Accept candidate items and guide framework selection with rationale at session open

**PR:** https://github.com/heymishy/skills-repo/pull/195 | **Merged:** 2026-04-28
**Story:** artefacts/2026-04-27-prioritise-skill/stories/pr.1.md
**Test plan:** artefacts/2026-04-27-prioritise-skill/test-plans/pr.1-test-plan.md
**DoR artefact:** artefacts/2026-04-27-prioritise-skill/dor/pr.1-dor.md
**Assessed by:** Copilot
**Date:** 2026-04-28

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | T1.1 (WSJF names 'cost of delay'), T1.2 (RICE names all four factors), T1.3 (MoSCoW names all four buckets) — all 3 passing | Automated — tests/check-pr.1.js | None |
| AC2 | ✅ | T1.4 (intake acknowledgement pattern), T1.5 (missing-context prompt) — both passing | Automated — tests/check-pr.1.js | None |
| AC3 | ✅ | T1.6 (suggestion names framework + reason), T1.7 (explicit confirm/override invitation) — both passing | Automated — tests/check-pr.1.js | None |
| AC4 | ✅ | T1.8 (override acceptance without re-arguing) — passing | Automated — tests/check-pr.1.js | None |
| AC5 | ✅ | T1.9 (≤2 clarifying questions before suggestion) — passing | Automated — tests/check-pr.1.js | None |
| AC6 | ✅ | T1.10 / NFR check: `node .github/scripts/check-skill-contracts.js` reports 0 violations — 39 skills, 165 contracts OK | Automated — tests/check-pr.1.js | None |
| AC7 | ✅ | T1.11–T1.13 (context-read section present; reads discovery/state before asking; opens with context summary) — all 3 passing | Automated — tests/check-pr.1.js | AC7 was not in the original story — added during implementation (PR #195) to codify context-aware opening. Added to story by PR author; no scope deviation relative to final agreed story scope. |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.
Deviations are not necessarily failures — they must be recorded and will be surfaced by /trace.

---

## Scope Deviations

None. AC7 (context-read before asking) was a scoped addition agreed during implementation and is present in the story artefact — it is within scope.

---

## Test Plan Coverage

**Tests from plan implemented:** 13 / 13
**Tests passing in CI:** 13 / 13

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T1.1 — WSJF names cost of delay | ✅ | ✅ | |
| T1.2 — RICE names all four factors | ✅ | ✅ | |
| T1.3 — MoSCoW names all four buckets | ✅ | ✅ | |
| T1.4 — Intake acknowledgement | ✅ | ✅ | |
| T1.5 — Missing context prompt | ✅ | ✅ | |
| T1.6 — Suggestion names framework + reason | ✅ | ✅ | |
| T1.7 — Explicit confirm/override invitation | ✅ | ✅ | |
| T1.8 — Override acceptance | ✅ | ✅ | |
| T1.9 — ≤2 clarifying questions | ✅ | ✅ | |
| T1.10 — Skill contract (AC6) | ✅ | ✅ | |
| T1.11 — Context-read section present (AC7) | ✅ | ✅ | |
| T1.12 — Reads discovery/state before asking (AC7) | ✅ | ✅ | |
| T1.13 — Opens with context summary (AC7) | ✅ | ✅ | |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Skill contract: SKILL.md passes check-skill-contracts.js | ✅ | `node .github/scripts/check-skill-contracts.js` — 39 skills, 165 contracts OK |
| No embedded HTML except HTML comments | ✅ | NFR test T1.NFR in check-pr.1.js — passing |
| No credentials or external data access | ✅ | Instruction-text only SKILL.md — no code, no credentials |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M3 — Non-engineer unassisted completion | ❌ (0 sessions run) | After first real non-engineer session | Skill ships with AC1 framework descriptions designed for non-engineer entry. M3 requires an observed non-engineer session to measure. |
| MM1 — Cold-start replication | ❌ (0 sessions run) | After first cold-start operator run | Skill's opening guidance section is present. Signal measurable once a second operator runs the skill without author assistance. |

**Measurement gap acknowledged (from benefit-metric.md):** M1 requires a session-started denominator that is currently untracked (honour-system self-count for v1). This gap was identified at benefit-metric definition and accepted for v1.
