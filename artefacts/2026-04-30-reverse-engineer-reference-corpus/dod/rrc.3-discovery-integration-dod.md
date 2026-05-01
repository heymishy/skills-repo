# Definition of Done: rrc.3 — Integrate `constraint-index.md` reading into `/discovery`

**Story:** rrc.3 — Integrate `constraint-index.md` reading into `/discovery`
**PR:** https://github.com/heymishy/skills-repo/pull/228 — merged 2026-04-30
**ACs to check:** 5 (+ 2 review findings: 3-L1, 3-L2)
**Tests from plan:** 9

---

## AC Coverage

| AC | Description | Satisfied? | Evidence | Deviation |
|----|-------------|-----------|----------|-----------|
| AC1 | `/discovery` SKILL.md checks for `discovery-seed.md` in `artefacts/[system-slug]/reference/` at session start; pre-populates problem framing, known constraints, personas if found | ✅ | rrc3-discovery-seed-check (2 tests: file-check instruction + pre-population of sections) — passing | None |
| AC2 | `constraint-index.md` entries added to existing `## Constraints` section (not a new heading) | ✅ | rrc3-constraint-index-uses-existing-section, rrc3-no-new-constraints-heading — 2 tests passing; review finding 3-L1 explicitly tested | None |
| AC3 | Check is conditional — no error, warning, or corpus reference when neither file exists | ✅ | rrc3-absent-corpus-no-error — 1 test passing | None |
| AC4 | `check-skill-contracts.js` contract markers for `/discovery` unchanged | ✅ | rrc3-discovery-contracts-intact — 1 test passing | None |
| AC5 | Operator override of pre-populated constraints is accepted; seed is advisory not mandatory | ✅ | rrc3-operator-override-instruction — 1 test passing | None |
| 3-L1 | Uses existing `## Constraints` heading, not a new "Known legacy constraints" heading | ✅ | rrc3-no-new-constraints-heading — 1 test passing (also covered by AC2 evidence above) | None |
| 3-L2 | SKILL.md includes disambiguation instruction when operator does not name a system | ✅ | rrc3-system-slug-disambiguation — 1 test passing | None |

**ACs satisfied: 5/5 + review findings 3-L1, 3-L2**
**Deviations: None**

---

## Out-of-Scope Check

**Boundary verified:** rrc.3 is a SKILL.md-only change to `/discovery`. Explicitly out of scope: reading `decompose-input.md` (Output 11 — deferred), modifying the discovery approval gate or any discovery section other than Reference materials and Constraints, modifying the discovery artefact template.

PR (merged 2026-04-30T08:54:24Z): SKILL.md-only change to `/discovery`. No template modifications, no new sections beyond Constraints. No out-of-scope violation.

---

## Test Plan Coverage

**Test script:** `tests/check-rrc3-discovery-integration.js`
**Result:** 9/9 tests passing
**Test gaps:** NFR line budget (reasonableness check only — hard upper bound of 50 added lines, not a strict 15–20 limit). Noted in test plan as partial coverage; accepted by operator as acceptable tolerance.

| Test | Result |
|------|--------|
| rrc3-discovery-seed-check (×2) | ✅ |
| rrc3-constraint-index-uses-existing-section | ✅ |
| rrc3-no-new-constraints-heading | ✅ |
| rrc3-absent-corpus-no-error | ✅ |
| rrc3-discovery-contracts-intact | ✅ |
| rrc3-operator-override-instruction | ✅ |
| rrc3-system-slug-disambiguation | ✅ |
| rrc3-discovery-line-count-reasonable | ✅ |

---

## NFR Check

| NFR | Constraint | Evidence | Status |
|-----|-----------|----------|--------|
| NFR-rrc-size-disc | `/discovery` SKILL.md additions ≤ ~20 lines (NFR) / ≤ 50 lines (test tolerance) | rrc3-discovery-line-count-reasonable — test passes with 50-line tolerance; actual additions within acceptable range | ✅ Met (within tolerance) |
| NFR-rrc-security | No executable code, no scripts, no npm dependencies | SKILL.md-only change confirmed by PR diff | ✅ Met |
| NFR-rrc-no-deps | Zero new npm dependencies | No `package.json` changes in PR | ✅ Met |

**Note on size NFR:** The test plan acknowledged this NFR as partially covered (operator judgement). The test uses a 50-line ceiling as a reasonableness check; the actual story NFR targets ~15–20 lines. Test passes; no deviation recorded beyond the test plan's noted tolerance.

---

## Metric Signal

**MM1 — Discovery pre-population time saved:**
rrc.3 completes the mechanism that makes MM1 measurable. `/discovery` now proactively surfaces `discovery-seed.md` and `constraint-index.md` when they exist. Minimum signal (one /discovery run using a seed, producing a pre-populated constraints section the operator did not write manually) is not yet achievable — requires a real system with a completed INITIAL reverse-engineering pass, followed by a seeded discovery run.
- **Signal:** not-yet-measured
- **Evidence:** No real operator sessions using the seeded /discovery path since merge.
- **Date measured:** null

---

## Definition of Done: **COMPLETE ✅**

ACs satisfied: 5/5 + 3-L1 + 3-L2
Deviations: None
Test gaps: NFR line budget — partial coverage only (test uses 50-line tolerance; actual additions within range; accepted)
NFRs: All met (within tolerance)
Metric signal: not-yet-measured (mechanism in place; awaiting first real corpus + seeded discovery session)
