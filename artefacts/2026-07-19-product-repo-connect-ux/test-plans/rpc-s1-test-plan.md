## Test Plan: Give every product a UI path to connect or create a GitHub repo

**Story reference:** artefacts/2026-07-19-product-repo-connect-ux/stories/rpc-s1.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-07-19

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | unconnected product shows a Connect-repo affordance | 2 | — | — | — | — | 🟢 |
| AC2 | create-new-repo path reaches the existing handler, page updates | — | 2 | — | — | — | 🟢 |
| AC3 | connect-existing-repo path reaches the existing handler, page updates | — | 2 | — | — | — | 🟢 |
| AC4 | connected product shows repo info, not a redundant connect prompt | 2 | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Fixtures — product rows with/without `repo_owner`/`repo_name` set.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Product fixture, no repo columns set | Fixture | None | |
| AC2 | Authenticated session + product fixture, POST to repo/create | Fixture | None | Reuses existing handler test patterns |
| AC3 | Authenticated session + product fixture, PUT to product edit with owner/repo | Fixture | None | Reuses existing handler test patterns |
| AC4 | Product fixture with repo columns already set | Fixture | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### U1 — _renderProductView shows a Connect-repo affordance when no repo is set
- **Verifies:** AC1
- **Precondition:** Product fixture with `repo_owner`/`repo_name` both null/empty
- **Action:** Call `_renderProductView` with that fixture
- **Expected result:** Rendered HTML contains a Connect-repo control (button/form)
- **Edge case:** No

### U2 — _renderProductView hides the Connect-repo affordance when a repo is already set
- **Verifies:** AC4
- **Precondition:** Product fixture with `repo_owner`/`repo_name` both populated
- **Action:** Call `_renderProductView` with that fixture
- **Expected result:** Rendered HTML shows the repo owner/name, no Connect-repo prompt present

---

## Integration Tests

### IT1 — Create-new-repo path end-to-end
- **Verifies:** AC2
- **Components involved:** New UI form/button, `handlePostProductRepoCreate`
- **Precondition:** Authenticated session, product fixture with no repo
- **Action:** Submit the new-UI's create-repo form
- **Expected result:** `handlePostProductRepoCreate` is invoked with the expected params; subsequent product page render shows the created repo's owner/name

### IT2 — Connect-existing-repo path end-to-end
- **Verifies:** AC3
- **Components involved:** New UI form/button, `handlePutProductEdit`'s repo-association logic
- **Precondition:** Authenticated session, product fixture with no repo
- **Action:** Submit the new UI's connect-existing form with an owner/repo pair
- **Expected result:** The repo-association path is invoked with the expected params; subsequent product page render shows the connected repo

### IT3 — Repo owner/name rendered safely (no injection)
- **Verifies:** NFR-Security (MC-SEC-01)
- **Components involved:** `_renderProductView`
- **Precondition:** Product fixture with a repo name containing HTML-special characters (e.g. `<script>`)
- **Action:** Render the product view
- **Expected result:** Output is escaped (`_escapeHtml`), no raw script tag present in the rendered HTML

---

## NFR Tests

### Accessibility — new form controls are keyboard-navigable and labelled
- **NFR addressed:** Accessibility
- **Measurement method:** Assert `tabindex`/proper `<label>` association on new form elements, matching existing patterns elsewhere in this file
- **Pass threshold:** All new interactive elements reachable via keyboard, each with an associated label
- **Tool:** Jest-style DOM assertions on rendered HTML string

---

## Out of Scope for This Test Plan

- Repo disconnection flow — not built by this story, no test coverage needed.
- Validating repo content (e.g. presence of `pipeline-state.json`) at connection time — that's pr-s2's own scope, not this story's.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
