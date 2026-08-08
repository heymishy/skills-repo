## Review: lccf-s1 — Make the landing page's learnings counter fail open instead of crashing the server

**Story:** artefacts/2026-08-08-learnings-count-crash-fix/stories/lccf-s1-fail-open-learnings-count.md
**Reviewer:** Claude (agent), operator-directed — active production incident
**Date:** 2026-08-08

---

### Category A: Traceability

PASS. Benefit linkage names the exact live symptom (wuce-staging crash-looping, 502 on every request since PR #686 merged), the exact defect commit (`lphf-s4`), and the exact confirmed root cause: `learnings-count.js`'s unguarded `fs.readFileSync` at module-load time, combined with the Dockerfile never copying `workspace/` into any deployed image. Confirmed via both direct source/Dockerfile inspection and live `flyctl logs` output — not speculation.

### Category B: Scope discipline

PASS. Out of scope explicitly excludes "fix the Dockerfile to include `workspace/`" with a stated reason (repo-management content has no business in the production image) and excludes any longer-term resourcing change (build-time bake, API-backed count) as a reasonable-but-not-required follow-on. The fix is confined to one function.

### Category C: AC quality

PASS. 4 ACs, each Given/When/Then, each independently testable: AC1 covers the function-level failure mode directly, AC2 covers the actual observed symptom (module-load-time require must not throw), AC3 is an explicit happy-path regression guard, AC4 protects the already-shipped `lphf-s4` test suite.

### Category D: Completeness

PASS. NFRs stated, including an explicit Availability NFR naming this as the availability fix itself. Complexity rated 1. Dependencies section correctly notes this unblocks `lphf-s5`/PR #687, whose staging E2E check cannot complete while staging cannot start.

### Category E: Architecture compliance

PASS. No shared surface module (`html-shell.js`, design tokens, nav) is touched. This is a defensive fix inside a single already-existing function, consistent with the codebase's existing tolerance pattern for optional/best-effort reads. No guardrail in `.github/architecture-guardrails.md` is implicated.

---

### Verdict

**PASS — 0 HIGH findings.** This is a severity-justified short-track fix for an active, deterministic (not flaky) production/staging outage. Root cause is independently confirmed via source inspection, Dockerfile inspection, and live log output. Cleared to proceed to `/test-plan`.
