# Definition of Done: rrc.2 — Add Output 10 (`constraint-index.md`) to `/reverse-engineer`

**Story:** rrc.2 — Add Output 10 — Constraint index to `/reverse-engineer`
**PR:** https://github.com/heymishy/skills-repo/pull/226 — merged 2026-04-30
**ACs to check:** 5 (+ DEC-001)
**Tests from plan:** 13

---

## AC Coverage

| AC | Description | Satisfied? | Evidence | Deviation |
|----|-------------|-----------|----------|-----------|
| AC1 | INITIAL/DEEPEN pass instructs `constraint-index.md` Output 10 with 5-column pipe-delimited format: rule-id, source-file, confidence, disposition, summary | ✅ | 7 tests passing (rrc2-output10-initial-pass, rrc2-output10-deepen-pass, rrc2-format-has-rule-id-column, rrc2-format-has-source-file-column, rrc2-format-has-confidence-column, rrc2-format-has-disposition-column, rrc2-format-has-summary-column) | None |
| AC2 | CHANGE-RISK notation reflected in constraint-index summary column instruction | ✅ | rrc2-change-risk-in-summary-column — 1 test passing | None |
| AC3 | VERIFY pass instructs update of `constraint-index.md` when dispositions change | ✅ | rrc2-verify-updates-constraint-index — 1 test passing | None |
| AC4 | DEFER (Q0=C) does NOT produce Output 10 | ✅ | rrc2-defer-no-output10 — 1 test passing | None |
| AC5 | `check-skill-contracts.js` contract markers intact | ✅ | rrc2-skill-contract-markers-present — 1 test passing | None |
| DEC-001 | `rule-id` format `<layer>-<sequence>` (e.g. L1-001) specified in SKILL.md | ✅ | rrc2-rule-id-format-layer-sequence — 1 test passing | None |

**ACs satisfied: 5/5 + DEC-001**
**Deviations: None**

---

## Out-of-Scope Check

**Boundary verified:** rrc.2 is a SKILL.md-only change to `/reverse-engineer`. Explicitly out of scope: automated injection of constraint-index entries into DoR artefacts (manual pointer only at MVP), JSON/YAML format (plain markdown pipe table), rules with disposition other than PARITY REQUIRED or MIGRATION CANDIDATE.

Confirmed: PR (merged 2026-04-30T07:24:31Z) touches only `/reverse-engineer` SKILL.md — no DoR tooling, no JSON output, no other dispositions added. No out-of-scope violation.

---

## Test Plan Coverage

**Test script:** `tests/check-rrc2-constraint-index.js`
**Result:** 13/13 tests passing
**Test gaps:** None — test plan declared no coverage gaps.

| Test | Result |
|------|--------|
| rrc2-output10-initial-pass | ✅ |
| rrc2-output10-deepen-pass | ✅ |
| rrc2-format-has-rule-id-column | ✅ |
| rrc2-format-has-source-file-column | ✅ |
| rrc2-format-has-confidence-column | ✅ |
| rrc2-format-has-disposition-column | ✅ |
| rrc2-format-has-summary-column | ✅ |
| rrc2-change-risk-in-summary-column | ✅ |
| rrc2-verify-updates-constraint-index | ✅ |
| rrc2-defer-no-output10 | ✅ |
| rrc2-skill-contract-markers-present | ✅ |
| rrc2-rule-id-format-layer-sequence | ✅ |
| rrc2-skill-line-count-within-nfr | ✅ |

---

## NFR Check

| NFR | Constraint | Evidence | Status |
|-----|-----------|----------|--------|
| NFR-rrc-size-re | `/reverse-engineer` SKILL.md ≤ 650 lines (combined rrc.1 + rrc.2 budget ~30 lines) | rrc2-skill-line-count-within-nfr — test passing | ✅ Met |
| NFR-rrc-readability-idx | `constraint-index.md` format is human-readable pipe table in a standard markdown viewer | 5-column pipe table format verified by AC1 column tests; self-describing headers | ✅ Met |
| NFR-rrc-security | No executable code, no scripts, no npm dependencies | SKILL.md-only change confirmed by PR diff | ✅ Met |
| NFR-rrc-no-deps | Zero new npm dependencies | No `package.json` changes in PR | ✅ Met |

---

## Metric Signal

**MM2 — Constraint index coverage in story DoR artefacts:**
No DoR artefacts for legacy-adjacent stories have been written since the constraint-index.md format was defined (merged 2026-04-30). Minimum signal (at least 1 DoR artefact for a legacy-adjacent story referencing `constraint-index.md`) is not yet achievable — requires a future story for a system with an existing corpus.
- **Signal:** not-yet-measured
- **Evidence:** No DoR artefacts for legacy-adjacent stories post-merge.
- **Date measured:** null

---

## Definition of Done: **COMPLETE ✅**

ACs satisfied: 5/5 + DEC-001
Deviations: None
Test gaps: None
NFRs: All met
Metric signal: not-yet-measured (requires a future delivery touching a reverse-engineered system)
