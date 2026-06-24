## Test Plan: shr.2 — Support `ops/` path prefix for standalone infra changes

**Story reference:** artefacts/2026-06-22-skills-infra-migration-tracks/stories/shr.2.md
**Epic reference:** artefacts/2026-06-22-skills-infra-migration-tracks/epics/shared-infrastructure.md
**Test plan author:** Claude Sonnet 4.6
**Date:** 2026-06-25
**Test file:** `tests/check-shr2-ops-path.js`
**Test runner:** `node tests/check-shr2-ops-path.js`

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `ops/2026-06-25-secrets-rotation` accepted as valid slug | 2 tests | — | — | — | — | 🟢 |
| AC2 | `artefacts/ops/[slug]/infra/standalone-infra-def.md` resolves within repoRoot | 2 tests | — | — | — | — | 🟢 |
| AC3 | Traversal `ops/../../etc/passwd` does not escape repoRoot | 2 tests | — | — | — | — | 🟢 |
| AC4 | Standard slugs unaffected — integrity check unchanged | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — slug strings and path strings constructed in test; `path.resolve()` used against a fixed repoRoot string
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Slug string `ops/2026-06-25-secrets-rotation` | Literal in test | None | |
| AC2 | Artefact path under `artefacts/ops/[slug]/infra/` | Constructed in test | None | repoRoot = resolved repo root dir |
| AC3 | Traversal slug `ops/../../etc/passwd` | Literal in test | None | |
| AC4 | Standard slug `2026-06-22-test-feature` | Literal in test | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### ops-slug-accepted-by-integrity-check
- **Verifies:** AC1
- **Precondition:** `scripts/check-pipeline-state-integrity.js` has been extended to accept `ops/`-prefixed slugs
- **Action:** Build a synthetic pipeline-state with a feature having slug `ops/2026-06-25-secrets-rotation`; run the integrity check on it
- **Expected result:** Integrity check exits 0 — `ops/` prefix is accepted as a valid slug format
- **Edge case:** No

### ops-slug-with-date-and-description-accepted
- **Verifies:** AC1
- **Precondition:** Same as above
- **Action:** Test slug `ops/2026-12-31-firewall-rule-update` (different date, different descriptor)
- **Expected result:** Accepted without error
- **Edge case:** No

### ops-artefact-path-resolves-within-repoRoot
- **Verifies:** AC2
- **Precondition:** Known `repoRoot` string; artefact path `artefacts/ops/2026-06-25-secrets-rotation/infra/standalone-infra-def.md`
- **Action:** Compute `path.resolve(repoRoot, artefactPath)`; assert `resolvedPath.startsWith(path.resolve(repoRoot) + path.sep)`
- **Expected result:** Resolved path starts with repoRoot — no escape
- **Edge case:** No

### ops-path-containment-holds-for-nested-subdir
- **Verifies:** AC2
- **Precondition:** Artefact path with nested subdirectory under ops slug
- **Action:** Test `artefacts/ops/2026-06-25-secrets-rotation/trace/s1-trace.json`; assert path containment
- **Expected result:** Path contained within repoRoot
- **Edge case:** No

### traversal-in-ops-slug-does-not-escape-repoRoot
- **Verifies:** AC3
- **Precondition:** Slug `ops/../../etc/passwd`; artefact path derived from this slug
- **Action:** Compute resolved artefact path; assert it does NOT start with `path.resolve(repoRoot) + path.sep` OR assert the slug is rejected before path construction
- **Expected result:** Guard fires — either the slug is rejected as invalid, or the resolved path does not escape repoRoot
- **Edge case:** Yes — primary security test

### traversal-via-double-dot-in-ops-middle-segment
- **Verifies:** AC3
- **Precondition:** Slug `ops/2026-06-25-valid/../../../etc`
- **Action:** Attempt to derive artefact path from this slug; assert guard holds
- **Expected result:** Path does not escape repoRoot
- **Edge case:** Yes — second traversal form

### standard-slug-unaffected-by-ops-extension
- **Verifies:** AC4
- **Precondition:** Standard slug `2026-06-22-skills-infra-migration-tracks`
- **Action:** Run integrity check on state with standard slug
- **Expected result:** Integrity check passes exactly as before — no behaviour change for non-ops slugs
- **Edge case:** No

---

## Integration Tests

None — all ACs are unit-testable against the path resolution and integrity check module in isolation.

---

## NFR Tests

### ops-path-traversal-guard-is-mandatory
- **NFR addressed:** Security — path-traversal guard must not be relaxed for `ops/` prefix
- **Measurement method:** Run the test `traversal-in-ops-slug-does-not-escape-repoRoot`; assert that no code path allows an `ops/` slug to produce an out-of-repoRoot resolved path
- **Pass threshold:** Zero out-of-repoRoot paths produced for any `ops/[traversal-sequence]` input
- **Tool:** Node.js `path.resolve` + assertion

---

## Out of Scope for This Test Plan

- Web UI journey creation for ops/ changes — out of scope per story
- Automatic discovery of ops/ slugs from filesystem — out of scope per story
- infra-definition skill behaviour with ops/ prefix — tested in inf.1

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
