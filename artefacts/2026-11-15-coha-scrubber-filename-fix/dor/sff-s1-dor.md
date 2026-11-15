## Definition of Ready: Keep a placeholder filename on every scrubbed stack frame so PostHog accepts the error events

**Story reference:** artefacts/2026-11-15-coha-scrubber-filename-fix/stories/sff-s1-keep-a-filename-on-every-scrubbed-frame.md
**Test plan reference:** artefacts/2026-11-15-coha-scrubber-filename-fix/test-plans/sff-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-15
**Track:** short

---

## Contract Proposal

See `artefacts/2026-11-15-coha-scrubber-filename-fix/dor/sff-s1-dor-contract.md`.

## Contract Review

✅ **Contract review passed.** The proposed build (a few lines in `scrubFrame`, tests in the existing file, one fixture) matches all 6 ACs, and each AC maps to a named test or a named live scenario. The contract's exclusion list (no other scrubber rule, no coha-s6 or coha-s7 change, no deploy) has zero test assertions against it, so no "MUST NOT touch" entry conflicts with a required touchpoint. The one existing assertion that changes (`scrubEvent_filename_keptOnlyWhenRepoRelative`) is named in the contract and the story's AC2, so it is not a surprise.

---

## Short-track entry-condition note

Short-track (CLAUDE.md: `/test-plan -> /definition-of-ready -> coding agent`). The review-report and discovery entry conditions, and the hard blocks that depend on them (H7, H-GOV), are treated as vacuously satisfied under the same precedent as `dsrf-s1`, `smt-s1` and `lasr-s1`.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with a named persona | ✅ | "the operator relying on production error monitoring" |
| H2 | At least 3 ACs in Given / When / Then | ✅ | 6 ACs |
| H3 | Every AC has at least one test | ✅ | AC1 to UT1-3, AC2 to UT4-5, AC3 to UT6, AC4 to IT1, AC5 and AC6 to live scenarios 5 and 6 |
| H4 | Out-of-scope populated | ✅ | 6 explicit exclusions |
| H5 | Benefit linkage names a metric | ✅ | Metric 4 (Production-defect detection latency) of the coha benefit-metric |
| H6 | Complexity rated | ✅ | Rating 2, scope stability Stable |
| H7 | No unresolved HIGH review findings | ✅ (vacuous - short-track) | No review ran |
| H8 | No uncovered ACs | ✅ | AC5 and AC6 are live-only, acknowledged in the plan's gap table as required steps, not accepted risks |
| H8-ext | Cross-story schema dependency | ✅ | `schemaDepends: []` |
| H9 | Architecture Constraints populated | ✅ | 6 constraints; no Category E finding |
| H-E2E | CSS-layout AC without E2E tooling | ✅ (N/A) | No UI |
| H-NFR | NFR profile or story NFRs | ✅ (short-track) | NFRs inline in the story |
| H-NFR2 | Compliance clause sign-off | ✅ (N/A) | None |
| H-NFR3 | Data classification | ✅ (N/A) | Security NFR states output is allow-list plus one fixed constant; no tenant data |
| H-GOV | `## Approved By` in discovery | ✅ (vacuous - short-track) | No discovery.md |
| H-ADAPTER | Injectable adapter (D37) | ✅ (N/A) | No `setX()` adapter introduced or changed |
| H-INF / H-MIG / H-DESIGN | Track gates | ✅ (skipped) | Flags not set; no UI, no schema |

**Hard blocks: 19/19 passed** (2 vacuously under the short-track convention).

CLAUDE.md DoR checks: no "MUST NOT touch" entry conflicts with a test touchpoint (B1/D1: the touched files `error-capture.js`, its test file and the fixture are not in the exclusion list). `req.session.token` grep is not relevant (no session code).

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | - | - |
| W2 | Scope stability declared | ✅ | - | - |
| W3 | MEDIUM review findings acknowledged | ✅ (N/A) | - | - |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No human has walked the script. Low risk for scenarios 1 to 4 (test-file lines); scenarios 5 and 6 are the live checks the operator or agent runs after merge. | **Pending - operator to confirm** |
| W5 | No UNCERTAIN items in the gap table | ⚠️ | Three accepted unknowns in the plan: the truncated fixture capture, a possible second PostHog rejection reason, the consumer's full schema. All three are caught by AC5 and AC6 rather than by tests, so the story cannot honestly close on automated tests alone. | **Pending - operator to confirm** |

---

## Standards injection

Domain tags: `[web-ui, observability, privacy]`

- `web-ui` matched: `.github/standards/web-ui/web-ui-patterns.md` applies to server code in `src/web-ui/`; the coding agent must read it. The change adds no route, handler or adapter, so most of it is not engaged.
- ⚠️ Tag `observability` is not in `.github/standards/index.yml`; no standards injected for it.
- ⚠️ Tag `privacy` is not in `.github/standards/index.yml`; no standards injected for it. The binding constraint is the story's own fail-closed rule: output is built only from allow-listed fields and fixed constants, with the canary tests as proof.

---

## Oversight level

**Low.** A few lines in a scrubber with tests, no new route, adapter or schema. It touches the privacy-sensitive scrubber, so the existing canary tests are the guard, and the live check AC5 is mandatory before the story is called complete. No named sign-off required.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Keep a placeholder filename on every scrubbed stack frame so PostHog accepts the error events - artefacts/2026-11-15-coha-scrubber-filename-fix/stories/sff-s1-keep-a-filename-on-every-scrubbed-frame.md
Test plan: artefacts/2026-11-15-coha-scrubber-filename-fix/test-plans/sff-s1-test-plan.md
Contract: artefacts/2026-11-15-coha-scrubber-filename-fix/dor/sff-s1-dor-contract.md

Goal:
Make the sff-s1 tests pass. Write the new tests and the fixture first and confirm they FAIL against the current scrubber (UT2, UT3, UT6 and IT1 must be red; the edited filename-assertion test must be red). Then change scrubFrame so every scrubbed frame has a string filename ('[redacted]' when the real path must not be sent). Do not add scope beyond the 6 ACs.

Constraints:
- The placeholder is the single constant '[redacted]'. Never copy any input text into it. Keep the existing filename and abs_path logic for repository-relative paths.
- Frames that are not objects must come out as { filename: '[redacted]' }.
- Do not change which events are captured, the allow-list keys, route labelling, the 200ms bound or the flush handler.
- The ONLY existing assertion you may change is in scrubEvent_filename_keptOnlyWhenRepoRelative (the two undefined expectations become '[redacted]'). Every other existing test in tests/check-coha-s5-error-capture.js must pass unchanged. Do not weaken any canary test.
- Build the fixture tests/fixtures/sff-s1-posthog-frames.json from the real shapes in the story/test plan (repo frames with filename and in_app true; the Node internal frame process.processTicksAndRejections with NO filename, in_app false, lineno 95, platform node:javascript). Put the capture date and the "capture was truncated" note in a header (a _comment key).
- The schema check everyFrameHasFilename asserts ONLY a string filename on every frame of every $exception_list entry. Do not guess other consumer rules.
- UT6 must include a negative control that reproduces the OLD frame logic inside the test and proves the check returns false for it.
- Read .github/standards/web-ui/web-ui-patterns.md and .github/architecture-guardrails.md before implementing. Do not introduce anti-patterns or violate Active ADRs.
- Node.js built-ins only, no new npm dependencies. Plain ASCII in all files (verify non-ASCII count is 0 after every edit; the Write/Edit tools have turned escapes into literal characters before, see learnings D60).
- Run the changed test file in the main checkout path too, and run `node tests/check-coha-s5-error-capture.js` for the final count; note line endings may be CRLF on Windows (learnings D61): normalise if reading checked-in text with line-anchored regexes.
- Use explicit file paths in git add. Do NOT edit .github/pipeline-state.json or workspace/state.json from the worktree; state is advanced on master by the orchestrator.
- Open a draft PR when tests pass - do not mark ready for review. The operator merges. Do not deploy production.
- If you meet an ambiguity not covered by the ACs or tests: add a PR comment describing it and do not mark ready for review.
- After merge (orchestrator): run verification scenarios 5 and 6 against staging; the story is COMPLETE only if events show an issue id and no cymbal error. Otherwise INCOMPLETE with the exact new message (AC6).

Oversight level: Low - no named sign-off required.
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required (Low oversight)

**Outstanding before coding agent assignment:** W4 and W5 are advisory and do not block the build. The operator can walk `artefacts/2026-11-15-coha-scrubber-filename-fix/verification-scripts/sff-s1-verification.md` at any point before merge.
