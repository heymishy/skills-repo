# Definition of Done: Derive capture target (URL + selector) from a story's own E2E spec

**PR:** https://github.com/heymishy/skills-repo/pull/1034 | **Merged:** 2026-10-28
**Story:** artefacts/2026-10-28-auto-capture-target-resolution/stories/actr-s1-derive-capture-target-from-e2e-spec.md
**Test plan:** artefacts/2026-10-28-auto-capture-target-resolution/test-plans/actr-s1-derive-capture-target-from-e2e-spec-test-plan.md
**DoR artefact:** artefacts/2026-10-28-auto-capture-target-resolution/dor/actr-s1-dor.md
**Assessed by:** Copilot (Claude Sonnet 5)
**Date:** 2026-10-28

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `AC1 (unit): derives the selector correctly` — PASS, re-run fresh post-merge on master | unit | None |
| AC2 | ✅ | `AC2 (unit): derives url from a goto call appearing after the AC tag` + `AC2 (real-file): resolves both url and selector from the real fpd-s4-caption-sync.spec.js` — both PASS | unit + integration-real-code (real repo file) | None — corrected from an initially-wrong "preceding goto" assumption before any code was written (see decisions.md 2026-10-28 CORRECTION) |
| AC2b | ✅ | `AC2b (unit)` + `AC2b (unit, selector mirror)` — both PASS | unit | None |
| AC3 | ✅ | `AC3 (unit): rejects an absolute goto URL`, `AC3 (unit): rejects a protocol-relative goto URL`, plus 2 security-regression tests — all PASS | unit | None in final shipped code — two real bypasses (tab-obscured, backslash-obscured protocol-relative URLs) were found and fixed during review before merge, not after; see decisions.md SECURITY FINDING entries |
| AC4 | ✅ | `AC4 (unit): returns null when the spec file does not name the AC at all` — PASS | unit | None |
| AC5 | ✅ | `tests/check-rpca-s2-selector-derivation-from-e2e-specs.js` — byte-for-byte unchanged file, 8/8 passing, identical to pre-task baseline | unit (pure relocation, verified against the pre-existing, untouched regression suite) | None |

All 6 ACs are pure function/parsing behaviour with no external-system or browser-observable claim, so `unit`/`integration-real-code` evidence is the appropriate and sufficient strength — the UI-evidence gate and the verification-strength-mismatch rule both do not apply here.

Re-run fresh post-merge on `master` (not reused from pre-merge): `node tests/check-actr-s1-capture-target-derivation.js` → 11/11 passing; `node tests/check-rpca-s2-selector-derivation-from-e2e-specs.js` → 8/8 passing.

**CI on the merge commit (`dc1f911e`):** Staging Deploy (the only CI job that actually exercises this code path) — "Deploy to wuce-staging" ✅ and "Staging smoke test (@mocked)" ✅, both passed. Two other post-merge jobs failed ("Improvement Agent — Scheduled Dreaming", "Deploy dashboards to GitHub Pages") — confirmed pre-existing and unrelated: both failed identically on the immediately-prior master push (the bookkeeping-only DoR commit, before any `actr-s1` code existed), due to a branch-protection rule conflict for an automated agent's own push and a GitHub Pages API permissions issue respectively. Neither touches this story's files.

---

## Scope Deviations

None. Confirmed at `/verify-completion` and re-confirmed here: the merged diff touches only `scripts/playback-capture.js`, `src/utils/capture-target-derivation.js`, `tests/check-actr-s1-capture-target-derivation.js`, plus artefact/state bookkeeping. No wiring into any real route or CLI call path (that is `actr-s2`'s scope, explicitly deferred), no change to `selectors-manual.json`'s format, no change to `.github/scripts/ppc-capture-worker.js` — all three Out-of-Scope items from the story artefact were respected.

---

## Test Plan Coverage

**Tests from plan implemented:** 9 planned (per the original test-plan.md) / 11 implemented (2 additional security-regression tests added during review, beyond the plan — a strengthening, not a gap)
**Tests passing in CI/locally:** 11/11 (new module) + 8/8 (existing regression suite) = 19/19

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 selector parity | ✅ | ✅ | |
| AC2 url-after-tag | ✅ | ✅ | |
| AC2 real-file confirmation | ✅ | ✅ | |
| AC2b url-leak guard | ✅ | ✅ | |
| AC2b selector-leak mirror | ✅ | ✅ | Added during spec-compliance review — the original plan only covered the url-leak case |
| AC3 absolute/protocol-relative rejection | ✅ | ✅ | |
| AC3 tab-obscured bypass regression | ✅ | ✅ | Added during review — a real, confirmed bypass found and closed before merge |
| AC3 backslash-obscured bypass regression | ✅ | ✅ | Added during review — a second, sibling bypass found and closed before merge |
| AC4 no-match null | ✅ | ✅ | |
| AC5 regression suite (8 tests) | ✅ (pre-existing, untouched) | ✅ | |

**Gaps (tests not implemented):** None.

**Coverage gap audit (CSS-layout-dependent):** N/A — this story has no CSS-layout-dependent ACs (`hasLayoutDependentGaps: false`), confirmed at DoR and unchanged at delivery.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Security — spec-derived URL must be rejected unless same-origin relative | ✅ | `_validateRelativeUrl` in `src/utils/capture-target-derivation.js`; 4 dedicated tests (absolute, protocol-relative, tab-obscured, backslash-obscured) all passing. Two real bypasses found and closed during review — see decisions.md SECURITY FINDING entries, 2026-10-28. |
| Performance — negligible, no SLO | ✅ | Pure in-memory regex parsing; no measurement needed, confirmed at design time and unchanged. |
| Accessibility — N/A | ✅ | No UI touched by this story. |
| Audit — none beyond existing logging | ✅ | No change to logging behaviour. |

Feature-level `nfr-profile.md` Status remains `Active` (not flipped to `Verified`) — `actr-s2`/`actr-s3`'s own NFR aspects (notably the deferred `check-design-tokens.js` run) are not yet verified, so the profile as a whole is not fully closed out yet.

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| `m1` (Self-service DoD validation adoption — owned by the `production-playback-capture` feature, claimed via this story's own Benefit Linkage) | N/A for this story | not-yet-measured | This feature's own `pipeline-state.json` `metrics` array is empty — `m1` is tracked under a different feature. See DoD Observation #2 below: this story's cross-feature metric claim is not yet formally reflected in `production-playback-capture`'s own `contributingStories`/`benefit-metric.md`, and should be added once the full 3-story `actr` mini-feature is complete (not per-story, to avoid the exact `contributingStories` drift pattern already found and fixed during `ppc-s7`'s own DoD). |

Evidence note (per the "not-yet-measured" path): no production capture-target auto-resolution has run yet — `actr-s2`/`actr-s3` (not yet started/complete) are what actually wire this into a live, usable path; `actr-s1` alone is inert library code with no consumer yet.

---

## Outcome

**COMPLETE**

**Follow-up actions:**
1. Once `actr-s2` and `actr-s3` are both DoD-complete, add `actr-s1`/`actr-s2`/`actr-s3` to `production-playback-capture`'s `benefit-metric.md` coverage table and `pipeline-state.json`'s `m1.contributingStories`, in one batch — not per-story, per the lesson from `ppc-s7`'s own metrics-drift fix. (Owner: whoever runs `actr-s3`'s own DoD.)
2. `nfr-profile.md`'s `Status` line should be revisited once `actr-s2`/`actr-s3` land their own `check-design-tokens.js` confirmation (currently deferred to their own implementation per DoR).

---

## DoD Observations

1. **Two real, exploitable security bypasses were found and fixed during this story's own review cycle, not discovered post-merge.** A tab-obscured and a backslash-obscured protocol-relative URL both defeated the originally-shipped `_validateRelativeUrl`'s naive `startsWith('//')` check while still being normalized to a host-changing reference by any real WHATWG-URL-spec navigator (confirmed empirically against the actual function and against Node's own `URL`, the same resolution algorithm Playwright's Chromium uses). Both are now closed, with dedicated regression tests. `/improve` candidate: the pattern used to find the second bypass — deliberately probing for siblings of a just-fixed bug with empirical verification rather than accepting the first fix as sufficient — is worth promoting into `/subagent-execution`'s own spec-compliance-reviewer guidance as a standing instruction for any security-relevant fix, not just this one story.
2. **Cross-feature metric contribution claimed but not yet formally tracked.** This story's own Benefit Linkage names `production-playback-capture`'s `m1` metric, but that feature's `pipeline-state.json` entry has not been updated to list `actr-s1` in `m1.contributingStories` — deliberately deferred to the end of the 3-story `actr` mini-feature (see Follow-up Action #1) to avoid doing the update 3 times and risking the exact drift pattern `ppc-s7`'s own DoD found and fixed.
3. **A design flaw was caught before any code was written, at zero cost.** The original AC2 draft assumed `page.goto(...)` precedes a spec's AC tag; checking 3 real spec files before writing the implementation plan disproved this. Logged in `decisions.md` as a model example of verifying a design assumption against real repo content before locking it in, per this repo's own `CLAUDE.md` guidance on mock-shape/assumption verification.
