## Test Plan: Surface decisions.md RISK-ACCEPT/SCOPE entries as a second reactive-work source

**Story reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/stories/urpv-s3-decisions-md-as-reactive-source.md
**Epic reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/epics/urpv-e1-reactive-work-visibility.md
**Test plan author:** Claude Sonnet 5 (Copilot)
**Date:** 2026-11-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | RISK-ACCEPT/SCOPE entries parsed and surfaced with date, code, decision-title | 2 tests | — | — | — | — | 🟢 |
| AC2 | Non-RISK-ACCEPT/SCOPE codes excluded | 1 test | — | — | — | — | 🟢 |
| AC3 | One malformed entry skipped silently (server-logged); well-formed entries still render | 1 test | 1 test | — | — | — | 🟢 |
| AC4 | Missing `decisions.md` or fetch failure → zero items, page renders normally, no visible error | 1 test | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None at the AC level. One NFR-level gap exists (fetch latency has no measured baseline) — see Test Gaps and Risks below; it is a measurement gap, not an AC coverage gap, since no AC asserts a specific latency threshold.

---

## Test Data Strategy

**Source:** Fixtures
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — fixture `decisions.md` files committed under the test suite

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Fixture `decisions.md` with at least one well-formed `RISK-ACCEPT` entry and one `SCOPE` entry, matching the real header format (`**YYYY-MM-DD \| CODE \| phase**`) | Fixtures | None | Modelled on this repo's own real entries (e.g. `itar`'s decisions.md) |
| AC2 | Fixture `decisions.md` with `ARCH`, `ASSUMPTION`, `SLICE` entries alongside the RISK-ACCEPT/SCOPE ones from AC1's fixture | Fixtures | None | |
| AC3 | Fixture `decisions.md` with 2 well-formed entries and 1 entry missing its header pattern (malformed) | Fixtures | None | Models field-order variation and an optional missing field, per the story's own Architecture Constraints note that the format is prose convention, not a rigid schema |
| AC4 | Mocked `fetchRepoPath` returning a 404 / throwing, simulating no `decisions.md` file | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None — all fixtures available now, self-contained in the test suite.

---

## Unit Tests

### Parses a well-formed RISK-ACCEPT entry into a reactive-work item

- **Verifies:** AC1
- **Precondition:** Fixture `decisions.md` content containing `**2026-11-08 | RISK-ACCEPT | discovery (/clarify)**` followed by a `**Decision:**` line.
- **Action:** Run the parser over the fixture content.
- **Expected result:** One item is returned with `code: "RISK-ACCEPT"`, the entry's date, and the decision-title text extracted from the `**Decision:**` line.
- **Edge case:** No.

### Parses a well-formed SCOPE entry into a reactive-work item

- **Verifies:** AC1
- **Precondition:** Fixture content with a `**2026-11-09 | SCOPE | ...**` entry.
- **Action:** Run the parser.
- **Expected result:** One item returned with `code: "SCOPE"`, correct date and title.
- **Edge case:** No.

### Excludes entries whose code is not RISK-ACCEPT or SCOPE

- **Verifies:** AC2
- **Precondition:** Fixture content with `ARCH`, `ASSUMPTION`, and `SLICE` entries mixed in alongside the RISK-ACCEPT/SCOPE entries.
- **Action:** Run the parser over the mixed fixture.
- **Expected result:** The returned item list contains only the RISK-ACCEPT and SCOPE entries — zero items with any other code.
- **Edge case:** No.

### Skips a malformed entry while still parsing the well-formed entries around it, and logs the skip server-side

- **Verifies:** AC3
- **Precondition:** Fixture content with entry 1 (well-formed RISK-ACCEPT), entry 2 (missing its header line entirely — malformed), entry 3 (well-formed SCOPE).
- **Action:** Run the parser; capture `console.error`/equivalent server-side log calls.
- **Expected result:** The returned item list contains exactly 2 items (entries 1 and 3); one server-side log call is made referencing the malformed entry; no exception propagates out of the parser.
- **Edge case:** Yes — one bad entry among good ones.

### Returns an empty list without throwing when the decisions.md fetch fails

- **Verifies:** AC4
- **Precondition:** Mocked `fetchRepoPath` rejects with a 404-equivalent error.
- **Action:** Call the function that fetches and parses `decisions.md` for a feature.
- **Expected result:** The function resolves to an empty item list; no exception propagates to the caller.
- **Edge case:** Yes — missing file is the explicit AC4 case.

---

## Integration Tests

### Consolidated features view renders well-formed entries and silently drops the malformed one

- **Verifies:** AC3
- **Components involved:** `artefact-fetcher.js` (`fetchRepoPath`, mocked), the new `decisions.md` parser, `_renderConsolidatedFeaturesSection`
- **Precondition:** Mocked `fetchRepoPath` returns the AC3 fixture content (2 well-formed + 1 malformed entry).
- **Action:** Call `_renderConsolidatedFeaturesSection` for the product.
- **Expected result:** The rendered page includes 2 reactive-work items from `decisions.md`; no error message is visible to the viewer; the malformed entry does not appear and does not block the other 2 from rendering.

### Consolidated features view renders normally with zero decisions.md items when the file is missing

- **Verifies:** AC4
- **Components involved:** Same as above.
- **Precondition:** Mocked `fetchRepoPath` rejects (404).
- **Action:** Call `_renderConsolidatedFeaturesSection`.
- **Expected result:** The page renders successfully (no thrown error, no 500 response); it shows zero `decisions.md`-sourced reactive items; no visible error banner or broken section appears.

---

## NFR Tests

### decisions.md content is rendered as escaped text, never raw HTML

- **NFR addressed:** Security (MC-SEC-01)
- **Measurement method:** Fixture entry whose decision-title text contains `<script>alert(1)</script>`; render the item; assert the output markup contains the HTML-escaped form (`&lt;script&gt;...`) and does not contain an executable `<script>` tag.
- **Pass threshold:** Zero unescaped HTML tags in the rendered output for any `decisions.md`-sourced text field.
- **Tool:** The project's configured test runner (`npm test`)

### decisions.md fetch is scoped to the same per-tenant repoOwner/repoName/accessToken already resolved for the product

- **NFR addressed:** Authorisation (ADR-025, multi-tenancy)
- **Measurement method:** Call the fetch-and-parse function for a specific product; assert `fetchRepoPath` is called with that product's own resolved `repoOwner`/`repoName`/`req.session.accessToken` — never another tenant's or product's values.
- **Pass threshold:** Exact match; zero cross-tenant parameter leakage.
- **Tool:** The project's configured test runner (`npm test`)

### decisions.md fetch latency at scale — not tested here

No test written. The story's own NFR profile (`nfr-profile.md`) explicitly records this as `[UNKNOWN BASELINE]` — no current measurement of typical feature count per connected product or per-fetch latency exists. Per the test-plan skill's own NFR scope rule, a pass threshold cannot be asserted without a real baseline; inventing one here would be the same "pin a number with no evidence" mistake already corrected elsewhere in this tranche (`pep-s2`/`pep-s3`). This is logged below as a measurement gap, with the owner and action already recorded in the NFR profile.

---

## Out of Scope for This Test Plan

- Parsing any `decisions.md` entry type other than RISK-ACCEPT/SCOPE — explicitly out of scope per the story.
- Caching `decisions.md` content — this story fetches live per page load; a future caching story would need its own test plan.
- Writing to `decisions.md` — read-only; `decisions-log-writer.js`'s existing write path and its own test coverage are untouched.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| `decisions.md` per-feature fetch latency at scale | No current measurement of typical feature count per connected product or per-fetch latency exists (`nfr-profile.md`, `[UNKNOWN BASELINE]`) — a threshold cannot be asserted without inventing one | Owner (Hamish King) to measure against a real multi-feature connected product (this repo itself qualifies) before urpv-s3 reaches /definition-of-ready, per the NFR profile's own gap entry; revisit this test plan to add a pass-threshold NFR test once a baseline exists |
