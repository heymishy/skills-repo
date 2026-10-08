## Test Plan: Wire customer_journey_stages boot-time table creation

**Story reference:** artefacts/2026-10-08-journey-stages-boot-wiring-gap/stories/csb-s1-wire-customer-journey-stages-boot-creation.md
**Epic reference:** None — short-track
**Test plan author:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-08

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`.

**Real architecture grounding (confirmed by direct code read, 2026-10-08):**
- `server.js`'s boot-time inline migration block (where `ep1-s1` added `customer_journeys`' own `CREATE TABLE IF NOT EXISTS`) has zero references to `customer_journey_stages` — confirmed via `grep -n "CREATE TABLE IF NOT EXISTS customer_journey_stages" src/web-ui/server.js` returning nothing.
- The proven, already-correct SQL exists verbatim in `scripts/migrate-schema-journeys.js` lines 46–64 (columns: `id`, `journey_id`, `tenant_id`, `name`, `position`, `description`, `customer_actions`, `touchpoints`, `channel`, `emotion`, `pain_points`, `opportunities`, `moment_of_truth`, `created_at`, `updated_at`, plus two indexes).
- `ep1-s1`'s own `"(boot) customer_journeys table creation is wired into server.js"` test is the established convention for this exact kind of assertion — a regex match against the real `server.js` source text.

**E2E/browser-layout detection (Step 3a):** N/A — this is a boot-sequence-only change with no new UI, route, or behavioural surface.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | server.js boot sequence contains the customer_journey_stages CREATE TABLE statement | 1 test | — | — | — | — | 🟢 |
| AC2 | Existing ep1-s1/ep1-s2 test suites continue to pass unmodified | 2 existing suites re-run | — | — | — | — | 🟢 |

---

## Coverage gaps

None. AC1 is a direct source-text assertion (matching `ep1-s1`'s own precedent); AC2 is confirmed by simply re-running the two existing, unmodified test files.

---

## Test Data Strategy

**Source:** Real file (`src/web-ui/server.js`'s own source text) for AC1; no new test data needed for AC2 (re-runs existing suites as-is).
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Raw source text of `server.js` | Real file | None | Regex-match a `CREATE TABLE IF NOT EXISTS customer_journey_stages` statement present in the boot sequence |
| AC2 | None new | N/A | None | Re-run `check-ep1-s1-journey-create.js` and `check-ep1-s2-journey-stage-create.js` unmodified |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### customer_journey_stages table creation is wired into server.js's boot sequence

- **Verifies:** AC1
- **Action:** Read `src/web-ui/server.js`'s own source text; regex-match `/CREATE TABLE IF NOT EXISTS customer_journey_stages/i`
- **Expected result:** Match found
- **Edge case:** No

### Existing ep1-s1 and ep1-s2 suites continue to pass unmodified

- **Verifies:** AC2
- **Action:** Run `node tests/check-ep1-s1-journey-create.js` and `node tests/check-ep1-s2-journey-stage-create.js`, both unmodified by this story
- **Expected result:** Both suites exit 0, same pass counts as before this change (7/7 and 7/7)
- **Edge case:** No
