# Test Plan: Add ADR-014 (Dual-Scope Artefact Model) to `architecture-guardrails.md`

**Story reference:** artefacts/2026-04-22-modernisation-decompose/stories/md-3-adr-014.md
**Epic reference:** artefacts/2026-04-22-modernisation-decompose/epics/e1-modernisation-pipeline-bridging.md
**Test plan author:** Copilot
**Date:** 2026-04-22

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | ADR-014 row in Active ADRs table with correct title, status, constrains-field | 3 tests | — | — | — | — | 🟢 |
| AC2 | Full ADR-014 write-up contains Context, Decision, Consequences sections | 3 tests | — | — | — | — | 🟢 |
| AC3 | npm test passes with 0 failures after file updated | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — tests read `architecture-guardrails.md` file content and check for required text.
**PCI/sensitivity in scope:** No
**Availability:** Available once `architecture-guardrails.md` is updated
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | `architecture-guardrails.md` file content | File system | None | Must contain ADR-014 table row |
| AC2 | `architecture-guardrails.md` file content | File system | None | Must contain write-up section |
| AC3 | Updated `architecture-guardrails.md` | File system | None | Must not break npm test |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### ADR-014 row exists in the Active ADRs table

- **Verifies:** AC1
- **Precondition:** `architecture-guardrails.md` updated with ADR-014
- **Action:** Read file content; assert a table row containing `ADR-014` exists in the Active ADRs section
- **Expected result:** String `ADR-014` found in file content within the Active ADRs table context
- **Edge case:** No

### ADR-014 table row contains the correct title text

- **Verifies:** AC1
- **Precondition:** `architecture-guardrails.md` updated
- **Action:** Read file content; assert the ADR-014 row contains the title "Two-tier artefact scope model: system corpus vs feature delivery" (or close equivalent preserving the key phrase)
- **Expected result:** Title text present in the table row
- **Edge case:** No

### ADR-014 table row constrains-field references modernisation programme contributors and /modernisation-decompose

- **Verifies:** AC1
- **Precondition:** `architecture-guardrails.md` updated
- **Action:** Read file content; assert the ADR-014 row's constrains-field contains "modernisation" and "modernisation-decompose"
- **Expected result:** Both terms present in the constrains-field value for ADR-014
- **Edge case:** No

### ADR-014 write-up section contains a Context sub-section describing the two scopes

- **Verifies:** AC2
- **Precondition:** `architecture-guardrails.md` updated
- **Action:** Read file content; assert the ADR-014 write-up section (starting with `### ADR-014:`) contains a Context paragraph describing both the system corpus scope and the feature delivery scope
- **Expected result:** Context section present; mentions both "corpus" (or system-level scope) and "feature" (or delivery scope)
- **Edge case:** No

### ADR-014 write-up section contains a Decision sub-section naming /modernisation-decompose as the bridge

- **Verifies:** AC2
- **Precondition:** `architecture-guardrails.md` updated
- **Action:** Read file content; assert the ADR-014 write-up section contains a Decision paragraph that names `/modernisation-decompose` as the canonical bridge mechanism
- **Expected result:** Decision section present and contains `/modernisation-decompose`
- **Edge case:** No

### ADR-014 write-up section contains a Consequences sub-section naming ad-hoc bridging as a violation

- **Verifies:** AC2
- **Precondition:** `architecture-guardrails.md` updated
- **Action:** Read file content; assert the ADR-014 write-up section contains a Consequences paragraph that explicitly states ad-hoc cross-scope bridging is a violation of this ADR
- **Expected result:** Consequences section present; contains "violation" or equivalent prohibition language
- **Edge case:** No

---

## Integration Tests

### npm test passes with 0 failures after architecture-guardrails.md is updated

- **Verifies:** AC3
- **Precondition:** `architecture-guardrails.md` updated with ADR-014 table row and write-up
- **Action:** Run `npm test` from repo root
- **Expected result:** Exit code 0; all check lines show ✓; no failures introduced by the file change
- **Edge case:** No

---

## NFR Tests

### ADR-014 write-up includes a Decided date field

- **Verifies:** NFR Audit (write-up must include `Decided: YYYY-MM-DD`)
- **Precondition:** `architecture-guardrails.md` updated
- **Action:** Read file content; in the ADR-014 write-up section, assert a `**Decided:**` field exists with a date value in YYYY-MM-DD format
- **Expected result:** `**Decided:** 2026-04-22` (or the actual implementation date) present in the write-up
- **Edge case:** No

---

## Gap table

None.
