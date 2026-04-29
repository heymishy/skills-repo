# DoR Contract: Add Output 9 — `/discovery` pre-population seed to `/reverse-engineer`

**Story:** rrc.1
**Story artefact:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/stories/rrc.1-discovery-seed-output.md`
**Prepared by:** Copilot
**Date:** 2026-04-30

---

## What will be built

An Output 9 instruction block in `.github/skills/reverse-engineer/SKILL.md` comprising:

1. An entry in the skill's outputs table: **Output 9 — `discovery-seed.md`** stored at `artefacts/[system-slug]/reference/discovery-seed.md`.
2. A format description for `discovery-seed.md` with four named sections: system name, problem framing (derived from REVIEW-disposition rules and known failure modes), known constraints (all PARITY REQUIRED rules using `L<layer>-<seq>` rule-id format), and personas (user types identified in the system).
3. A production instruction: produce Output 9 at the end of any INITIAL or DEEPEN pass.
4. A DEFER conditional: when Q0 outcome is DEFER, Output 9 is NOT produced.
5. A VERIFY-pass update instruction: if any PARITY REQUIRED rule was added, retired, or had its disposition changed since the last pass, the operator must review and update Output 9.

## What will NOT be built

- `/discovery` reading `discovery-seed.md` automatically — that is rrc.3.
- Output 11 (`decompose-input.md`) — deferred to a future story.
- Any validation of `discovery-seed.md` content accuracy for a specific system.
- Any executable code, scripts, or npm dependencies.
- Any changes to files other than `.github/skills/reverse-engineer/SKILL.md`.

## How each AC will be verified

| AC | Test approach | Type | Test ID |
|----|---------------|------|---------|
| AC1: Output 9 instruction with all 4 format sections | Assert SKILL.md contains "Output 9", "discovery-seed.md", "problem framing", "PARITY REQUIRED", personas, INITIAL/DEEPEN trigger | Unit (file content) | T1.1–T1.6 |
| AC2: check-skill-contracts.js still reports 40 skills OK | Run governance check; assert exit 0 and "40 skill(s)" in output | Unit (governance) | T1.7 |
| AC3: DEFER outcome does NOT trigger Output 9 | Assert DEFER block in SKILL.md does not contain "Output 9" production instruction | Unit (file content) | T1.8 |
| AC4: discovery-seed.md format sections correspond to discovery.md template | Assert problem framing → Problem Statement, constraints → Known constraints / assumptions, personas → Who It Affects in template | Unit (cross-file) | T1.9–T1.10 |
| AC5: VERIFY-pass includes Output 9 review instruction | Assert VERIFY section references updating Output 9 when PARITY REQUIRED rules change | Unit (file content) | T1.10 |
| NFR (size ≤ 650 lines) | Assert `wc -l` equivalent reports ≤ 650 | Unit (line count) | T1.6 |

## Assumptions

- The DEFER outcome block is clearly delimited in the current SKILL.md so the conditional exclusion can be placed unambiguously.
- The VERIFY pass section exists as a named section in the current SKILL.md.
- Rule-id format `L<layer>-<seq>` (DEC-001) will be referenced in Output 9's known-constraints section — no new format invented.
- Combined rrc.1 + rrc.2 additions will stay within the 650-line budget; rrc.1 alone is budgeted for ~15 new lines.

## Estimated touch points

**Files:** `.github/skills/reverse-engineer/SKILL.md` (only)
**Services:** None
**APIs:** None
**Test script (read-only after implementation):** `tests/check-rrc1-discovery-seed.js`
