# Test Plan: Register `/modernisation-decompose` in `check-skill-contracts.js`

**Story reference:** artefacts/2026-04-22-modernisation-decompose/stories/md-2-skill-contracts.md
**Epic reference:** artefacts/2026-04-22-modernisation-decompose/epics/e1-modernisation-pipeline-bridging.md
**Test plan author:** Copilot
**Date:** 2026-04-22

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | npm test passes 0 failures for new skill after contract registered | — | 1 test | — | — | — | 🟢 |
| AC2 | Removing State update section causes named failure with skill name | — | 1 test | — | — | — | 🟢 |
| AC3 | 0 regressions to existing 37 skills | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — integration tests run `npm test` against the live repo; regression test uses a temp file with a removed section.
**PCI/sensitivity in scope:** No
**Availability:** Available once `check-skill-contracts.js` is updated and SKILL.md is committed (md-1 complete)
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Updated `check-skill-contracts.js` + `SKILL.md` from md-1 | File system | None | Both must be present |
| AC2 | Temporary SKILL.md with `## State update — mandatory final step` section removed | Generated in test | None | Restore after test |
| AC3 | All 37 pre-existing SKILL.md files | File system | None | Unmodified |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Integration Tests

### npm test passes with 0 contract failures after check-skill-contracts.js is updated

- **Verifies:** AC1
- **Precondition:** `check-skill-contracts.js` updated with modernisation-decompose contract definition; SKILL.md committed at `.github/skills/modernisation-decompose/SKILL.md`
- **Action:** Run `npm test` from repo root
- **Expected result:** Exit code 0; output includes `[skill-contracts]` line showing the new skill name in passing output; 0 contract failures
- **Edge case:** No

### Removing State update section from new SKILL.md causes named failure

- **Verifies:** AC2
- **Precondition:** `check-skill-contracts.js` updated with modernisation-decompose contract; a copy of the SKILL.md with `## State update — mandatory final step` section removed is used as input
- **Action:** Run the contracts checker script against the modified SKILL.md (or simulate by temporarily removing the section, running `npm test`, then restoring)
- **Expected result:** `npm test` exits non-zero; error output contains both "modernisation-decompose" and "State update" (or the exact section name) — not a generic "contract failed" message
- **Edge case:** No

### npm test shows 0 regressions for all 37 pre-existing skills

- **Verifies:** AC3
- **Precondition:** `check-skill-contracts.js` updated; all existing SKILL.md files unchanged
- **Action:** Run `npm test` from repo root; observe `[skill-contracts]` line
- **Expected result:** Count of skills in passing output equals at least 38 (37 existing + 1 new); all previously passing skills still reported as passing; no new failures for any pre-existing skill
- **Edge case:** No

---

## NFR Tests

### Updated check-skill-contracts.js introduces no new external npm dependencies

- **Verifies:** NFR No-dep constraint
- **Precondition:** `check-skill-contracts.js` updated
- **Action:** Read the updated `check-skill-contracts.js` file; search for any `require()` calls; compare the list of `require()`d modules against the list present before the update
- **Expected result:** No new module names appear in `require()` calls beyond what was there before the change. All required modules are either Node.js built-ins or already in the file pre-change.
- **Edge case:** No

---

## Gap table

None.
