## Test Plan: Show a product's own guardrails and standards, read live from its connected repo

**Story reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/stories/wugs-s2-product-level-guardrails-view.md
**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-1-repo-backed-viewing.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-11

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | renders real guardrails.md content | 1 test | — | — | — | — | 🟢 |
| AC2 | lists real standards/ folder entries | 1 test | — | — | — | — | 🟢 |
| AC3 | empty-repo state, not fabricated | 1 test | — | — | — | — | 🟢 |
| AC4 | fetch failure — isolated error state | — | 1 test | — | — | — | 🟢 |
| AC5 | nav/activeProductId regression guard | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic (mock pool matching real `getProductsNavSummary` query shapes, per `check-jcn-s1`/`check-rapp-s2` convention) + Mocked external services (`wugs-s1`'s fetch function, injected)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Mocked `wugs-s1` fetch returning real-shaped guardrails content | Mocked adapter injection | None | |
| AC2 | Mocked `wugs-s1` fetch returning a folder-entry array | Mocked adapter injection | None | |
| AC3 | Mocked `wugs-s1` fetch throwing `ArtefactNotFoundError` | Mocked adapter injection | None | |
| AC4 | Mocked `wugs-s1` fetch throwing `ArtefactFetchError` | Mocked adapter injection | None | |
| AC5 | Mock pool matching `getProductsNavSummary`'s real query shapes | Mock pool | None | Same convention as `check-jcn-s1-journey-page-nav-products.js` |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### handleGetGuardrailsView_productHasGuardrailsFile_rendersRealContent

- **Verifies:** AC1
- **Precondition:** Mocked `wugs-s1` fetch returns real guardrails.md content for the product's connected repo
- **Action:** Call the view handler
- **Expected result:** Response HTML contains the real, mocked content string
- **Edge case:** No

### handleGetGuardrailsView_productHasStandardsFolder_listsEntries

- **Verifies:** AC2
- **Precondition:** Mocked `wugs-s1` fetch returns a folder-entry array for `standards/`
- **Action:** Call the view handler
- **Expected result:** Response HTML lists each entry by name, sourced from the real mocked array — not hardcoded
- **Edge case:** No

### handleGetGuardrailsView_emptyRepo_showsExplicitEmptyState

- **Verifies:** AC3
- **Precondition:** Mocked `wugs-s1` fetch throws `ArtefactNotFoundError` for both guardrails file and standards folder
- **Action:** Call the view handler
- **Expected result:** Response HTML shows an explicit "none found" state — distinct from a loading/blank state, not a crash
- **Edge case:** Yes

### handleGetGuardrailsView_nav_rendersFullSidebarAndActiveProduct

- **Verifies:** AC5
- **Precondition:** Mock pool matching `getProductsNavSummary`'s real three query shapes
- **Action:** Call the view handler for product P
- **Expected result:** Response HTML contains other real product names (sidebar populated) and `/products/P` as a real nav link (activeProductId correct) — regression guard against `rapp-s2`-class bug
- **Edge case:** No

---

## Integration Tests

### handleGetGuardrailsView_fetchFails_sectionIsolatedError

- **Verifies:** AC4
- **Components involved:** view handler, `wugs-s1`'s fetch function, page shell renderer
- **Precondition:** Mocked fetch throws `ArtefactFetchError` (network/rate-limit simulated)
- **Action:** Call the view handler
- **Expected result:** Product-level section shows a named error state; the rest of the page (nav, org-level section) still renders normally — one section's failure does not crash the whole response
- **Edge case:** Yes — this is the key integration seam this story's NFR depends on

---

## NFR Tests

### innerHTML content is escaped before rendering

- **NFR addressed:** Security (`MC-SEC-01`)
- **Measurement method:** Assert that a mocked guardrails-file content containing `<script>` or similar markup renders as escaped text in the response HTML, not as live markup
- **Pass threshold:** No unescaped `<script`, `<img onerror`, or similar raw tag appears in the rendered output
- **Tool:** Node, string assertion on response HTML

### Error/empty states convey via text, not colour alone

- **NFR addressed:** Accessibility (`MC-A11Y-02`)
- **Measurement method:** Assert the empty-state and error-state markup includes a text label, not only a CSS class name
- **Pass threshold:** A text string describing the state is present in the HTML
- **Tool:** Node, string assertion

---

## Out of Scope for This Test Plan

- Real GitHub API integration test — covered by `wugs-s1`'s own test plan; this story mocks `wugs-s1`'s function entirely.
- Org-level section content — `wugs-s3`'s own test plan.

---

## Test Gaps and Risks

None identified as blocking.
