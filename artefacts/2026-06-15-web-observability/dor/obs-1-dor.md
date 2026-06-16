# Definition of Ready: Add pino structured logging with turn correlation IDs and timing to the web server

**Story reference:** artefacts/2026-06-15-web-observability/stories/obs-1.md
**Test plan reference:** artefacts/2026-06-15-web-observability/test-plans/obs-1-test-plan.md
**Assessed by:** Claude Sonnet 4.6 (copilot)
**Date:** 2026-06-16

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "engineer maintaining the web server" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs, all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1→T1/T2/T9/T12; AC2→T3/T4/T13; AC3a→T9; AC3b→T10; AC3c→T11; AC4→T7/T8/NFR-SEC-1; AC5→T5/T6; AC6→manual scenario |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 5 explicit OOS items declared |
| H5 | Benefit linkage field references a named metric | ✅ | M1, M2, M3 all named with mechanistic linkage |
| H6 | Complexity is rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review run 1: 0 HIGH, 0 MEDIUM, 1 LOW (non-blocking) |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | All 6 ACs covered; AC6 regression gap and NFR-PERF-1 gap both explicitly acknowledged with mitigation |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None (upstream: None) — schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | 4 explicit constraints; review Category E: PASS (5/5) |
| H-E2E | CSS-layout-dependent ACs with no E2E tooling | ✅ | No layout-dependent ACs — not triggered |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-06-15-web-observability/nfr-profile.md exists |
| H-NFR2 | Compliance NFR with regulatory clause has documented human sign-off | ✅ | No compliance frameworks in scope — not triggered |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | Data classification: Internal |
| H-NFR-profile | Story declares NFRs; NFR profile exists at feature level | ✅ | Story has Performance and Security NFRs; nfr-profile.md exists |
| H-GOV | Discovery artefact Approved By section has ≥1 named entry | ✅ | Hamish King — Product Lead — 2026-06-16 (positive M1 signal: non-engineering approver) |
| H-ADAPTER | Injectable adapter wiring check | ✅ | No injectable adapters introduced by this story — check not triggered |

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | 0 MEDIUM findings — not triggered | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | RISK-ACCEPT: pure server-side observability infrastructure with no customer-facing behaviour; risk is low |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | All gaps have explicit handling (manual, acknowledged) | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Add pino structured logging with turn correlation IDs and timing to the web server
Story artefact: artefacts/2026-06-15-web-observability/stories/obs-1.md
Test plan: artefacts/2026-06-15-web-observability/test-plans/obs-1-test-plan.md
DoR contract: artefacts/2026-06-15-web-observability/dor/obs-1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or structure
beyond what the tests and ACs specify.

What to build:
1. Add pino to package.json dependencies (pinned version, e.g. "pino": "9.x.x")
2. Create a logger instance in src/web-ui/routes/skills.js (or a shared logger
   module at src/web-ui/logger.js if preferred). Configure pino with a writable
   stream destination so tests can redirect/capture output — do not hardcode
   process.stdout if it will break test isolation.
3. At request ingress in the POST /skills/:name/sessions/:id/turns SSE handler:
   - Generate a unique correlationId (crypto.randomUUID() — no external lib needed)
   - Emit sse_open log event: { event: "sse_open", correlationId, sessionId, turnId }
4. Wrap the LLM adapter call in a timer:
   - Start timer before adapter invocation
   - On adapter resolve/reject: emit llm_complete event with { event: "llm_complete",
     correlationId, llm_duration_ms: <integer ms from start to resolution> }
5. On normal SSE stream close: emit { event: "sse_close", correlationId, chunk_count }
6. On SSE stream error: emit { event: "sse_error", correlationId, error_message }
7. Ensure no log line contains: raw GitHub OAuth access tokens, SESSION_SECRET value,
   GITHUB_CLIENT_SECRET value. Omit or mask these at the log call site.
8. Replace any console.log/console.error in the SSE turn handler with pino log calls.
9. Write tests at: tests/check-obs1-logging.js following the patterns in other check-*.js
   test files. Tests must fail before implementation and pass after.
10. Run npm test — confirm 0 failures before opening PR.

Constraints:
- Plain Node.js, CommonJS (require) — no TypeScript, no transpilation
- pino to package.json dependencies, not devDependencies
- No log line may contain raw API keys, OAuth tokens, or SESSION_SECRET
- Log output must not break existing test suite — use a configurable pino destination
  (e.g. new require('stream').Writable or pino.destination()) in test context
- Architecture standards: read .github/architecture-guardrails.md before implementing.
  Do not introduce patterns listed as anti-patterns or violate named mandatory constraints.
- Out of scope: routes other than SSE turn handler, log aggregation transport,
  PII redaction, file output, runtime log-level switching
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No — proceed directly to coding agent assignment
**Signed off by:** Not required
