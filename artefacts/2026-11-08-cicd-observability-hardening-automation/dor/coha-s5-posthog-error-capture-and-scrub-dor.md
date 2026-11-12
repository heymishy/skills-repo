# Definition of Ready: Production error capture to PostHog with tenant text scrubbed

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s5-posthog-error-capture-and-scrub.md
**Test plan reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s5-posthog-error-capture-and-scrub-test-plan.md
**Verification script:** artefacts/2026-11-08-cicd-observability-hardening-automation/verification-scripts/coha-s5-posthog-error-capture-and-scrub-verification.md
**Review:** PASS, run 3 (artefacts/2026-11-08-cicd-observability-hardening-automation/review/coha-s5-review-3.md), 0 HIGH, 0 MEDIUM, 1 LOW
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-13

---

## Contract Proposal

See `coha-s5-posthog-error-capture-and-scrub-dor-contract.md` (saved alongside this artefact).

## Contract Review

✅ **Contract review passed.** Each AC maps to named tests at the type the AC needs: AC1 to AC9 are all observable through the real `createApp()` or a direct hook test, none depends on a mock that merely echoes the argument list. The contract's file list matches the test plan's touch points: `auth.js` and `auth-email.js` are in the touch list (the AC4 tests assert both routes), and the only exclusions (`posthog-config.js`, `posthog-server.js` and the two existing capture call sites) have no assertions against them, so the contract does not contradict the test plan (B1/D1). One contract assumption needs implementer care: the real startup block may exit on missing environment variables, so the wiring is exposed as a callable function and AC9 asserts through it.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format, named persona | ✅ | "As a delivery engineer ..." (the persona used across this feature) |
| H2 | At least 3 ACs in Given/When/Then | ✅ | 9 ACs |
| H3 | Every AC has at least one test | ✅ | 26 tests: 12 unit, 11 integration, 3 NFR; every AC mapped in the test plan's coverage table |
| H4 | Out-of-scope populated | ✅ | Eight explicit exclusions |
| H5 | Benefit linkage names a metric | ✅ | Production-defect detection latency (Metric 4), revised 2026-11-13 |
| H6 | Complexity rated | ✅ | Rating 2, scope stability Stable |
| H7 | No unresolved HIGH review findings | ✅ | review-3: 0 HIGH |
| H8 | No uncovered ACs | ✅ | Coverage gaps: None |
| H8-ext | Cross-story schema dependency | ✅ | No upstream story; schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | 11 constraints; Category E raised no HIGH in any run (run 1 wiring finding resolved) |
| H-E2E | No CSS-layout-dependent AC | ✅ N/A | No UI; `hasLayoutDependentGaps: false` |
| H-NFR | NFR profile exists | ✅ | Updated 2026-11-13 with rows for this story (privacy, isolation, performance, cost) |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | `complianceFrameworks: []`, no regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | "Internal", with a note that raw error text may hold tenant data inside the app |
| H-NFR-profile | Profile present when story declares NFRs | ✅ | Present |
| H-GOV | Approved By in discovery | ✅ | "Hamish King — Platform Owner — 2026-11-08". M1: role is not clearly non-engineering, so the signal is "role unverified for independent sign-off quality" (same as the other stories in this feature) |
| H-ADAPTER | Injectable adapter wiring check (D37) | ✅ | `initErrorCapture` / `captureServerError` is an injectable adapter: the stub throws the exact "Adapter not wired" message (unit test 11), AC9 scopes the production wiring in `server.js`, and the contract names the startup wiring as its own task separate from the catch-block call |
| H-INF | `hasInfraTrack` not set | ✅ N/A | |
| H-MIG | `hasMigrationTrack` not set | ✅ N/A | |
| H-DESIGN | `hasDesignSystemTrack` not set | ✅ N/A | No UI |

**Result: 19/19 applicable hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | Performance, security and privacy, isolation, cost, accessibility (N/A) all stated |
| W2 | Scope stability declared | ✅ | — | "Stable" |
| W3 | MEDIUM findings acknowledged | ✅ N/A | — | None open (all run 1 and run 2 MEDIUM findings resolved) |
| W4 | Verification script reviewed by a domain expert | ⚠️ | An unreviewed script may miss edge cases | **Needs the operator's acknowledgement.** The existing 2026-11-09 RISK-ACCEPT covers coha-s1 to coha-s4 only; this story is new. Same root cause (no second contributor). Proposed: extend that entry to coha-s5, coha-s6 and coha-s7. |
| W5 | No UNCERTAIN gap-table items | ✅ | — | The three gap-table entries each have a stated mitigation |

**Outstanding decisions to log:** W4 for coha-s5 (pending the operator's yes; the entry is written when they confirm).

---

## Oversight

Parent epic: **Medium**. The tech lead must be shown this DoR artefact before the story is assigned; the operator is the only contributor and the tech lead in this repo, so this artefact and the operator's sign-off below are that step.

**Sign-off:** pending — name and date to be entered by the operator: ____________________

**Open facts the implementer must not assume away (recorded, not blocking):**
1. The operator states staging and production share one PostHog key; unverified.
2. The post-merge smoke scenario (verification script scenario 10) needs the operator and a staging-only way to cause a failing page; the implementation plan names the method.

---

## Standards injection

Story has no `domain` field — skipped silently.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes (once the operator has signed off above and acknowledged W4)
Story: Production error capture to PostHog with tenant text scrubbed — artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s5-posthog-error-capture-and-scrub.md
Test plan: artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s5-posthog-error-capture-and-scrub-test-plan.md
Contract: artefacts/2026-11-08-cicd-observability-hardening-automation/dor/coha-s5-posthog-error-capture-and-scrub-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- Node.js, this repo's existing conventions; test runner is node scripts/run-all-tests.js; the new check is node tests/check-coha-s5-error-capture.js.
- New module: src/web-ui/modules/error-capture.js. Do not change posthog-config.js, posthog-server.js, or their existing capture call sites.
- Injectable adapter rule (D37): the unwired stub MUST throw "Adapter not wired: error-capture. Call initErrorCapture() with a real implementation before use."; the caller in createApp() must contain that throw; the implementation plan must list the startup wiring as a separate task from the catch-block call.
- Scrubbing is an allow-list, fail-closed: named SDK keys plus environment, route, code only; message becomes error class plus fixed code unless it exactly matches the short allow-list; route is the matched pattern, never the raw URL; distinct_id is the fixed label server-error-capture with person processing off; delete pre_context, context_line and post_context from every frame. A thrown error in before_send drops the event.
- Never send test traffic to the real PostHog project: tests use a local sink and fake keys only. Never print or log a key.
- Do not re-require server.js more than once in one test process; start it in a child process.
- Tests must drive the real createApp() and the real auth routes; a mock that asserts only an argument list is not evidence.
- Architecture standards: read .github/architecture-guardrails.md before implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests (including the startup-block question in the contract's first assumption): add a PR comment describing it and do not mark ready for review.
```
