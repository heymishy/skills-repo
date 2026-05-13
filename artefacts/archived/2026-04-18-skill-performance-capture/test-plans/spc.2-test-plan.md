## Test Plan: Define capture block schema and Markdown template

**Story reference:** artefacts/2026-04-18-skill-performance-capture/stories/spc.2-capture-block-schema-template.md
**Epic reference:** artefacts/2026-04-18-skill-performance-capture/epics/e1-skill-performance-capture.md
**Test plan author:** Copilot (Claude Sonnet 4.6)
**Date:** 2026-04-18

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `.github/templates/capture-block.md` exists with all required sections | 5 tests | — | — | — | — | 🟢 |
| AC2 | Exactly 6 required metadata fields in the table | 1 test | — | — | — | — | 🟢 |
| AC3 | Numeric delta calculable for files_referenced, constraints_inferred_count, backward_references accuracy (template structure inspection) | 2 tests | — | — | — | — | 🟢 |
| AC4 | Block is structurally complete with operator review section blank | 1 test | — | — | — | — | 🟢 |
| AC5 | Template renders as valid Markdown — no broken formatting | 1 test | — | — | — | — | 🟢 |

Note: AC3 is covered via template field-type inspection per RISK-ACCEPT 1-M4 — tests verify field declarations support numeric/list comparison, not that two model runs were actually conducted.

---

## Coverage gaps

No gaps. All ACs are verifiable against the static template file deliverable.

---

## Test Data Strategy

**Source:** Synthetic — tests read `.github/templates/capture-block.md` directly from the repo filesystem.
**PCI/sensitivity in scope:** No
**Availability:** Available once spc.2 is implemented — the template file is the deliverable.
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1–AC5 | `.github/templates/capture-block.md` | Filesystem read | None | File is the deliverable; all tests fail until it exists with correct content |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

All tests are plain Node.js. Test file: `tests/check-spc2-capture-block-template.js`.

**T1 — AC1: file exists**
- Name: `.github/templates/capture-block.md exists`
- Covers: AC1
- Precondition: Feature branch with spc.2 implemented
- Action: `fs.existsSync('.github/templates/capture-block.md')`
- Expected result: `true`
- Fails before implementation: yes

**T2 — AC1: ## Capture Block heading present**
- Name: `capture-block.md contains ## Capture Block heading`
- Covers: AC1
- Action: Read file; check content includes `## Capture Block`
- Expected result: match found
- Fails before implementation: yes

**T3 — AC1: metadata table section present**
- Name: `capture-block.md contains metadata table with required fields`
- Covers: AC1
- Action: Read file; check that all 6 metadata field names appear: `experiment_id`, `model_label`, `cost_tier`, `skill_name`, `artefact_path`, `run_timestamp`
- Expected result: All 6 strings found in file content
- Fails before implementation: yes

**T4 — AC1 + AC2: exactly 6 metadata fields in the required table**
- Name: `capture-block.md metadata table has exactly 6 required fields — no more, no less`
- Covers: AC1, AC2
- Action: Parse the metadata table rows; count field names; assert count === 6
- Expected result: 6 fields found in the required metadata section
- Note: Parser should extract the table between the metadata heading and the next `##` heading to avoid counting optional-section fields
- Fails before implementation: yes

**T5 — AC1: structural metrics section present with required fields**
- Name: `capture-block.md contains structural metrics section with turn_count, files_referenced, constraints_inferred_count`
- Covers: AC1
- Action: Check file for `turn_count`, `files_referenced`, `constraints_inferred_count`, `intermediates_prescribed`, `intermediates_produced`
- Expected result: All 5 field names present
- Fails before implementation: yes

**T6 — AC1: fidelity self-report section and credential warning present**
- Name: `capture-block.md contains fidelity self-report section with credential warning`
- Covers: AC1 + NFR Security
- Action: Check file contains a section for fidelity self-report AND contains text warning against session tokens/credentials
- Expected result: Both present
- Fails before implementation: yes

**T7 — AC1: backward_references section present with target and accurate fields**
- Name: `capture-block.md contains backward_references section with target and accurate: yes/no fields`
- Covers: AC1
- Action: Check file for `backward_references` section heading and `accurate:` field indicator
- Expected result: Both present
- Fails before implementation: yes

**T8 — AC1: operator review section present with 4 required fields**
- Name: `capture-block.md contains operator review section with context_score, linkage_score, notes, reviewed_by`
- Covers: AC1
- Action: Check file for all 4 operator review field names
- Expected result: All 4 present
- Fails before implementation: yes

**T9 — AC3: files_referenced is declared as a list type**
- Name: `files_referenced field in capture-block.md is declared as a list (not a scalar)`
- Covers: AC3
- Action: Check file content — `files_referenced` entry is formatted as a list (markdown list format or type annotation indicating list) rather than a plain string value
- Expected result: `files_referenced` has list-type indicators (e.g. `- ` list syntax, `(list)` annotation, or similar)
- Fails before implementation: yes

**T10 — AC3: constraints_inferred_count is declared as a numeric type**
- Name: `constraints_inferred_count field in capture-block.md is declared as numeric`
- Covers: AC3
- Action: Check file content — `constraints_inferred_count` field has a numeric type indicator or numeric placeholder value (e.g. `0`, `[n]`, or `(number)`)
- Expected result: Numeric type indicator present
- Fails before implementation: yes

**T11 — AC4: operator review section blank is acceptable (section exists but values optional)**
- Name: `capture-block.md operator review section fields are declared optional — block is complete without them`
- Covers: AC4
- Action: Check that the operator review section header and field keys are present even if values are shown as optional/blank placeholders
- Expected result: Section is structurally present but field values are marked as optional (e.g. blank, `—`, or labelled as operator-filled)
- Fails before implementation: yes

**T12 — AC5: valid Markdown structure (no broken syntax)**
- Name: `capture-block.md has no broken Markdown syntax — headings are well-formed, no unclosed code fences`
- Covers: AC5
- Action: Check the file has no unclosed backtick code fences; all headings start with `#`; no HTML tags outside of HTML comment blocks
- Expected result: No broken syntax patterns detected
- Fails before implementation: no (empty file would pass); passes only when file has valid content after T1–T11 pass too

---

## Integration Tests

None required. spc.2 is a static Markdown template file with no inter-component handoffs.

---

## NFR Tests

**NFR: Security — fidelity_self_report credential warning**
Covered by T6 above.

**NFR: Consistency — field names match spc.5 script**
Not testable at spc.2 level pre-implementation of spc.5. Will be verified cross-story by the spc.5 test plan (which checks that its hardcoded field names match the template).

---

## Gap table

No gaps.
