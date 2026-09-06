# Test Plan: The two existing non-trace consumers of artefact fetching keep working unchanged

**Story reference:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s6-regression-verification.md
**Epic reference:** artefacts/2026-09-06-canonical-artefact-trace/epics/canonical-artefact-trace.md
**Test plan author:** Copilot (Claude)
**Date:** 2026-09-06

**Target modules (verification only, no production code changes):** `src/web-ui/routes/journey.js` (line 921 gate-confirm call site), `src/web-ui/adapters/export-data-source.js` (SaaS export call site), full repo regression suite
**Test runner:** `node scripts/run-all-tests.js`
**Test file:** `tests/check-cat-s6-regression-verification.js`

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | journey.js gate-confirm returns identical artefact content after cat-s5's changes | — | 1 | — | — | — | 🟢 |
| AC2 | export-data-source.js per-tenant repoOverride resolves correctly, independent of trace's single-repo assumptions | — | 1 | — | — | — | 🟢 |
| AC3 | bsgm-s1/sri-s1/adlr-s1/fadm-s1 regression suites pass unchanged | — | 1 | — | — | — | 🟢 |
| AC4 | Full suite has no new failures beyond the two documented pre-existing baseline failures | — | 1 | — | — | — | 🟢 |

---

## Coverage gaps

None. This is explicitly a verification-only story; all 4 ACs are full-suite / real-call-site integration checks by design (per the story's own AC1 text: "verified via a direct test against the real call site, not a reimplemented mock of it").

---

## Test Data Strategy

**Source:** Mixed
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A real feature with correct registration, exercised through journey.js's actual gate-confirm code path | Real, on-disk fixture feature already used by `journey.js`'s own existing tests | None | Per the story's own mock-shape-verification constraint (CLAUDE.md's `tir-s5` lesson), this test calls the real `journey.js` function, not a reimplemented stand-in |
| AC2 | A multi-tenant `repoOverride` scenario | Real shape confirmed by reading `export-data-source.js`'s current production wiring first (per CLAUDE.md's mock-shape-verification rule), then constructing a fixture matching that exact shape | None | Read the real wiring code before writing the mock, per the explicit `tir-s5` lesson this story's own Architecture Constraints cites by name |
| AC3 | The existing regression suites for the 4 named prior stories | Real, on-disk: `tests/check-bsgm-s1-*.js`, `check-sri-s1-*.js`, `check-adlr-s1-*.js`, `check-fadm-s1-*.js` | None | Run as-is, no modification |
| AC4 | The full repo test suite output | `node scripts/run-all-tests.js` | None | Baseline failures already documented this session: `check-p3.5-validate-trace.js`'s draft-status case, `check-pcr-s1-test-runner.js`'s timing threshold |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None — per this story's own scope (verification-only, no new production logic), all coverage is integration-level against real call sites and the real suite, not isolated unit tests of new functions (there are none).

---

## Integration Tests

### journey.js's real gate-confirm call site returns identical content after cat-s5's internal changes (AC1)

- **Verifies:** AC1
- **Components involved:** `journey.js` line 921 (`fetchArtefact(journey.featureSlug, stageName, req.session.accessToken, _dasOwnerRepo)`), updated `artefact-fetcher.js`
- **Precondition:** Real fixture feature with correct registration, `req.session.accessToken` populated per CLAUDE.md's canonical field-name convention (never the deprecated `req.session.token`)
- **Action:** Exercise the real gate-confirm flow (calling `journey.js`'s actual exported function, not a reimplemented mock) before and after `cat-s5`'s changes
- **Expected result:** `assert.strictEqual(afterContent, beforeContent)` — identical artefact content returned
- **Edge case:** No

### export-data-source.js's per-tenant repoOverride still resolves independently of the trace's single-repo assumption (AC2)

- **Verifies:** AC2
- **Components involved:** `export-data-source.js`, updated `artefact-fetcher.js`
- **Precondition:** A `repoOverride` fixture matching the real, current production shape (confirmed by reading `export-data-source.js`'s actual wiring code first — per the mock-shape-verification rule)
- **Action:** Exercise the real export path with the `repoOverride` set to a specific tenant's repo
- **Expected result:** The export resolves against the overridden tenant repo, not any single-repo assumption `cat-s1`-`cat-s5`'s trace logic makes internally — confirming `mtrr-s1`'s cross-tenant isolation is not silently reopened
- **Edge case:** Yes — this is the specific cross-tenant isolation regression the AC names explicitly

### bsgm-s1, sri-s1, adlr-s1, and fadm-s1's own regression suites all pass unchanged (AC3)

- **Verifies:** AC3
- **Components involved:** All four suites' target modules, now sitting on top of this epic's changes
- **Precondition:** The four suites exist and passed before this epic's work began (baseline captured at test-authorship time)
- **Action:** Run `node tests/check-bsgm-s1-*.js`, `check-sri-s1-*.js`, `check-adlr-s1-*.js`, `check-fadm-s1-*.js` (or their real filenames, confirmed via `tests/` glob at implementation time) after `cat-s1`-`cat-s5` land
- **Expected result:** All four suites report 100% pass, zero modified assertions — since this epic changes internal implementation, not the observable contracts those suites exercise
- **Edge case:** No

### full repo suite shows no new failures beyond the two documented baseline failures (AC4)

- **Verifies:** AC4
- **Components involved:** Entire `tests/check-*.js` + `.github/scripts/check-*.js` + grandfather-list suite, via `node scripts/run-all-tests.js`
- **Precondition:** Baseline failure list captured at test-authorship time: `check-p3.5-validate-trace.js`'s unrelated draft-status case, `check-pcr-s1-test-runner.js`'s timing-sensitive threshold
- **Action:** Run the full suite after all of `cat-s1`-`cat-s6`'s changes land
- **Expected result:** The only failing files are exactly those two pre-existing ones — diffed against the baseline list, not just "suite mostly passes"
- **Edge case:** No

---

## NFR Tests

### mtrr-s1's cross-tenant isolation is not weakened

- **NFR addressed:** Security
- **Measurement method:** The AC2 integration test itself doubles as this NFR's verification — a tenant-A `repoOverride` fixture must never resolve to tenant-B's repo path
- **Pass threshold:** Zero cross-tenant path leakage across two distinct `repoOverride` fixtures run in the same test
- **Tool:** `assert`, inline — asserting the resolved repo path for tenant A never equals or contains tenant B's repo identifier

---

## Out of Scope for This Test Plan

- Fixing either of the two known pre-existing baseline failures — explicitly out of scope per the story; this test plan only confirms they remain the *only* failures, not that they're resolved.
- Any change to `journey.js`'s or `export-data-source.js`'s own code — verification-only; if AC1 or AC2 surfaces a real defect, it becomes a new, separate story per the story's own Out of Scope section, not a fix folded into this test plan.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC2's `repoOverride` fixture shape depends on correctly reading `export-data-source.js`'s real current wiring before this story's implementation begins | Exactly the `tir-s5` mock-shape mismatch class of risk this story's own Architecture Constraints names by id | Read the real wiring code first (mandatory per CLAUDE.md's own documented rule), construct the fixture to match; do not assume shape from the function signature alone |
