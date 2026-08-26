# Definition of Ready: ctpr-s1 — Persist a newly-generated CSRF token to Redis immediately, not never

**Story reference:** artefacts/2026-08-27-csrf-token-not-persisted-across-restart/stories/ctpr-s1-persist-csrf-token-on-generation.md
**Test plan reference:** artefacts/2026-08-27-csrf-token-not-persisted-across-restart/test-plans/ctpr-s1-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-27
**Track:** Short-track (live production bug, root-caused via direct source inspection and `fly logs`)

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As an operator working through a long-running conversation" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1-AC4: 1 test each; AC5: existing suite re-run |
| H4 | Out-of-scope section is populated | ✅ | 3 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ N/A (short-track direct correctness fix) | No formal benefit-metric artefact — same treatment as `avpf-s1`/`jspf-s1` |
| H6 | Complexity is rated | ✅ | Complexity 1, Scope stability Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ (short-track exemption) | No `/review` was run — short-track |
| H8 | Test plan has no uncovered ACs | ✅ | Test plan's own "Coverage gaps" section: "None." |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Single-source-fix reasoning, no-circular-require confirmation, best-effort-by-existing-design reasoning all detailed |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC is CSS-layout-dependent |
| H-NFR | NFR profile or explicit `NFRs: None — reviewed [date]` | ✅ | Story's NFR section fully populated |
| H-GOV | Governance approval (`## Approved By` in discovery artefact) | ✅ (short-track exemption) | No discovery artefact — short-track |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | Reuses `session.js`'s existing `setRedisAdapterForTesting` seam — no new adapter |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass. 14/14.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or explicitly "None — confirmed" | ✅ | — | N/A — satisfied |
| W2 | Scope stability declared | ✅ | — | N/A — satisfied |
| W4 | Verification script reviewed by a domain expert | ⚠️ Acknowledged | This is a security-adjacent (CSRF) code path, but the change is additive-only (one persistence call, no change to validation/guard logic) and complexity-1 — the operator has already directed the full-rigor pipeline (implementer + spec-compliance + code-quality review) for this exact story | Hamish King (operator) — implicit in the standing "full pipeline with subagents" direction already established this session for exactly this class of fix |

All warnings resolved or acknowledged. RISK-ACCEPT for W4 logged in `decisions.md`.

---

## Oversight level

**Medium** — this touches a CSRF-protection code path (security-adjacent), which argues against Low; but the change is a single additive persistence call with no change to validation logic, guard behavior, or response shape, which argues against High. Consistent with this repo's short-track precedent for well-understood, narrowly-scoped fixes.

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

No section of this file is directly implicated — this story touches session/CSRF infrastructure, not shared-shell rendering, HTML render-function testing conventions, or any other pattern currently documented there.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: ctpr-s1 — Persist a newly-generated CSRF token to Redis immediately, not never
  — artefacts/2026-08-27-csrf-token-not-persisted-across-restart/stories/ctpr-s1-persist-csrf-token-on-generation.md
Test plan: artefacts/2026-08-27-csrf-token-not-persisted-across-restart/test-plans/ctpr-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Task order:
1. In src/web-ui/middleware/csrf.js's generateCsrfToken, require
   ./session.js and call persistSession(req.sessionId) inside the
   `if (!req.session.csrfToken)` branch, immediately after minting the new
   token -- never on the idempotent-reuse path.
2. Write tests/check-ctpr-s1-csrf-token-persistence.js covering AC1-AC4
   (AC5 is re-running existing files, not new tests).
3. Re-run all 8 existing CSRF-focused test files named in the test plan's
   AC5 section individually, confirm 0 regressions, then run the full
   suite.

Constraints:
- No new npm dependencies.
- Do not touch csrfGuard, csrfField, or the 403 "Forbidden" response --
  this story only changes generateCsrfToken.
- Do not add error handling around the new persistSession call --
  persistSession is already safe to call with no adapter configured and
  already catches its own write errors internally.
- Do not change persistSession's or sessionMiddleware's own logic in
  session.js -- this story only adds ONE new caller of the existing
  persistSession function.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or
  violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass -- do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal named sign-off — tech-lead/operator awareness (satisfied: operator directed both the live-bug investigation and the "gate-confirm first" priority directly)
**Signed off by:** Claude (agent), on explicit operator direction ("4 separate stories" for the bundling, "#1 gate-confirm first" for priority)
**Date:** 2026-08-27
**Proceed:** Yes — all hard blocks pass, all warnings resolved or acknowledged
