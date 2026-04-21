# AC Verification Script: Add ADR-014 (Dual-Scope Artefact Model) to `architecture-guardrails.md`

**Story reference:** artefacts/2026-04-22-modernisation-decompose/stories/md-3-adr-014.md
**Technical test plan:** artefacts/2026-04-22-modernisation-decompose/test-plans/md-3-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Clone or pull the latest version of the skills repo.
2. Open `.github/architecture-guardrails.md` in a text editor.
3. Open a terminal at the repo root.

**Reset between scenarios:** Each scenario reads the same file — no state changes needed between scenarios.

---

## Scenarios

### Scenario 1 — AC1: ADR-014 row appears in the Active ADRs table

**Steps:**
1. Open `.github/architecture-guardrails.md`.
2. Scroll to the section labelled "Active ADRs" (it is a markdown table).
3. Find the row for ADR-014.
4. Read the row's title, status, and constrains-field columns.

**Expected outcome:** A row for ADR-014 exists. The title reads "Two-tier artefact scope model: system corpus vs feature delivery" (or very close to this — the key phrase "two-tier" and "corpus vs feature" should be present). The status column shows "Active". The constrains-field mentions contributors working on modernisation programmes and `/modernisation-decompose`.

**Pass / Fail:** _____ | Notes: _____

---

### Scenario 2 — AC2: ADR-014 full write-up contains Context, Decision, and Consequences

**Steps:**
1. In `.github/architecture-guardrails.md`, scroll past the Active ADRs table to the detailed write-up sections.
2. Find the section headed `### ADR-014:` (or similar).
3. Check that it contains three distinct sub-sections: Context, Decision, Consequences (they may be headings or bold paragraph labels).
4. Read each sub-section and check the content.

**Expected outcome:**
- **Context** describes the two scopes: the system-level corpus scope (produced by `/reverse-engineer`) and the feature-level delivery scope (produced by the standard pipeline). It explains that without a governed bridge these can be confused or conflated.
- **Decision** states that `/modernisation-decompose` is the canonical bridge between the two scopes.
- **Consequences** states that ad-hoc cross-scope bridging (bypassing `/modernisation-decompose`) is a violation of this ADR. It may also describe expected benefits.
- The write-up includes a `**Decided:** YYYY-MM-DD` date field.

**Pass / Fail:** _____ | Notes: _____

---

### Scenario 3 — AC3: npm test still passes after the update

**Steps:**
1. In the terminal, run: `npm test`
2. Wait for the output to complete.
3. Look at all the check lines.

**Expected outcome:** All check lines show `✓` or `OK`. No line says "FAIL" or shows an error count greater than 0. The test run exits cleanly.

**Pass / Fail:** _____ | Notes: _____

---

## Summary

| Scenario | AC | Pass / Fail | Notes |
|----------|-----|-------------|-------|
| 1 — ADR-014 table row | AC1 | | |
| 2 — ADR-014 full write-up | AC2 | | |
| 3 — npm test passes | AC3 | | |

**Overall: PASS / FAIL** (circle one) | **Verified by:** _________ | **Date:** _________
