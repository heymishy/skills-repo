# Decision Log: 2026-07-16-ci-flake-grep-fix

**Feature:** Fix the over-broad Stripe-key grep scope causing 3 NFR checks to false-positive in real CI
**Last updated:** 2026-07-16

## Decision categories

| Code | Meaning |
|------|---------|
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |
| `GAP` | A skill/process gap surfaced during execution, not specific to this story's content |
| `ARCH` | Architecture or significant technical design decision |

## Log entries

---
**2026-07-16 | ARCH | discovery (root cause investigation)**
**Decision:** Confirmed the root cause of 3 of the 5 files `tst-s1` found passing-locally-but-failing-in-CI: `git grep -n "<pattern>" -- .` searches the entire repo including documentation that legitimately mentions the pattern string. On Windows locally, Node's `execSync` defaults to `cmd.exe`, which cannot parse the POSIX `2>/dev/null` redirect in the command string — the whole command errors, is silently swallowed by a try/catch, and the check trivially passes without ever actually running the grep. On real CI (Ubuntu, a POSIX shell), the command runs correctly and finds real (but harmless, documentation-only) matches, correctly failing the check for the wrong reason — a genuine bug in the check's own scope, unrelated to any actual security risk.
**Alternatives considered:** (1) Fix `execSync`'s shell behavior to work correctly on Windows too (e.g. pass an explicit `shell:` option) — rejected as out of this story's bounded scope; it would fix local dev ergonomics but isn't required to close the CI-accuracy gap, which is the actual reported problem. (2) Weaken or remove the grep check entirely — rejected, it verifies a real, meaningful security property (no live-mode key committed) once correctly scoped.
**Rationale:** Confirmed directly by re-running the exact grep command under a real POSIX shell (`C:\Program Files\Git\usr\bin\bash.exe`, matching how Ubuntu's default `/bin/sh` would execute the identical syntax) and observing 11 real (all false-positive/documentation) matches for `sk_live_` alone.
**Made by:** Claude (agent), 2026-07-16
**Revisit trigger:** None — this is the confirmed, final root cause for AC1-AC3's scope.
---
**2026-07-16 | GAP | discovery (2 files left unresolved)**
**Decision:** `tests/run-gpa-tests.js` and `tests/check-gpa-sc06-source-path-guard.js` remain unresolved — no execSync/grep-scope defect found on direct inspection; `check-gpa-sc06`'s own guard logic uses `path.resolve`/`path.sep`, which is portable and passes cleanly locally. Leading unconfirmed hypothesis: CI pins Node 20 exactly (`pr-checks.yml`'s `node-version: '20'`); this local dev machine runs Node 22.17.0. Attempting to install/switch to Node 20 via `nvm` to confirm was blocked — both `nvm list` (Git Bash) and `nvm list` (PowerShell) hung with no output, likely an unresponsive elevation prompt, and were abandoned rather than continuing to block this story.
**Alternatives considered:** Continue troubleshooting `nvm` to get a Node 20 environment (rejected for this story — would expand scope and risk beyond the story's Complexity 1/bounded intent; a genuinely blocked local-environment issue is better logged and revisited than forced).
**Rationale:** These 2 files' true root cause is genuinely unconfirmed, not merely undiagnosed through lack of effort — direct inspection ruled out the most likely candidate class (execSync/shell-syntax) already fixed for the other 3.
**Made by:** Claude (agent), 2026-07-16
**Revisit trigger:** When a Node-20-pinned local environment (or a container matching the CI image) is available, re-run these 2 files under it and compare against the current CI failure to confirm or rule out the Node-version hypothesis.
---
**2026-07-16 | GAP | definition-of-ready (H-GOV)**
**Decision:** H-GOV satisfied via the operator's direct in-session instruction to do this follow-up — same precedent as pcr-s1/tst-s1/jlc-s1.
**Made by:** Claude (agent), definition-of-ready, 2026-07-16
**Revisit trigger:** Same as the other three's — resolve once, applies to all four.
---

## Architecture Decision Records

<!-- None for this story. -->
