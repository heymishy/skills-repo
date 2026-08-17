# Definition of Done: Build-identity footer stamp (commit SHA + PR #)

**PR:** https://github.com/heymishy/skills-repo/pull/615 | **Merged:** 2026-07-26
**Story:** artefacts/2026-07-26-canvas-render-and-story-extraction-fix/stories/alrf-s2-build-identity-footer-stamp.md
**Test plan:** `tests/check-alrf-s2-version-stamp.js` (no separate test-plan.md — retrospective story convention)
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — `buildVersionInfo()` correctly parses the originating PR number from a squash-merge commit subject | ✅ | `check-alrf-s2-version-stamp.js` AC1, verified against real commit `777e1603` ("... (#614)") | Automated test, re-run fresh 2026-08-17 | None |
| AC2 — a commit with no PR pattern yields `prNumber: null`, not a throw | ✅ | Same file, AC2 | Automated test, re-run fresh | None |
| AC3 — `getVersionInfo()` falls back to a clearly-labelled dev identity when `version.json` is absent | ✅ | AC3 | Automated test, re-run fresh | None |
| AC4 — `getVersionInfo()` reads real `version.json` content when present | ✅ | AC4 | Automated test, re-run fresh | None |
| AC5 — `GET /version` returns 200 JSON matching the current version info | ✅ | AC5 | Automated test, re-run fresh | None |
| AC6 — sidebar footer renders a working GitHub commit link with short SHA + PR # when available | ✅ | AC6, 4 sub-assertions | Automated test, re-run fresh | None |
| AC7 — no regression to existing shell/sidebar rendering | ✅ | 9 named regression suites cited by the story at merge time, all passing then | Not re-run individually in this pass — see Test Plan Coverage | None |

---

## Scope Deviations

None identified in this retroactive pass.

---

## Test Plan Coverage

**Tests passing:** 20/20 (`check-alrf-s2-version-stamp.js`), re-run fresh 2026-08-17 — grew from the story's originally-cited "16 ACs" to 20 assertions; all passing, no regression, growth reflects natural test-suite maturation since 2026-07-26.
**Story-cited regression suites at merge** (`check-wuce18-html-shell.js` 44/44, `check-b2-account-nav.js` 8/8, `check-d2-banner-exit-permission-visibility.js` 24/24, `check-d4-nfr-security-review-and-hardening.js` 23/23, `check-kfd1-...` 42/42, `check-wuce20-...` 40/40, `check-wuce23-...` 35/35, `check-acps-s1-...` 3/3, `check-wuce25-...` 52/52) — not individually re-run in this pass; not flagged as newly-broken by any later cluster's regression sweeps touching the same shell/sidebar code (`d2`, `wugs` clusters both passed their own DoD passes since).
**Gaps:** None identified.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Graceful degradation: no `version.json` present (local dev, or a build without the stamp step) | ✅ | AC3, `dev` fallback identity, no throw |
| No new attack surface: `/version` is unauthenticated but only exposes build metadata (SHA, PR #, timestamp), same trust level as `/health` | ✅ | Story's own framing, unchanged in this pass |

---

## Metric Signal

No formal benefit-metric artefact traced. This is delivery-confidence tooling (closing the "did my fix actually deploy?" gap that this session's own `alrf-s1` fix ran into) — not tied to a product-facing metric.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None. Story's own Out of Scope items (wiring `/version` into the production `skills-framework` deploy workflow, and a "what's live vs what's on master" diff view) remain explicitly deferred, not gaps.

---

## DoD Observations

1. ~3 weeks live in production, no incidents reported.
2. Test count grew from 16 to 20 assertions since original merge — healthy organic growth, re-confirmed all passing rather than assumed stale.
