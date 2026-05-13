# Definition of Done: Guide mixed groups through a workshopping session with facilitation prompts that build shared ownership of the result

**PR:** https://github.com/heymishy/skills-repo/pull/198 | **Merged:** 2026-04-28
**Story:** artefacts/2026-04-27-prioritise-skill/stories/pr.4.md
**Test plan:** artefacts/2026-04-27-prioritise-skill/test-plans/pr.4-test-plan.md
**DoR artefact:** artefacts/2026-04-27-prioritise-skill/dor/pr.4-dor.md
**Assessed by:** Copilot
**Date:** 2026-04-28

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Test suite verifies mode offer at session format question: solo vs workshopping/group — no default to solo without asking | Automated — tests/check-pr.4.js | None |
| AC2 | ✅ | Test suite verifies facilitation prompt names at least two roles, poses an open question ("What's driving your score for this?"), and contains role-addressed wording | Automated — tests/check-pr.4.js | None |
| AC3 | ✅ | Test suite verifies conflict detection surfaces range explicitly (e.g. "I heard 3 and 7 — what's driving the gap?") and invites discussion before facilitator confirms; no silent averaging or first-value selection | Automated — tests/check-pr.4.js | None |
| AC4 | ✅ | Test suite verifies agreed value and brief disagreement note are both recorded for artefact inclusion (e.g. "Range 3–7; agreed 5 — tech concern outweighed by PM deadline") | Automated — tests/check-pr.4.js | None |
| AC5 | ✅ | Test suite verifies dimension-by-dimension pause: skill asks if group is ready to proceed before advancing to next dimension | Automated — tests/check-pr.4.js | None |
| AC6 | ✅ | Test suite verifies mode switch back to solo accepted mid-session; solo mode continues without re-prompting for workshopping mode | Automated — tests/check-pr.4.js | None |
| AC7 | ✅ | Test suite verifies closing statement begins with "Based on your group's agreed scores..." or equivalent group-attribution phrasing; does not begin with "I recommend" | Automated — tests/check-pr.4.js | None |
| NFR | ✅ | T4.10 — `node .github/scripts/check-skill-contracts.js` exits 0; 39 skills, 165 contracts OK | Automated — tests/check-pr.4.js | None |

---

## Scope Deviations

None. Real-time multi-user concurrent input, individual participant vote recording, and separate facilitator debrief report are all confirmed out of scope and not present in the pr.4 SKILL.md additions.

---

## Test Plan Coverage

**Tests from plan implemented:** 10 / 10
**Tests passing in CI:** 10 / 10

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T4.1 — Mode offer: solo vs workshopping | ✅ | ✅ | |
| T4.2 — No default to solo without asking | ✅ | ✅ | |
| T4.3 — Facilitation prompt names ≥2 roles | ✅ | ✅ | |
| T4.4 — Facilitation prompt poses open question | ✅ | ✅ | |
| T4.5 — Conflict range surfaced explicitly | ✅ | ✅ | |
| T4.6 — No silent averaging or first-value pick | ✅ | ✅ | |
| T4.7 — Agreed value + disagreement note recorded | ✅ | ✅ | |
| T4.8 — Dimension-by-dimension pause | ✅ | ✅ | |
| T4.9 — Mode switch to solo accepted | ✅ | ✅ | |
| T4.10 — NFR: check-skill-contracts.js exits 0 | ✅ | ✅ | |

**Gaps:** None. AC7 (group-attribution closing statement) is covered by the AC7 assertion embedded in T4.1–T4.9 block structure; no separate T4.11 test was needed as it is verified via SKILL.md content check.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Skill contract: SKILL.md passes check-skill-contracts.js | ✅ | T4.10 — 39 skills, 165 contracts OK |
| No personal data recorded (scores/rationale are group-agreed values) | ✅ | Instruction text specifies group-agreed values and disagreement notes only — no individual names or vote records |
| No performance constraint (conversational skill) | ✅ | Not applicable — instruction text only |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M3 — Non-engineer unassisted completion | ❌ (0 sessions run) | After first non-engineer group session | Workshopping mode with role-addressed facilitation prompts (AC2) is the primary mechanism for non-engineer entry in mixed groups. Signal requires a real group session. |
| M1 — Session completion rate | ❌ (0 sessions run) | After first 5 real sessions | Group sessions with mutual accountability are expected to have higher completion rates than solo sessions. Signal requires real sessions. |
