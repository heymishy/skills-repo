# Definition of Done: rrc.1 — Add Output 9 (`discovery-seed.md`) to `/reverse-engineer`

**Story:** rrc.1 — Add Output 9 — `/discovery` pre-population seed to `/reverse-engineer`
**PR:** https://github.com/heymishy/skills-repo/pull/225 — merged 2026-04-30
**ACs to check:** 5
**Tests from plan:** 10

---

## AC Coverage

| AC | Description | Satisfied? | Evidence | Deviation |
|----|-------------|-----------|----------|-----------|
| AC1 | INITIAL/DEEPEN pass instructs `discovery-seed.md` Output 9 with all 4 format sections: system name, problem framing, known constraints block, personas block | ✅ | rrc1-output9-initial-pass, rrc1-output9-deepen-pass, rrc1-seed-has-system-name, rrc1-seed-has-problem-framing, rrc1-seed-has-constraints-block, rrc1-seed-has-personas-block — 6 tests passing | None |
| AC2 | `check-skill-contracts.js` reports 40 skills and all contract markers intact — Output 9 addition did not break contracts | ✅ | rrc1-skill-contract-markers-present — 1 test passing; governance gate confirmed via PR CI | None |
| AC3 | DEFER (Q0 outcome C) does NOT trigger Output 9 production | ✅ | rrc1-defer-outcome-no-output9 — 1 test passing | None |
| AC4 | `discovery-seed.md` format sections correspond to named sections in `discovery.md` template | ✅ | rrc1-seed-maps-to-discovery-template (2 tests) — seed section names verified against discovery.md template sections | None |
| AC5 | VERIFY pass instructs review and update of Output 9 when PARITY REQUIRED rules changed since last pass | ✅ | rrc1-verify-pass-updates-output-9 — 1 test passing | None |

**ACs satisfied: 5/5**
**Deviations: None**

---

## Out-of-Scope Check

**Boundary verified:** rrc.1 is a SKILL.md-only change to `/reverse-engineer`. Explicitly out of scope: `/discovery` reading `discovery-seed.md` automatically (that is rrc.3, which merged in this feature), Output 11 (`decompose-input.md`), and correctness verification of seed content for specific systems.

The PR (merged 2026-04-30T06:32:25Z) is a SKILL.md-only change — no code, no scripts, no npm dependencies. Confirmed not in scope boundary violation.

---

## Test Plan Coverage

**Test script:** `tests/check-rrc1-discovery-seed.js`
**Result:** 10/10 tests passing
**Test gaps:** None — test plan declared no coverage gaps. All ACs testable by reading SKILL.md content.

| Test | Result |
|------|--------|
| rrc1-output9-initial-pass | ✅ |
| rrc1-output9-deepen-pass | ✅ |
| rrc1-seed-has-system-name | ✅ |
| rrc1-seed-has-problem-framing | ✅ |
| rrc1-seed-has-constraints-block | ✅ |
| rrc1-seed-has-personas-block | ✅ |
| rrc1-defer-outcome-no-output9 | ✅ |
| rrc1-seed-maps-to-discovery-template (×2) | ✅ |
| rrc1-verify-pass-updates-output-9 | ✅ |

---

## NFR Check

From `artefacts/2026-04-30-reverse-engineer-reference-corpus/nfr-profile.md`:

| NFR | Constraint | Evidence | Status |
|-----|-----------|----------|--------|
| NFR-rrc-size-re | `/reverse-engineer` SKILL.md ≤ 650 lines after rrc.1 + rrc.2 | rrc1-skill-line-count-within-nfr — test passing | ✅ Met |
| NFR-rrc-readability-seed | `discovery-seed.md` format must be plain markdown, human-readable without tooling | Format defined in SKILL.md as headed markdown sections — verified via AC4 template alignment test | ✅ Met |
| NFR-rrc-security | No executable code, no scripts, no npm dependencies | SKILL.md-only change confirmed by PR diff; `check-skill-contracts.js` passes | ✅ Met |
| NFR-rrc-no-deps | Zero new npm dependencies | No `package.json` changes in PR; governance check passes | ✅ Met |

---

## Metric Signal

**MM1 — Discovery pre-population time saved:**
No real `/discovery` sessions have been run using `discovery-seed.md` since merge (2026-04-30). The output format is defined and tested. Minimum signal (one /discovery run using a discovery-seed.md producing a seeded constraints section) is not yet achievable — requires a real reverse-engineering session followed by a seeded discovery run.
- **Signal:** not-yet-measured
- **Evidence:** No real operator sessions recorded using Output 9 post-merge.
- **Date measured:** null

---

## Definition of Done: **COMPLETE ✅**

ACs satisfied: 5/5
Deviations: None
Test gaps: None
NFRs: All met
Metric signal: not-yet-measured (no real sessions possible before first corpus exists)
