## Test Plan: Provide a create/edit form for a guardrail or standard

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s5-create-edit-form.md
**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-2-pr-gated-add-edit.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-11

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Add/Edit actions present | 1 test | — | — | — | — | 🟢 |
| AC2 | Edit form pre-filled with real content | 1 test | — | — | — | — | 🟢 |
| AC3 | empty submission rejected server-side | 1 test | — | — | — | — | 🟢 |
| AC4 | valid submission passed to write path correctly | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic (mock view state, mock form submission payloads)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Rendered `wugs-s2`/`wugs-s3` view HTML | Reuse existing test fixtures | None | |
| AC2 | Mocked existing entry content to pre-fill | Mocked `wugs-s1` fetch | None | Must be escaped per `MC-SEC-01` |
| AC3 | Empty/whitespace-only form payload | Synthetic | None | |
| AC4 | Valid form payload | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### guardrailsView_rendersAddAndEditActions

- **Verifies:** AC1
- **Precondition:** View rendered with at least one existing entry
- **Action:** Inspect rendered HTML
- **Expected result:** An "Add" action and, per existing entry, an "Edit" action are present
- **Edge case:** No

### editForm_prefillsWithRealCurrentContent

- **Verifies:** AC2
- **Precondition:** Mocked `wugs-s1` fetch returns specific, known content for an entry
- **Action:** Load the edit form for that entry
- **Expected result:** Form field is pre-filled with exactly that content, HTML-escaped
- **Edge case:** No

### submitForm_emptyContent_rejectedServerSide

- **Verifies:** AC3
- **Precondition:** Form payload with empty/whitespace-only content
- **Action:** Submit the form (server-side handler call directly, bypassing any client-side check)
- **Expected result:** Server rejects with a clear validation error; no downstream write-path call is made
- **Edge case:** Yes — specifically tests server-side enforcement, not client-side

---

## Integration Tests

### submitForm_validContent_passesToWritePathWithCorrectTarget

- **Verifies:** AC4
- **Components involved:** form submission handler, `wugs-s6`'s write adapter (mocked at this seam)
- **Precondition:** Valid form payload naming a specific target path (product or org repo, based on which section)
- **Action:** Submit the form
- **Expected result:** The mocked write-path adapter is called with the exact content and target path submitted — no silent transformation
- **Edge case:** No

---

## NFR Tests

### Pre-filled content is escaped before rendering

- **NFR addressed:** Security (`MC-SEC-01`)
- **Measurement method:** Assert a mocked entry containing `<script>` renders escaped in the pre-filled form field
- **Pass threshold:** No unescaped markup in output
- **Tool:** Node, string assertion

---

## Out of Scope for This Test Plan

- The write path's own behaviour (branch/PR creation) — `wugs-s6`'s test plan.
- Markdown preview rendering — not built in this story.

---

## Test Gaps and Risks

None identified as blocking.
