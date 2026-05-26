# Definition of Ready — Hiring gap analysis and leadership coverage views (Tabs 3 and 4)

**Story:** wfp.7
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27
**DoR run by:** Copilot

---

## Step 1 — Story loaded

**Story loaded:** Hiring gap analysis and leadership coverage views (Tabs 3 and 4)
**Review:** PASS — wfp.7, no HIGH findings
**Test plan:** 18 tests covering 6 ACs — 15 unit + 3 E2E
**Verification script:** 10 scenarios (wfp.7-verification.md)

---

## Step 2 — Contract Proposal

**What will be built:**
- Extensions to `dashboards/wfp-functions.js`:
  - `renderHiringGapRow(entry)` — renders slug, requiredRole, requiredTags, mode, and "No current capacity" FTE cell
  - `renderHiringGapTable(entries)` — table with `<th>` headers; calls renderHiringGapRow per entry
  - `filterHiringGaps(initiativeMap)` — returns entries where computedFTE === 0 or allocationMode === "net-new"
  - `renderLeadershipCoverage(groups)` — renders leadership coverage per product group
  - `assessLeadershipCoverage(group, rosterRecords)` — returns `{ fte, hasLeader }` for a group; counts direct+profile-match only; uses `LEADERSHIP_ROLES` constant
- `LEADERSHIP_ROLES` constant exported from `dashboards/wfp-functions.js`
- `dashboards/workforce.html` Tabs 3 and 4 wired up

**What will NOT be built:**
- Tab 5 Initiative Rollup — wfp.8 scope
- Suggested hire recommendations — out of scope
- Editing entries from browser

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — gap rows rendered with slug/requiredRole/requiredTags/mode/"No current capacity" | Unit: `renderHiringGapRow` all fields | Unit |
| AC2 — group filter: entries without productGroup always visible | Unit: `filterHiringGaps` no-productGroup test | Unit |
| AC3 — leadership coverage: FTE >= 3 with direct+profile-match only | Unit: `assessLeadershipCoverage` FTE3 test | Unit |
| AC4 — no leader: "Leadership gap" badge | Unit: `assessLeadershipCoverage` no-leader + `renderLeadershipCoverage` badge test | Unit |
| AC5 — FTE < 3 and has leader: no badge | Unit: `assessLeadershipCoverage` FTE < 3 test | Unit |
| AC6 — empty state for both tabs | Unit: `renderHiringGapTable` empty + E2E: Tab 3 empty state | Unit + E2E |

**Assumptions:**
- wfp.6 is DoD-complete (`dashboards/wfp-functions.js` has allocation functions; `dashboards/workforce.html` has Tabs 1–2)
- wfp.4 is DoD-complete (profile-match entries in initiative-map.json)
- `LEADERSHIP_ROLES` = `["Product Owner", "Engineering Chapter Lead", "People Leader"]`

**Estimated touch points:**
- Files: `dashboards/wfp-functions.js` (extend), `dashboards/workforce.html` (extend Tabs 3–4), `tests/check-wfp7-hiring-gap.js` (new), `tests/e2e/wfp7-hiring-gap.spec.js` (new)

---

## Step 3 — Contract review

Contract review passed — extends established pattern; all ACs covered by unit + E2E tests.

---

## Hard blocks

| Check | Result | Notes |
|-------|--------|-------|
| H1 — As / Want / So with named persona | PASS | "As a Head of Engineering, I want … So that …" |
| H2 — three or more ACs in Given / When / Then | PASS | 6 ACs, all in GWT format |
| H3 — every AC has at least one test | PASS | All 6 ACs covered |
| H4 — out-of-scope populated | PASS | Tab 5, hire recommendations, editing explicit out-of-scope |
| H5 — benefit linkage to named metric | PASS | M2 and M3 |
| H6 — complexity rated | PASS | Rating: 1 |
| H7 — no unresolved HIGH findings | PASS | Review PASS, 0 HIGH findings |
| H8 — no uncovered ACs | PASS | All 6 ACs covered |
| H8-ext — cross-story schema check | PASS | Upstream: wfp.6 / wfp.4 — no pipeline-state schema dependency |
| H9 — architecture constraints populated | PASS | Extends wfp-functions.js; LEADERSHIP_ROLES constant; no new deps |
| H-E2E — CSS-layout-dependent gaps | PASS | Badge colour rendered with colour+text; not purely CSS-layout-dependent |
| H-NFR — NFR profile exists | PASS | nfr-profile.md present |
| H-NFR2 — compliance NFRs have sign-off | PASS | No regulatory clause NFRs |
| H-NFR3 — data classification not blank | PASS | Internal / Private in nfr-profile.md |
| H-NFR-profile — NFR profile present for stories with NFRs | PASS | nfr-profile.md exists |
| H-GOV — Approved By populated | PASS | Hamish King 2026-05-26 |
| H-ADAPTER — injectable adapters wired | PASS | No injectable adapters introduced |

---

## Warnings

| Check | Result |
|-------|--------|
| W1 — NFRs populated or None | No warning — Performance + Accessibility + Security NFRs present |
| W2 — scope stability declared | No warning — Stable |
| W3 — MEDIUM review findings acknowledged | No warning — 0 MEDIUM findings |
| W4 — verification script reviewed by domain expert | Warning — script not yet reviewed by a domain expert |
| W5 — no UNCERTAIN items in test plan | No warning |

**W4 acknowledgement:** Internal engineering tool, low risk. Operator proceeds.

---

## Oversight level

**Low** — from parent epic wfp-planning-dashboard.md. No sign-off required.

---

## Coding Agent Instructions

### Story
Hiring gap analysis and leadership coverage views (Tabs 3 and 4) — wfp.7

### DoR contract reference
`artefacts/2026-05-26-bsr-workforce-planner/dor/wfp.7-dor-contract.md`

### Test plan
`artefacts/2026-05-26-bsr-workforce-planner/test-plans/wfp.7-test-plan.md`
18 tests — 15 unit + 3 E2E — all must pass.

### Test files
- `tests/check-wfp7-hiring-gap.js` — unit tests. Add to `npm test` chain.
- `tests/e2e/wfp7-hiring-gap.spec.js` — Playwright E2E.

### What to build
1. Extend `dashboards/wfp-functions.js` with: `LEADERSHIP_ROLES` constant, `filterHiringGaps(initiativeMap)`, `renderHiringGapRow(entry)`, `renderHiringGapTable(entries)`, `assessLeadershipCoverage(group, rosterRecords)`, `renderLeadershipCoverage(groups)`.
2. Extend `dashboards/workforce.html` Tab 3 (Hiring Gap Analysis) and Tab 4 (Leadership Coverage) rendering.
3. `tests/check-wfp7-hiring-gap.js` — all tests RED before implementation.
4. `tests/e2e/wfp7-hiring-gap.spec.js` — all tests RED before implementation.
5. Wire `node tests/check-wfp7-hiring-gap.js` into `package.json` test script.

### LEADERSHIP_ROLES constant
`["Product Owner", "Engineering Chapter Lead", "People Leader"]` — Leadership coverage assessment uses direct + profile-match FTE only (not net-new). FTE threshold for "has leader" badge: 3.

### Dependencies
wfp.6 and wfp.4 must be DoD-complete before implementation begins.

### Definition of done for this story
- `node tests/check-wfp7-hiring-gap.js` exits 0 with 15 passing
- `npm run test:e2e -- --grep wfp7` exits 0 with 3 passing
- `npm test` exits 0
- Tabs 3 and 4 render correctly with sample initiative-map.json and roster.json

### Proceed: Yes

---

**Definition of ready: PROCEED — Hiring gap analysis and leadership coverage views Tabs 3 and 4 (wfp.7)**
