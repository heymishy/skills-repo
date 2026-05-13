## Test Plan: Add Output 9 — `/discovery` pre-population seed to `/reverse-engineer`

**Story reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/stories/rrc.1-discovery-seed-output.md`
**Epic reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/epics/rrc-epic-1.md`
**Test plan author:** Copilot
**Date:** 2026-04-30

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | INITIAL/DEEPEN instructs Output 9 (discovery-seed.md) with all 4 format sections | 6 tests | — | — | — | — | 🟢 |
| AC2 | check-skill-contracts.js reports 40 skills OK — contracts not broken | 1 test | — | — | — | — | 🟢 |
| AC3 | DEFER (Q0 outcome C) does NOT trigger Output 9 production | 1 test | — | — | — | — | 🟢 |
| AC4 | discovery-seed.md format sections correspond to discovery.md template sections | 2 tests | — | — | — | — | 🟢 |
| AC5 | VERIFY pass includes Output 9 review instruction when PARITY REQUIRED rules changed | 1 test | — | — | — | — | 🟢 |
| NFR | SKILL.md total line count ≤ 650 | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| None | — | — | All ACs testable by reading SKILL.md content | No gaps |

---

## Test Data Strategy

**Source:** Synthetic — test scripts read file content; all assertions are on SKILL.md text present after implementation.
**PCI/sensitivity in scope:** No
**Availability:** Available now — the SKILL.md file already exists; additions will be made by the coding agent.
**Owner:** Self-contained — tests generate no external data; assertion target is the file content.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | `/reverse-engineer` SKILL.md content post-implementation | SKILL.md on implementation branch | None | Tests will fail before implementation |
| AC2 | SKILL.md contract markers | SKILL.md | None | |
| AC3 | DEFER gate instruction text in SKILL.md | SKILL.md | None | |
| AC4 | `/reverse-engineer` SKILL.md + `discovery.md` template | Both files | None | |
| AC5 | VERIFY pass section text in SKILL.md | SKILL.md | None | |
| NFR | Line count of SKILL.md | SKILL.md | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

**Test file:** `tests/check-rrc1-discovery-seed.js`
**Framework:** Node.js built-ins only (`fs`, `path`) — zero external dependencies.

All tests read `.github/skills/reverse-engineer/SKILL.md` and assert on its text content. All tests will fail before implementation.

---

### T1.1 — Output 9 instruction is present
**Covers:** AC1
**Precondition:** `/reverse-engineer` SKILL.md exists.
**Action:** Read SKILL.md; search for the text "Output 9".
**Expected:** SKILL.md contains "Output 9".
**Fails before implementation:** Yes — Output 9 does not exist in the pre-implementation SKILL.md.

---

### T1.2 — Output 9 names the `discovery-seed.md` file
**Covers:** AC1
**Precondition:** SKILL.md exists.
**Action:** Read SKILL.md; search for the filename "discovery-seed.md".
**Expected:** SKILL.md contains "discovery-seed.md".
**Fails before implementation:** Yes.

---

### T1.3 — `discovery-seed.md` format includes problem framing section
**Covers:** AC1
**Precondition:** SKILL.md exists.
**Action:** Read SKILL.md; search for "problem framing" or "problem-framing" in the context of the Output 9 section.
**Expected:** SKILL.md contains "problem framing" (case-insensitive).
**Fails before implementation:** Yes.

---

### T1.4 — `discovery-seed.md` format includes PARITY REQUIRED constraints block
**Covers:** AC1
**Precondition:** SKILL.md exists.
**Action:** Read SKILL.md; verify that the Output 9 section or nearby format description references PARITY REQUIRED rules.
**Expected:** SKILL.md contains "PARITY REQUIRED" in the context of the discovery-seed format.
**Fails before implementation:** Yes — the pre-implementation SKILL.md does not associate PARITY REQUIRED with Output 9 formatting.

---

### T1.5 — `discovery-seed.md` format includes personas section
**Covers:** AC1
**Precondition:** SKILL.md exists.
**Action:** Read SKILL.md; search for "personas" in or near the Output 9 format description.
**Expected:** SKILL.md contains "personas" within the context of discovery-seed format.
**Fails before implementation:** Yes.

---

### T1.6 — Output 9 is gated: DEFER (Q0=C) does not produce it
**Covers:** AC3
**Precondition:** SKILL.md exists.
**Action:** Read SKILL.md; find the DEFER outcome section; verify it does NOT instruct Output 9 production. Alternatively verify that Output 9 production is explicitly conditional on INITIAL or DEEPEN only.
**Expected:** The DEFER (Q0=C) outcome section in SKILL.md does not reference Output 9. Or the Output 9 instruction is explicitly scoped to INITIAL and DEEPEN passes only.
**Fails before implementation:** Yes.

---

### T1.7 — `discovery-seed.md` sections correspond to discovery template sections
**Covers:** AC4
**Precondition:** SKILL.md exists; `.github/templates/discovery.md` exists.
**Action:** Read SKILL.md; verify that Output 9 format sections map to named sections in `discovery.md` (e.g. "problem framing", "constraints", "personas" are section names used in the template).
**Expected:** At least two section names from `discovery.md` appear in the Output 9 format description in SKILL.md (confirming the seed mirrors the template structure).
**Fails before implementation:** Yes.

---

### T1.8 — VERIFY pass instructs Output 9 review when PARITY REQUIRED rules change
**Covers:** AC5
**Precondition:** SKILL.md exists.
**Action:** Read SKILL.md; find the VERIFY pass section; assert it contains a reference to updating or reviewing Output 9.
**Expected:** The VERIFY section references "Output 9" or "discovery-seed.md" in the context of a review/update instruction.
**Fails before implementation:** Yes.

---

### T1.9 — SKILL.md contract markers intact (proxy for governance check)
**Covers:** AC2
**Precondition:** SKILL.md exists.
**Action:** Read SKILL.md; verify it still contains `name:`, `description:`, `triggers:`, and outputs section — the markers checked by `check-skill-contracts.js`.
**Expected:** All four contract markers present.
**Edge case:** If the implementation removes any marker, this test catches the regression.
**Fails before implementation:** No — this test should already pass. If it fails, the pre-existing SKILL.md is broken.

---

### T1.10 — SKILL.md line count is within NFR (≤ 650 lines)
**Covers:** NFR
**Precondition:** SKILL.md exists.
**Action:** Count lines in SKILL.md; assert ≤ 650.
**Expected:** Line count ≤ 650.
**Fails before implementation:** No — pre-implementation file is within budget. If this test fails after implementation, the additions exceeded the NFR.

---

## Integration Tests

None — this story is a SKILL.md-only change. There are no component seams to test at the integration layer. The governance check (`check-skill-contracts.js`) is the closest integration test and is exercised as part of the `npm test` suite independently of this test file.

---

## NFR Tests

| NFR | Test | Pass condition |
|-----|------|----------------|
| Size ≤ 650 lines | T1.10 | `wc -l` of SKILL.md ≤ 650 |

---

## Gap table

No gaps.

---

## Implementation notes for the coding agent

The test script asserts on SKILL.md text content. The coding agent must:
1. Edit `.github/skills/reverse-engineer/SKILL.md` to add an Output 9 section following the existing output numbering pattern.
2. Include all 4 format sections in the Output 9 description: system name, problem framing, PARITY REQUIRED constraints, personas.
3. Ensure the Output 9 instruction is scoped to INITIAL and DEEPEN passes — not DEFER.
4. Add an update instruction to the VERIFY pass section referencing Output 9.
5. Keep total SKILL.md line count ≤ 650.

Review note (from 1-L1): The DEFER outcome vocabulary in the SKILL.md should use "DEFER" — not "outcome C". T1.6 implicitly validates this because it checks the DEFER section, but the test plan author should confirm the section heading uses "DEFER" not "C".
