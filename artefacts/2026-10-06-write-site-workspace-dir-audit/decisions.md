# Decisions: write-site workspace-dir audit

## Short-track exemption (2026-10-06)

**Context:** This story is the `/improve` audit explicitly named as a follow-up in `dswf-s1`'s own Out of Scope and DoD Observations (`artefacts/2026-10-06-dismiss-store-workspace-dir-fix/`), itself the direct prior occurrence of this root cause.
**Decision:** Handled as a short-track story (`/test-plan → /definition-of-ready → coding agent`), per `CLAUDE.md`'s short-track path — two one-line-pattern fixes (route an existing write through a new 2-line shared helper), not a new feature requiring discovery/benefit-metric/definition/review.
**Rationale:** Matches this session's own established precedent for exactly this class of situation (`tvpf-s1`, `dswf-s1`), both already short-tracked on the same reasoning.
**Made by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A), 2026-10-06, continuing the operator's standing "fix now as a short-track story" instruction for this exact bug class.

## Architectural choice: extract a shared `writeFileEnsuringDir` helper rather than inlining `mkdirSync` a 4th/5th time (2026-10-06)

**Context:** Two more write call sites need the same `mkdirSync`-before-`writeFileSync` guard already applied 3 times in this codebase (`server.js:2750`, `reference-validator.js:54`, `dismissed-signals-store.js:88`).
**Decision:** Extract `src/web-ui/utils/fs-safe-write.js`'s `writeFileEnsuringDir(filePath, content, encoding)` and route both new fixes through it, rather than inlining the same two lines a 4th and 5th time. The 3 existing call sites are left unchanged.
**Rationale:** At the 4th/5th occurrence of an identical two-line pattern, extraction is justified, not premature. It also solves a real testability problem: `features.js`'s `IDEAS_PATH` is a hardcoded `const` derived from `__dirname`, so its write cannot be safely redirected to a temp path in a test without touching this checkout's real `workspace/` directory (which holds real session state) — routing it through a helper that IS independently, directly testable against a real temp path closes that gap honestly rather than skipping the test.
**Made by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A), 2026-10-06.

## RISK-ACCEPT: AC2 (features.js ideas write) verified via shared helper + call-site assertion, not a direct missing-directory test against the real IDEAS_PATH (2026-10-06)

**Context:** `features.js`'s `IDEAS_PATH` is hardcoded from `__dirname`; a test proving the fix works when that exact directory is missing would require deleting or relocating the real `workspace/` directory in this checkout, which holds real session artefacts (`capture-log.md`, `learnings.md`, `state.json`) and must not be touched by a test run.
**Decision:** Accept coverage via (a) a direct test of the shared `writeFileEnsuringDir` helper against a real missing temp directory (the identical code path `_writeIdeasFile` now calls), and (b) a source-level assertion that `_writeIdeasFile` actually calls that helper rather than raw `fs.writeFileSync`. Logged in the test plan's own Coverage gaps section, not silently skipped.
**Rationale:** This finding (`features.js`) is currently dormant in production behind `DATABASE_URL` being set — lower real-world urgency than `strategy-metrics.js`'s own currently-live silent failure — so a slightly indirect but honest test chain is an acceptable tradeoff against the cost/risk of touching this repo's real `workspace/` directory in a test.
**Made by:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A), 2026-10-06.
