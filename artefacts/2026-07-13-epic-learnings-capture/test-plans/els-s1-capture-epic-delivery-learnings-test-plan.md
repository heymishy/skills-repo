## Test Plan: Capture delivery-pattern learnings from the beta-readiness-infra and team-identity-roles epics

**Story reference:** artefacts/2026-07-13-epic-learnings-capture/stories/els-s1-capture-epic-delivery-learnings.md
**Epic reference:** None — short-track
**Test plan author:** Copilot
**Date:** 2026-07-13

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | CLAUDE.md D37 section gains a 4th mandatory wiring-test-correctness point | 1 test | — | — | — | — | 🟢 |
| AC2 | CLAUDE.md gains a mock-shape-verification rule for reused adapters | 1 test | — | — | — | — | 🟢 |
| AC3 | CLAUDE.md session conventions gain a dispatch-verification rule | 1 test | — | — | — | — | 🟢 |
| AC4 | architecture-guardrails.md Anti-Patterns table gains a matching row | 1 test | — | — | — | — | 🟢 |
| AC5 | workspace/proposals/ file exists proposing the estimate-skip fix | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. Every AC is a content-presence assertion (grep-style, matching the existing convention already used by `tests/check-md-1-skill-md.js`/`check-md-3-adr.js` for this exact class of governed-file content check) — no application code, browser, or external-service dependency is involved.

---

## Test Data Strategy

**Source:** Synthetic — reads the actual repo files directly (`CLAUDE.md`, `architecture-guardrails.md`, `workspace/proposals/`), no fixtures needed.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1–AC4 | The actual `CLAUDE.md`/`architecture-guardrails.md` file content, post-edit | Real repo files | None | Content-presence assertions, not synthetic fixtures |
| AC5 | The actual `workspace/proposals/` directory listing | Real repo files | None | Confirms the proposal file exists with all 8 required front-matter fields |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### U1 — CLAUDE.md's D37 section names both new mandatory points

- **Verifies:** AC1, AC2
- **Precondition:** `CLAUDE.md` exists at repo root.
- **Action:** Read the file, locate the "Injectable adapter rule (D37)" section, assert it contains language matching both the wiring-correctness requirement and the mock-shape-verification requirement.
- **Expected result:** Both new points are present as distinguishable, separately-identifiable rules within the D37 section (not merged into one vague sentence).
- **Edge case:** No.

### U2 — CLAUDE.md's session conventions include the dispatch-verification rule

- **Verifies:** AC3
- **Precondition:** `CLAUDE.md` exists.
- **Action:** Read the file, assert a rule exists requiring independent git/PR-state verification after a coding-agent completion report.
- **Expected result:** Rule text present, naming both `git status`/`git log` and `gh pr list`/`gh pr view` as the verification mechanism.
- **Edge case:** No.

### U3 — architecture-guardrails.md's Anti-Patterns table has the new row

- **Verifies:** AC4
- **Precondition:** `.github/architecture-guardrails.md` exists.
- **Action:** Read the file, locate the Anti-Patterns table, assert a new row exists matching the 3-column format (Anti-pattern | Reason | Approved alternative) with content about trusting self-reported agent completion.
- **Expected result:** New row present, correctly formatted as a markdown table row consistent with existing rows.
- **Edge case:** No.

### U4 — workspace/proposals/ contains the estimate-skip proposal with all 8 required fields

- **Verifies:** AC5
- **Precondition:** `workspace/proposals/` directory exists (create if absent).
- **Action:** Locate the proposal file named `YYYY-MM-DD-estimate-skip-marker-improve-proposal.md`, parse its YAML front-matter.
- **Expected result:** All 8 required fields present: `evidence`, `proposed_diff`, `confidence`, `anti_overfitting_gate`, `status: pending_review`, `created_at`, `skill_target`, `source: improve`.
- **Edge case:** No.

---

## NFR Tests

None — this story has no NFRs beyond "None identified," per the story's own NFR section.

---

## Out of Scope for This Test Plan

- Testing the actual runtime effect of the new CLAUDE.md/guardrails rules on a future coding-agent dispatch — that can only be validated empirically over subsequent stories, not by this test plan.
- Testing the proposal's eventual adoption into `skills/discovery/SKILL.md`/`skills/definition/SKILL.md` — that requires a separate future PR and review cycle, per `/improve`'s own rule.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None identified | This story's entire surface area is content-presence assertions against files this story itself edits | — |
