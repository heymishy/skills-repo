# sff-s1 verify-completion evidence (2026-11-15)

**Story:** Keep a placeholder filename on every scrubbed stack frame so PostHog accepts the error events (artefacts/2026-11-15-coha-scrubber-filename-fix/stories/sff-s1-keep-a-filename-on-every-scrubbed-frame.md)
**Branch:** `feature/sff-s1-keep-a-filename-on-every-scrubbed-frame`, verified at commit `e92dd0c21` (3 commits on top of `444610db0`; files changed: `src/web-ui/modules/error-capture.js` (4 lines), `tests/check-coha-s5-error-capture.js`, new `tests/fixtures/sff-s1-posthog-frames.json`)
**Run on:** Windows 11, Node 22, PowerShell 7.

## Test evidence (fresh, on the final code)

| Command | Result |
|---|---|
| `node tests/check-coha-s5-error-capture.js` | 83 passed, 0 failed (77 existing plus 6 new: UT1, UT2, UT3, UT4, UT6, IT1) |
| `node tests/check-coha-s6-error-bridge.js` | 83 passed, 0 failed, 7 skipped (need a Postgres variable; unchanged) |
| `npm test` (full suite) | 853 files, 6 failed, exactly the 6 acknowledged at branch-setup: coha-s7 incident check (Windows CRLF, fixed by story cwt-s1), pipeline-state integrity (tfhc-s1), p3.5 (PowerShell), pcr-s1 (timing limit), p4-enf-second-line (timing), rtvap-s1 (no WSL bash). No new failures. |
| Red runs | Task 1 commit: 77 passed, 5 failed; Task 2 commit: 77 passed, 6 failed (UT2, UT3, UT6, IT1 and the edited assertion fail on the old scrubber, with `src/` unchanged) |

## Acceptance criteria

| AC | Evidence | Result |
|---|---|---|
| AC1 every frame has a string filename (repo path or `[redacted]`) | UT1, UT2, UT3 | Verified (unit) |
| AC2 no canary text reaches the placeholder; existing canary tests pass; one assertion deliberately changed | UT4, the unchanged canary tests, the two edited lines in `scrubEvent_filename_keptOnlyWhenRepoRelative` | Verified (unit) |
| AC3 real captured shapes: check true after, false before | UT6 with fixture and negative control | Verified (unit) |
| AC4 end to end through the real `createApp()` in a child process | IT1 | Verified (integration-real-code) |
| AC5 staging events accepted by PostHog (issue id, no cymbal error, an Error Tracking issue) | Needs merge, staging deploy and a PostHog query | Not yet verified (live, after merge) |
| AC6 a different rejection recorded as INCOMPLETE | Depends on AC5 outcome | Not yet verified (live, after merge) |

4 of 6 acceptance criteria verified; AC5 and AC6 are live-only by the DoR's own classification.

## Reviews

- Spec compliance: SPEC COMPLIANT (no blocking issues).
- Code quality and privacy: APPROVED. Probes with a getter, a `toString` object, arrays, string and number frames, a frozen frame and a polluted `Object.prototype` all gave a validated repository path or exactly `[redacted]`. A throw in `scrubFrame` is caught in `scrubEvent` and drops the whole event (fails closed).
- LOW notes: test numbering skips UT5; `RE_REPO_PATH` accepts `..` segments (existing, not tenant data; candidate hardening story).

## Other checks

- Route and handler end-to-end coverage: not applicable, no route or middleware file changed.
- Live browser render check: not applicable, no rendered UI.
- Scope: three commits map to the three plan tasks; one deviation from the per-task loop (one implementer for all three tasks, reviews on the whole diff) is logged in `decisions.md` (2026-11-15).

## Residual risks

1. AC5 and AC6: PostHog may reject events for a second reason once `filename` is present; only the live check after merge and staging deploy shows this.
2. The fixture is built from a truncated capture (four frames seen).
3. The alert and bridge hop cannot be proven on staging (destination is production-only); coha-s6 AC9 proves it.