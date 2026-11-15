# pes-s1 verify-completion evidence (2026-11-15)

**Story:** Give every captured error an environment-specific fingerprint so a production error never joins a staging error group
**Branch:** `feature/pes-s1-environment-specific-error-fingerprint`, verified at commit `31c2af74a` (2 commits on top of `bb186e05e`; files changed: `src/web-ui/modules/error-capture.js` (4 insertions, 2 deletions) and `tests/check-coha-s5-error-capture.js`)

| Check | Result |
|---|---|
| Red run (commit 86dba6660, production code unchanged) | 82 passed, 6 failed: the key-list test, pes_UT1, pes_UT2, pes_UT3, pes_UT4, pes_IT1 |
| `node tests/check-coha-s5-error-capture.js` after the change | 88 passed, 0 failed (83 existing + 5 new) |
| `node tests/check-coha-s6-error-bridge.js` | 83 passed, 0 failed, 7 skipped (unchanged) |
| `npm test` full suite | 853 files, 4 failed, all on the acknowledged baseline: coha-s7 incident check (Windows CRLF, fixed by PR 1098), pipeline-state integrity (tfhc-s1), pcr-s1 timing, rtvap-s1 (no WSL bash). No new failures. |
| Non-ASCII in the two changed files | 0 |

| AC | Evidence | Result |
|---|---|---|
| AC1 fingerprint is [environment, code, route] | pes_UT1, pes_UT4 | Verified (unit) |
| AC2 staging and production differ | pes_UT2 | Verified (unit) |
| AC3 no canary text; incoming fingerprint ignored | pes_UT3 (four incoming shapes: array, string, number, null) and the unchanged canary tests | Verified (unit) |
| AC4 end to end through the real createApp | pes_IT1 (sink event fingerprint equals its own environment, code and route; no canary) | Verified (integration-real-code) |
| AC5 staging: accepted events, new issue id, new issue listed | Needs merge and staging deploy | Not yet verified (live) |
| AC6 production: new issue, alert, bridge issue | Needs production promotion and the operator-approved known login error | Not yet verified (live) |

4 of 6 acceptance criteria verified; AC5 and AC6 are live-only by the DoR's classification.

## Notes
- No review subagents were used: a 2-line production change whose privacy properties are pinned by UT3 (canaries and incoming fingerprint) and UT4 (unexpected environment values become `unknown`). The independent check is the red-then-green sequence and the unchanged canary suite.
- Residual risks: (1) PostHog may not apply the client fingerprint as its docs state (AC5 decides); (2) the route in the fingerprint may over-split issues (acceptable, routes are sanitised patterns); (3) the coha-s7 baseline failure remains until PR 1098 merges.