# Definition of Ready Checklist

## Definition of Ready: Add the missing CSRF guard to POST /journeys

**Story reference:** artefacts/2026-10-08-journeys-csrf-guard-gap/stories/jcg-s1-add-csrf-guard-to-post-journeys.md
**Test plan reference:** artefacts/2026-10-08-journeys-csrf-guard-gap/test-plans/jcg-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_019v6gX4zKJBHbQHj75whQQU)
**Date:** 2026-10-08

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "operator of this platform's production deployment" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 3 ACs |
| H3 | Every AC has ≥1 test | ✅ | Per test plan's AC Coverage table |
| H4 | Out-of-scope section populated | ✅ | 3 items |
| H5 | Benefit linkage references a named metric | ✅ N/A | Short-track security fix — direct benefit (closes a real CSRF gap) stated in place of a tracked metric, matching `tpux-s1`/`tpux-s2`'s own precedent this session |
| H6 | Complexity rated | ✅ | 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | Short-track skips `/review` |
| H8 | Test plan has no uncovered ACs | ✅ | AC Coverage table complete, no gaps |
| H8-ext | Cross-story schema dependency check | ✅ N/A | No new schema dependency — this story only adds a guard call inside an existing handler against an already-migrated table |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ N/A | Short-track skips `/review`; Architecture Constraints populated directly in the story with the exact root cause and fix shape |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC is CSS-layout-dependent; no UI change at all |
| H-NFR | NFR profile exists | ✅ | Story's own NFR section populated inline |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ N/A | No NFR profile required beyond story's own inline NFRs |
| H-NFR-profile | NFR profile presence | ✅ | Story's NFR section fully populated inline |
| H-GOV | Discovery `## Approved By` non-blank | ✅ N/A | Short-track skips discovery |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No new adapter introduced — `csrfGuard` is an existing, already-wired, already-tested middleware function; this story only adds a call site |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent — no UI change |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ N/A | Short-track skips `/review` | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No separate domain-expert role exists in this solo-operator delivery context | RISK-ACCEPT — same standing acknowledgement as every short-track story this session |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | No gap table entries | — |

---

## Standards injection

**Domain tags:** `[web-ui]`, `[security]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- CSRF-guard call convention (`var csrfOk = await _csrf.csrfGuard(req, res); if (!csrfOk) return;`) confirmed identical across every existing mutating handler in `products.js` — this story wires the exact same call into `journeys.js`, introducing no new pattern.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Add the missing CSRF guard to POST /journeys -- artefacts/2026-10-08-journeys-csrf-guard-gap/stories/jcg-s1-add-csrf-guard-to-post-journeys.md
Test plan: artefacts/2026-10-08-journeys-csrf-guard-gap/test-plans/jcg-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js, CommonJS -- no new npm dependencies.
- Modify ONLY: src/web-ui/routes/journeys.js (add
  `var _csrf = require('../middleware/csrf');` and call
  `var csrfOk = await _csrf.csrfGuard(req, res); if (!csrfOk) return;`
  as the FIRST statement of handlePostJourneys, before any other body
  read) and tests/check-ep1-s1-journey-create.js (update the AC1/AC2/AC3
  test fixtures to set a matching req.session.csrfToken / req.body._csrf
  pair; add one new test for the no/mismatched-token 403 case). Do NOT
  touch handleGetJourneyCanvas (read-only, no CSRF needed) or server.js
  (no dispatch change needed -- the guard lives inside the handler,
  matching every other csrfGuard call site in this codebase).
- csrfGuard already reads and sets req.body itself -- do not call
  _readBody or otherwise re-read the body afterward.
- The mock `res` object in tests/check-ep1-s1-journey-create.js must gain
  writeHead/end methods (in addition to its existing status/json) so the
  403 path (which uses res.writeHead, not res.status) can be asserted --
  mirror tests/check-rcfc-s1-journey-forms-csrf.js's own mock-res shape
  for this if useful, but do not change the existing status/json mock
  behaviour the other tests rely on.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** Yes (short-track story, security fix)
**Signed off by:** Hamish King — Platform Owner — 2026-10-08 (per operator's own standing "whichever is logical next" instruction, applied here as the most urgent/logical item: a CSRF gap in already-merged, live production code, surfaced while grounding ep1-s2)
