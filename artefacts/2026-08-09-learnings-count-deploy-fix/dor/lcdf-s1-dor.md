## Definition of Ready: lcdf-s1 — Compute the learnings count at build/deploy time instead of reading a file absent from the deployed image

**Story:** artefacts/2026-08-09-learnings-count-deploy-fix/stories/lcdf-s1-build-time-learnings-count.md
**Review artefact:** artefacts/2026-08-09-learnings-count-deploy-fix/review/lcdf-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-09-learnings-count-deploy-fix/test-plans/lcdf-s1-test-plan.md
**Date:** 2026-08-09

---

### Scope contract

**Files in scope (exact touchpoints):**
- `scripts/write-learnings-count-file.js` (new) — mirrors `scripts/write-version-file.js`'s exact pattern: computes the real count from `workspace/learnings.md` and writes `learnings-count.json` at the repo root.
- `src/web-ui/content/learnings-count.js` — `getLearningsCount()` gains a second fallback tier: try the direct `workspace/learnings.md` read first (unchanged, preserves AC3's local/CI correctness); on failure, try reading `learnings-count.json`; on failure, fall back to `0` (AC4, `lccf-s1`'s existing safety net, preserved).
- `Dockerfile` — new optional-copy line for `learnings-count.jso[n]`, mirroring the existing `version.jso[n]` line exactly (bracket glob, same `COPY --chown=node:node` pattern, same comment style referencing the precedent).
- `.github/workflows/staging-deploy.yml` — new `node scripts/write-learnings-count-file.js` step, placed alongside the existing `node scripts/write-version-file.js` step (same job, same point in the pipeline).
- `tests/check-lcdf-s1-*.js` (new) — unit tests per the test plan.

**Files explicitly out of scope (must not be touched):**
- `scripts/write-version-file.js`, `src/web-ui/utils/version-info.js` — consumed as a pattern reference, not modified.
- `workspace/learnings.md`'s own format or the `## `-heading counting logic — reused as-is.
- `Dockerfile`'s `COPY skills/`, `COPY product/`, or the mock-gateway fixture copy lines — untouched.

### Architecture Constraints

No new architectural decision — this follows an already-established, already-proven pattern in this exact codebase (`version.json`/`write-version-file.js`) rather than introducing a new build-time-injection mechanism. No ADR required.

**Precedent to follow exactly:** `Dockerfile`'s existing comment block for `version.jso[n]` (lines ~38-43) explains the bracket-glob optional-copy trick and the `DEV_FALLBACK` pattern in `version-info.js` — the new `learnings-count.jso[n]` line and `getLearningsCount()`'s new middle-tier fallback should follow the same shape: optional at the Docker layer, with a graceful in-code fallback when absent (which, unlike `version-info.js`'s `DEV_FALLBACK`, is `getLearningsCount()`'s *existing* direct-file-read path for local/CI, not a new hardcoded dev value).

### Human oversight

**Low** — mechanical application of an already-proven pattern in this same codebase; complexity 2 is about design-choice research (already done and documented above), not implementation risk.

### Coding Agent Instructions

1. Create `scripts/write-learnings-count-file.js`, closely mirroring `scripts/write-version-file.js`'s structure: a pure, testable `buildLearningsCountInfo()` function (compute the count from `workspace/learnings.md`, reusing the exact `## `-heading regex `learnings-count.js` already uses) plus a `main()` that writes `learnings-count.json` (e.g. `{ "count": N, "computedAt": "<ISO8601>" }`) to the repo root.
2. In `learnings-count.js`, restructure `getLearningsCount()`: keep the existing try/catch around the direct `workspace/learnings.md` read as the first attempt (preserves AC3 exactly as today); on that catch, attempt to read and parse `learnings-count.json` from the repo root before falling back to `0`; wrap that second attempt in its own try/catch so a missing/malformed baked file also fails open to `0` (AC4).
3. In `Dockerfile`, add `COPY --chown=node:node learnings-count.jso[n] ./` immediately after the existing `version.jso[n]` line, with a comment following that line's own style, referencing this story.
4. In `.github/workflows/staging-deploy.yml`, add `run: node scripts/write-learnings-count-file.js` as a new step immediately after (or alongside) the existing `write-version-file.js` step.
5. Write the tests per the test plan; confirm AC1-AC4 locally (AC2/AC4 via the simulated-environment tests, not a real deploy).
6. After merge and deploy, perform AC5's manual check against real wuce-staging.

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Low)
- [x] No CSS-layout-dependent AC left unclassified (none — backend/build-pipeline change, no UI)

**PROCEED: Yes**
