## Test Plan: Feature artefact lookup falls back to the archived directory when the primary path is gone

**Story reference:** artefacts/2026-09-04-artefact-lookup-archived-directory-fix/stories/aada-s1-check-archived-directory-fallback.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent, operator-directed)
**Date:** 2026-09-04

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Primary path exists — archived path never checked, behaviour unchanged | 1 | — | — | — | — | 🟢 |
| AC2 | Primary path absent, archived path exists — real files returned, not null | 1 | — | — | — | — | 🟢 |
| AC3 (regression) | Neither path exists — still returns null | 1 | — | — | — | — | 🟢 |

**E2E / browser-layout scan (Step 3a):** No CSS-layout-dependent language — pure filesystem-lookup function, matching this repo's own established convention for testing this exact function (`check-alrf-s1-artefact-list-repo-root-fallback.js`). N/A.

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — real temporary directories via `fs.mkdtempSync`, matching `check-alrf-s1-artefact-list-repo-root-fallback.js`'s own established fixture pattern (a real filesystem check, not a mock, since this function's entire job is filesystem interaction).
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — each test creates and tears down its own temp directory.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A temp repo with `artefacts/{slug}/discovery.md` | Synthetic, `fs.mkdtempSync` | None | |
| AC2 | A temp repo with `artefacts/archived/{slug}/discovery.md` and NO `artefacts/{slug}/` at all | Synthetic, `fs.mkdtempSync` | None | |
| AC3 | A temp repo with neither path | Synthetic, `fs.mkdtempSync` | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Primary path exists: archived path never checked, behaviour unchanged
- **Verifies:** AC1
- **Precondition:** A temp repo with `artefacts/{slug}/discovery.md` — no `artefacts/archived/{slug}/` directory at all.
- **Action:** Call `listLocalArtefacts(root, slug)`.
- **Expected result:** Returns the real file from the primary path. (No archived directory exists, so this also implicitly proves the function doesn't require one to succeed — the common case is unaffected.)
- **Edge case:** No

### Primary path absent, archived path exists: real files returned, not null
- **Verifies:** AC2
- **Precondition:** A temp repo with `artefacts/archived/{slug}/discovery.md` and `artefacts/archived/{slug}/stories/x.1-story.md` — `artefacts/{slug}/` does not exist.
- **Action:** Call `listLocalArtefacts(root, slug)`.
- **Expected result:** Returns both real files from the archived path, with paths reflecting their real archived location (`artefacts/archived/{slug}/discovery.md`) — not `null`.
- **Edge case:** Yes — this is the exact case this story fixes; a genuinely archived feature previously returned `null` here.

### Neither path exists: still returns null (regression guard)
- **Verifies:** AC3
- **Precondition:** A temp repo with neither `artefacts/{slug}/` nor `artefacts/archived/{slug}/`.
- **Action:** Call `listLocalArtefacts(root, slug)`.
- **Expected result:** Returns `null`, exactly as before this fix — a genuinely nonexistent feature still shows "No artefacts found."
- **Edge case:** No

---

## Out of Scope for This Test Plan

- Any test of `listArtefacts`'s own merge-with-Postgres or GitHub-API-fallback logic — unchanged, already covered by `check-alrf-s1-artefact-list-repo-root-fallback.js` and `check-lpmf-s1-artefact-list-merge.js`.
- Any test of the archival mechanism itself (what moves a feature to `artefacts/archived/`) — already shipped, out of scope.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
