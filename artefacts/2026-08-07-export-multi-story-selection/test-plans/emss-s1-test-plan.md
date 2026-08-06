## Test Plan: Let a --from-saas export request specify which DoR-approved story to fetch

**Story reference:** artefacts/2026-08-07-export-multi-story-selection/stories/emss-s1-select-story-for-saas-export.md
**Test plan author:** Copilot (Claude Code)
**Date:** 2026-08-07

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | No story selector → first signed-off story (backward-compat default) | 1 test | — | — | — | — | 🟢 |
| AC2 | Valid story selector → that specific story's artefact | 1 test | — | — | — | — | 🟢 |
| AC3 | Invalid/unmatched story selector → not-found error, no fallback | 1 test | — | — | — | — | 🟢 |
| AC4 | CLI `--story` flag threads through to the export request | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. All 4 ACs are server-side/CLI logic assertions — no CSS-layout dependence.

---

## Test Data Strategy

**Source:** Fixture pipeline-state feature object with 2+ stories, mixed `dorStatus` values
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Fixture feature with stories A (signed-off) and B (signed-off), A first in array | Synthetic | None | |
| AC2 | Same fixture, request with `story=B`'s slug | Synthetic | None | |
| AC3 | Same fixture, request with a non-existent slug and with a not-signed-off story's slug (two sub-cases) | Synthetic | None | |
| AC4 | Mocked HTTP layer capturing the constructed request URL from the CLI | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### noSelector_returnsFirstSignedOffStory

- **Verifies:** AC1
- **Precondition:** Fixture feature with stories A and B, both `dorStatus: 'signed-off'`, A first in the array
- **Action:** Call `findDorApprovedStory(feature)` (or the route handler) with no story selector
- **Expected result:** Story A's artefact is returned — identical to current behaviour
- **Edge case:** No

### validSelector_returnsThatSpecificStory

- **Verifies:** AC2
- **Precondition:** Same fixture as above
- **Action:** Call with a story selector matching story B's slug
- **Expected result:** Story B's artefact is returned, not story A's
- **Edge case:** No

### invalidSelector_returnsNotFoundNoFallback

- **Verifies:** AC3
- **Precondition:** Same fixture; selector value matches no story on the feature, and separately a selector matching a story that exists but is not `dorStatus: 'signed-off'`
- **Action:** Call with each invalid selector in turn
- **Expected result:** Both cases return the same not-found-class error as `ExportNotFoundError`'s existing convention — never a silent fallback to story A
- **Edge case:** Yes — two sub-cases (nonexistent slug, existing-but-unapproved slug)

---

## Integration Tests

### cliStoryFlag_threadsSelectorToExportRequest

- **Verifies:** AC4
- **Components involved:** `cli/bin/init.js`'s argument parsing, `cli/lib/saas-fetch.js`'s URL construction
- **Precondition:** Mocked HTTP layer capturing outgoing request URLs
- **Action:** Run `skills-repo init <dir> --from-saas <slug> --story <story-slug>`
- **Expected result:** The constructed request URL includes the story selector as a query parameter, matching the route's expected shape

---

## NFR Tests

### auditLog_includesSelectedStorySlug

- **NFR addressed:** Audit
- **Measurement method:** Assert the `export_fetch` audit log call includes the selected story slug (or `null` for default) as a field
- **Pass threshold:** Field present and correct in both the default and explicit-selector cases
- **Tool:** Mocked logger call-argument assertion

---

## Out of Scope for This Test Plan

- Changing the default (no-selector) behaviour — explicitly out of scope per the story.
- Testing DoR sign-off itself — unchanged, already tested elsewhere.

---

## Test Gaps and Risks

None — all ACs have automated coverage; no manual-only scenarios required.
