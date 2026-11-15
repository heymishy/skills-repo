# pes-s2 verify-completion evidence (2026-11-15)

**Story:** Send the environment-specific fingerprint as a string, because PostHog rejects an array
**Branch:** `feature/pes-s2-string-fingerprint`, verified at commit `c718e49fe` (2 commits on top of `647bd89ff`: `src/web-ui/modules/error-capture.js` 2 insertions and 1 deletion, `tests/check-coha-s5-error-capture.js`)

| Check | Result |
|---|---|
| Red run (commit b07603ec5, array still in `src/`) | 83 passed, 6 failed: pes_UT1, UT2, UT3, UT4, UT5, IT1 |
| `node tests/check-coha-s5-error-capture.js` after the fix | 89 passed, 0 failed (83 existing + 5 pes tests edited + 1 new UT5) |
| `node tests/check-coha-s6-error-bridge.js` | 83 passed, 0 failed, 7 skipped (unchanged) |
| `npm test` full suite | 853 files, 4 failed: pipeline-state integrity (tfhc-s1), pcr-s1 timing, rtvap-s1 (no WSL bash), and the cat-s1 50 ms timing assertion, which passes alone (see below) and was acknowledged as environmental on 2026-11-15. All on the acknowledged baseline; no new failures. The coha-s7 file is green now that PR 1098 is merged. |
| Non-ASCII in the two changed files | 0 |

| AC | Evidence | Result |
|---|---|---|
| AC1 string, three parts | pes_UT1, pes_UT5 | Verified (unit) |
| AC2 environments differ | pes_UT2 | Verified (unit) |
| AC3 no canary, incoming ignored, unknown environment | pes_UT3, pes_UT4, pes_IT1 (end to end through the real createApp) | Verified (unit and integration-real-code) |
| AC4 live staging: accepted, new issue id, new issue | Needs merge and staging deploy | Not yet verified (live) |
| AC5 live production alert | Needs production promotion and the operator-approved known login error | Not yet verified (live) |

3 of 5 acceptance criteria verified; AC4 and AC5 are live-only. **The unit tests cannot establish what PostHog accepts; AC4 is the real proof**, and it is the check that was skipped when pes-s1 shipped an array.

No review subagents were used (a one-expression change; the red-then-green sequence and the canary and separator tests are the check).