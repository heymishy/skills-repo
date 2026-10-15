## Test Plan: Produce a structured, DoD-sourced walkthrough document with AC-mapped screenshots

**Story reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s1-walkthrough-document-and-screenshots.md
**Review reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/review/fpd-s1-review-1.md (PASS, run 1)
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-10-15
**Test runner:** `node scripts/run-all-tests.js` (unit/integration); `npx playwright test` (E2E, ADR-018 — not in the `npm test` chain)

---

## Note on what's new here: a skill file + a capture script, not a web-ui route

Every other story tested this session modified existing `src/web-ui/` route code. This story introduces two new things with different testability profiles:

1. **`skills/feature-playback/SKILL.md`** — a pure instruction file, like every other skill in this repo. Not unit-testable as prose. This repo's own established mechanism for a skill file's structural integrity is `.github/scripts/check-skill-contracts.js`'s `CONTRACTS` array (ADR-026 — reuse this existing mechanism, not a new one): this story's implementation adds a `feature-playback` entry naming the file's own required structural markers (entry-condition text, completion-output markers). The existing pre-commit hook chain (already observed firing on every commit this session) then verifies it automatically — no new test file needed for this part.
2. **A new capture script** (`scripts/playback-capture.js`) — real, testable code. Reads a DoD artefact's AC Coverage table and Metric Signal section, drives Playwright screenshot capture, writes `walkthrough.md`. This gets real unit/integration tests below.

## Note on E2E detection (Step 3a)

No AC describes drag-and-drop or pointer coordinates. AC3 does describe real-browser screenshot capture against a running app, which this repo's own established pattern (confirmed repeatedly this session — `jcx-s6`, `jae-s5`, `cnsf-s1`) cannot execute in this session's sandbox (no local Postgres reachable, `decisions.md` D5). Split per that precedent: the capture script's own logic (which AC/selector it targets, what path it writes to, how it calls Playwright) is unit-testable via a mocked Playwright `page` object — no live app needed. The genuine end-to-end flow (real DoD feature → real capture → real file on disk) gets a real E2E spec, confirmed syntactically valid, RISK-ACCEPTed for execution per the same established pattern.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Walkthrough doc, one section per AC, sourced from DoD AC Coverage table | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Metric Signal section sourced from DoD's own Metric Signal section | 1 test | — | — | — | — | 🟢 |
| AC3 | Playwright captures one screenshot per AC at its stable state, embedded in the doc | 1 test (capture-script logic) | — | 1 test (real capture) | — | Real-browser-dependent | 🟡 |
| AC4 | Package not marked complete until engineer reviews each screenshot | 1 test | — | — | — | — | 🟢 |
| AC5 | Skill refuses to run against a non-DoD-validated feature, states the unmet gate | 1 test | — | — | — | — | 🟢 |
| (structural) | `skills/feature-playback/SKILL.md` required markers present | — | — | — | — | — | 🟢 (covered by existing `check-skill-contracts.js`, not a new test) |

---

## Coverage gaps

AC3's real-capture portion cannot be executed in this session's sandbox (missing Postgres, same gap as `decisions.md` D5). RISK-ACCEPTed per CLAUDE.md's B2 rule, consistent with every other story this session that hit this exact gap — the capture script's own logic is fully unit-tested; only the live end-to-end run is deferred.

---

## Test Data Strategy

**Source:** Synthetic — a fixture DoD artefact (AC Coverage table + Metric Signal section, modelled on this repo's own real DoD template), a fixture `pipeline-state.json` entry with `dodStatus: "complete"`, and a mocked Playwright `page` object for the capture script's own unit tests. Real `.webm`/screenshot capture for the E2E spec uses `seedJourneyWithStages`-style fixture seeding against a real or staging app (same convention as every other E2E spec this session).
**PCI/sensitivity in scope:** No
**Availability:** Available now for unit/integration; the E2E spec needs a real `DATABASE_URL` environment, not available in this session's sandbox.
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A fixture DoD artefact with a populated AC Coverage table (≥2 rows) | Synthetic, modelled on `templates/dod.md` | None | |
| AC2 | The same fixture DoD artefact's own Metric Signal section, plus a fixture `benefit-metric.md` | Synthetic | None | |
| AC3 (unit) | A mocked Playwright `page` object recording `.screenshot()` calls (path, selector) | Mocked | None | |
| AC3 (E2E) | A real DoD-validated feature seeded via fixtures, run against a real/staging app | Real seeded data | None | Cannot execute in this sandbox — RISK-ACCEPT |
| AC4 | The same fixture package, checked before/after an explicit "reviewed" confirmation step | Synthetic | None | |
| AC5 | A fixture feature with `dodStatus` other than `"complete"` | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

AC3's real-capture portion — see Coverage gaps above.

---

## Unit Tests

### AC1 (unit): walkthrough document has one section per AC, sourced from the DoD table

- **Verifies:** AC1
- **Precondition:** Fixture DoD artefact with 3 ACs in its own AC Coverage table
- **Action:** Run the capture script's own document-generation function against the fixture
- **Expected result:** `walkthrough.md` has exactly 3 AC sections, each one's narrative text matching that AC's own DoD table row verbatim (not a re-authored paraphrase, not E2E test file content)
- **Edge case:** No

### AC2 (unit): Metric Signal section sourced correctly

- **Verifies:** AC2
- **Precondition:** Fixture DoD artefact with a populated Metric Signal section, fixture `benefit-metric.md` with named targets
- **Action:** Run the document-generation function
- **Expected result:** The generated Metric Signal section includes each metric's target and current signal/evidence, matching the DoD artefact's own values exactly
- **Edge case:** No

### AC3 (unit): capture script's own logic — correct selector, correct path, correct AC mapping

- **Verifies:** AC3 (script-logic portion)
- **Precondition:** Fixture DoD artefact with 2 ACs, each naming a distinct UI state; mocked Playwright `page` object
- **Action:** Run the capture script
- **Expected result:** `page.screenshot()` is called exactly twice, once per AC, each call's own path matching `artefacts/[feature-slug]/playback/screenshots/[ac-id].png`, and the generated walkthrough document embeds each screenshot in its own correct AC section
- **Edge case:** No

### AC4 (unit): package not complete until editorial review confirmed

- **Verifies:** AC4
- **Precondition:** A fixture package with captured screenshots, no review confirmation yet
- **Action:** Check the package's own completion status
- **Expected result:** Status is `"pending-review"` or equivalent, not `"complete"`; after an explicit review-confirmation step is simulated, status becomes `"complete"`
- **Edge case:** No

### AC5 (unit): skill refuses to run against a non-DoD-validated feature

- **Verifies:** AC5
- **Precondition:** Fixture feature with `dodStatus: "in-progress"` (not `"complete"`)
- **Action:** Invoke the capture script against this feature
- **Expected result:** Throws/returns an explicit error naming the unmet gate (`dodStatus` is not `"complete"`) — does not silently proceed or produce a partial package
- **Edge case:** Yes — the boundary case itself (non-DoD-validated input) is the edge case being verified

---

## Integration Tests

### AC1 (integration): full document generation against a realistic multi-story DoD

- **Verifies:** AC1
- **Precondition:** A fixture feature with 2 stories, each with its own DoD artefact and AC Coverage table (mirrors `fpd-s3`'s own multi-story framing)
- **Action:** Run the capture script against the whole feature
- **Expected result:** The generated walkthrough document contains sections for every AC across both stories, correctly attributed to the right story — no cross-story mixing or omission
- **Edge case:** No

---

## NFR Tests

### Security — no new data exposure, confirmed by code read

- **NFR addressed:** Security
- **Measurement method:** Code review confirms the capture script reads only already-authenticated, already-rendered UI content — no new data access path
- **Pass threshold:** Zero new database queries or API calls beyond what the feature's own existing routes already serve
- **Tool:** Manual code read at DoR / implementation review

---

## Gap table

| Gap | Affected AC | Type | Why | Resolution |
|-----|-------------|------|-----|-----------|
| Real-browser screenshot capture against a live/staging app | AC3 | Real-browser-dependent | This session's sandbox has no reachable Postgres (`decisions.md` D5) | E2E spec written, confirmed syntactically valid, RISK-ACCEPTed for execution — same pattern as every other story this session that hit this gap |
