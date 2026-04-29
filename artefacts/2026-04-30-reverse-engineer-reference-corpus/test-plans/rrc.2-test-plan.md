## Test Plan: Add Output 10 — Constraint index to `/reverse-engineer`

**Story reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/stories/rrc.2-constraint-index-output.md`
**Epic reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/epics/rrc-epic-1.md`
**Test plan author:** Copilot
**Date:** 2026-04-30

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | INITIAL/DEEPEN instructs Output 10 (constraint-index.md) with pipe-delimited format (5 columns) | 7 tests | — | — | — | — | 🟢 |
| AC2 | CHANGE-RISK notation reflected in constraint-index summary column | 1 test | — | — | — | — | 🟢 |
| AC3 | VERIFY pass instructs update of constraint-index.md when dispositions change | 1 test | — | — | — | — | 🟢 |
| AC4 | DEFER (Q0=C) does NOT produce Output 10 | 1 test | — | — | — | — | 🟢 |
| AC5 | check-skill-contracts.js contract markers intact | 1 test | — | — | — | — | 🟢 |
| DEC-001 | rule-id format `<layer>-<sequence>` (e.g. L1-001) specified in SKILL.md | 1 test | — | — | — | — | 🟢 |
| NFR | SKILL.md total line count ≤ 650 | 1 test | — | — | — | — | 🟢 |

**Note on DEC-001:** Decision [DEC-001](../decisions.md) established the canonical `rule-id` format as `<layer>-<sequence>` (e.g. `L1-001`). This format must be specified in the SKILL.md Output 10 description so the coding agent implements it consistently. It is tested separately from AC1.

---

## Coverage gaps

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| None | — | — | All ACs testable by reading SKILL.md content | No gaps |

---

## Test Data Strategy

**Source:** Synthetic — test scripts read SKILL.md file content; all assertions on text present after implementation.
**PCI/sensitivity in scope:** No
**Availability:** Available now — SKILL.md file already exists.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | `/reverse-engineer` SKILL.md content post-implementation | SKILL.md | None | Tests fail before implementation |
| AC2 | CHANGE-RISK instruction text in SKILL.md | SKILL.md | None | |
| AC3 | VERIFY pass section in SKILL.md | SKILL.md | None | |
| AC4 | DEFER gate text in SKILL.md | SKILL.md | None | |
| AC5 | Contract markers in SKILL.md | SKILL.md | None | |
| DEC-001 | rule-id format text in SKILL.md | SKILL.md | None | |
| NFR | Line count of SKILL.md | SKILL.md | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

**Test file:** `tests/check-rrc2-constraint-index.js`
**Framework:** Node.js built-ins only (`fs`, `path`) — zero external dependencies.

All tests assert on `.github/skills/reverse-engineer/SKILL.md` content. All AC-related tests will fail before implementation.

---

### T2.1 — Output 10 instruction is present
**Covers:** AC1
**Action:** Read SKILL.md; search for "Output 10".
**Expected:** SKILL.md contains "Output 10".
**Fails before implementation:** Yes.

---

### T2.2 — Output 10 names the `constraint-index.md` file
**Covers:** AC1
**Action:** Search SKILL.md for "constraint-index.md".
**Expected:** SKILL.md contains "constraint-index.md".
**Fails before implementation:** Yes.

---

### T2.3 — `constraint-index.md` has `rule-id` column
**Covers:** AC1
**Action:** Search SKILL.md for "rule-id" in the context of constraint-index format.
**Expected:** SKILL.md contains "rule-id" as a column name.
**Fails before implementation:** Yes.

---

### T2.4 — `constraint-index.md` has `source-file` column
**Covers:** AC1
**Action:** Search SKILL.md for "source-file".
**Expected:** SKILL.md contains "source-file" as a column name.
**Fails before implementation:** Yes.

---

### T2.5 — `constraint-index.md` has `confidence` column
**Covers:** AC1
**Action:** Search SKILL.md for "confidence" near constraint-index.
**Expected:** SKILL.md contains "confidence" as a column name.
**Fails before implementation:** Yes.

---

### T2.6 — `constraint-index.md` has `disposition` column
**Covers:** AC1
**Action:** Search SKILL.md for "disposition" near constraint-index.
**Expected:** SKILL.md contains "disposition" as a column name.
**Fails before implementation:** Yes.

---

### T2.7 — `constraint-index.md` has `summary` column
**Covers:** AC1
**Action:** Search SKILL.md for "summary" near constraint-index.
**Expected:** SKILL.md contains "summary" as a column name.
**Fails before implementation:** Yes.

---

### T2.8 — `[CHANGE-RISK]` notation referenced in constraint-index instructions
**Covers:** AC2
**Action:** Search SKILL.md for "CHANGE-RISK" near constraint-index context.
**Expected:** SKILL.md references CHANGE-RISK notation in the constraint-index instructions (e.g. "include CHANGE-RISK in the summary column").
**Fails before implementation:** Yes.

---

### T2.9 — VERIFY pass instructs constraint-index.md update
**Covers:** AC3
**Action:** Find the VERIFY pass section; check it references constraint-index.md update.
**Expected:** VERIFY section references "constraint-index.md" or "Output 10" in the context of updating dispositions.
**Fails before implementation:** Yes.

---

### T2.10 — Output 10 gated: DEFER outcome does not produce it
**Covers:** AC4
**Action:** Find the DEFER outcome section; verify it does NOT reference Output 10 production.
**Expected:** DEFER section does not mention Output 10 or constraint-index.md.
**Fails before implementation:** Yes — the current DEFER section does not include Output 10, but this test validates the post-implementation state explicitly gates it.

---

### T2.11 — rule-id format `<layer>-<sequence>` is specified (DEC-001)
**Covers:** Decision DEC-001 (canonical rule-id format)
**Action:** Search SKILL.md for the rule-id format description — specifically a layer-prefixed format (e.g. `L1-001`, `L\d+-\d+`, or "layer-sequence").
**Expected:** SKILL.md specifies the rule-id format with a layer number prefix, consistent with DEC-001.
**Fails before implementation:** Yes.

---

### T2.12 — SKILL.md contract markers intact
**Covers:** AC5
**Action:** Verify `name:`, `description:`, `triggers:`, and outputs section present in SKILL.md.
**Expected:** All four markers present.
**Fails before implementation:** No — pre-implementation file should have them; failure = regression.

---

### T2.13 — SKILL.md line count ≤ 650
**Covers:** NFR
**Action:** Count lines in SKILL.md; assert ≤ 650.
**Expected:** Line count ≤ 650.
**Fails before implementation:** No. Fails after implementation if additions exceeded budget.

---

## Integration Tests

None — SKILL.md-only change. No component seams.

---

## NFR Tests

| NFR | Test | Pass condition |
|-----|------|----------------|
| Size ≤ 650 lines | T2.13 | Line count ≤ 650 |

---

## Gap table

No gaps.

---

## Implementation notes for the coding agent

1. Edit `.github/skills/reverse-engineer/SKILL.md` to add an Output 10 section following the existing pattern.
2. Format: pipe-delimited markdown table with columns `rule-id | source-file | confidence | disposition | summary`.
3. rule-id format: `<layer>-<sequence>` (e.g. `L1-001`) per DEC-001.
4. Include instruction for CHANGE-RISK notation in the summary column of affected rows.
5. Gate Output 10 to INITIAL and DEEPEN passes only — not DEFER.
6. Add update instruction to the VERIFY pass section referencing constraint-index.md.
7. Keep total SKILL.md line count ≤ 650 (shared budget with rrc.1 additions).
