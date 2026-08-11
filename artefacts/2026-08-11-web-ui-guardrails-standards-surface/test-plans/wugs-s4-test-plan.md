## Test Plan: Show org-level guardrails/standards even when a product has no connected repo

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s4-no-connected-repo-fallback.md
**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-1-repo-backed-viewing.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-11

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | distinct "connect a repo" prompt | 1 test | — | — | — | — | 🟢 |
| AC2 | org section still renders | 1 test | — | — | — | — | 🟢 |
| AC3 | prompt links to real connection flow | 1 test | — | — | — | — | 🟢 |
| AC4 | not sticky past connection | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic (mock product row with `repo_owner`/`repo_name` null, then set)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Mock product row, `repo_owner`/`repo_name` both null | Mock pool | None | |
| AC2 | Same, plus a `tenant_org_repo` row | Mock pool | None | |
| AC3 | Same as AC1 | Mock pool | None | Assert href matches the real `rpc-s1`/`prc-s2.1` route |
| AC4 | Mock product row, `repo_owner`/`repo_name` transitioning from null to set across two calls | Mock pool | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### handleGetGuardrailsView_noConnectedRepo_showsDistinctConnectPrompt

- **Verifies:** AC1
- **Precondition:** Mock product row with no `repo_owner`/`repo_name`
- **Action:** Call the view handler
- **Expected result:** Product-level section shows a "connect a repo" prompt, textually distinct from `wugs-s2` AC3's "none found in this repo" empty state
- **Edge case:** No

### handleGetGuardrailsView_noConnectedRepo_orgSectionStillRenders

- **Verifies:** AC2
- **Precondition:** Same as above, plus a real `tenant_org_repo` row and mocked org content
- **Action:** Call the view handler
- **Expected result:** Org-level section renders normally alongside the product-level prompt — the whole page isn't blocked
- **Edge case:** No

### handleGetGuardrailsView_connectPrompt_linksToRealConnectionFlow

- **Verifies:** AC3
- **Precondition:** Same as AC1
- **Action:** Inspect the rendered prompt's link target
- **Expected result:** Href matches the existing `rpc-s1`/`prc-s2.1` connection route exactly — not a new, separate route
- **Edge case:** No

---

## Integration Tests

### handleGetGuardrailsView_repoConnectedAfterFallback_showsNormalContentNextLoad

- **Verifies:** AC4
- **Components involved:** view handler, product repo-connection state, `wugs-s2`'s normal render path
- **Precondition:** First call with no connected repo (fallback state), second call with `repo_owner`/`repo_name` now set
- **Action:** Call the view handler twice, simulating a repo connection between calls
- **Expected result:** Second call shows `wugs-s2`'s normal product-level rendering — no cached/stale fallback state persists
- **Edge case:** Yes

---

## NFR Tests

### Connect-a-repo prompt is keyboard-accessible

- **NFR addressed:** Accessibility
- **Measurement method:** Assert the prompt renders as a real `<a>`/`<button>` element with an href/click handler, not a non-interactive `<div>` or `<span>`
- **Pass threshold:** Element is a real, focusable interactive element
- **Tool:** Node, HTML string/attribute assertion

---

## Out of Scope for This Test Plan

- The repo-connection flow itself — `rpc-s1`/`prc-s2.1`'s own existing test coverage, unmodified.

---

## Test Gaps and Risks

None identified as blocking.
