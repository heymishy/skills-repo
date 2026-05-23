# Definition of Ready: Web UI gate-confirm CLI validation integration

**Story reference:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.4.md
**Test plan reference:** artefacts/2026-05-19-cli-deterministic-governance/test-plans/cdg.4-test-plan.md
**Verification script:** artefacts/2026-05-19-cli-deterministic-governance/verification-scripts/cdg.4-verification.md
**Review artefact:** artefacts/2026-05-19-cli-deterministic-governance/review/cdg.4-review-1.md
**Decisions artefact:** artefacts/2026-05-19-cli-deterministic-governance/decisions.md
**Assessed by:** GitHub Copilot (Claude Sonnet 4.6)
**Date:** 2026-05-24

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ PASS | "As a **platform operator**, I want to have the web UI gate-confirm handler reject a `definition-of-ready` stage completion with a 422... So that no pipeline-state.json stage advancement can occur through the web UI without a passing deterministic gate check..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ PASS | 8 ACs, all in Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ PASS | AC1→T1, AC2→T2+IT2, AC3→T3+IT1, AC4→T4, AC5→T5, AC6→T6, AC7→T7, AC8→npm test chain |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ PASS | 4 explicit out-of-scope items: trace emission, non-DoR gate validation, frontend error display, skills advance CLI |
| H5 | Benefit linkage field references a named metric | ✅ PASS | "M2 — Gate bypass rate" |
| H6 | Complexity is rated | ✅ PASS | Rating: 2 (pattern established in journey.js; path traversal guard adds some care) |
| H7 | No unresolved HIGH findings from the review report | ✅ PASS | 0 HIGH findings in cdg.4-review-1.md (MEDIUM finding resolved inline — NFR section added; RISK-ACCEPT-004 logged) |
| H8 | Test plan has no uncovered ACs | ✅ PASS | All 8 ACs covered; 10 tests total (7 unit + 2 integration + 1 NFR-SEC) |
| H8-ext | Cross-story schema dependency check | ✅ PASS | Upstream: cdg.1/cdg.2 DoD-complete; `cli-outer-loop.validate()` exported on master. `setPipelineStateWriter` pattern established in server.js |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ PASS | 6 architecture constraints: ADR-H7.1 (require not spawn), ADR-023 (disk canonicity — write-artefact → validate → write-state), D37 (setValidate injectable), path traversal guard (ougl), input sanitisation, no frontend changes |
| H-E2E | No CSS-layout-dependent ACs without E2E tooling or RISK-ACCEPT | ✅ PASS | No CSS-layout-dependent ACs (`hasLayoutDependentGaps: false`). Story explicitly states "No frontend changes" |
| H-NFR | NFR profile exists | ✅ PASS | artefacts/2026-05-19-cli-deterministic-governance/nfr-profile.md |
| H-NFR2 | Compliance NFRs with named regulatory clauses have human sign-off | ✅ PASS | No regulated clauses; `regulated: false` in context.yml |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ PASS | "[x] Internal — pipeline artefacts contain delivery planning data" |
| H-NFR-profile | NFR profile present and story has NFRs declared | ✅ PASS | NFR profile active; story declares Security NFR (path traversal guard, input sanitisation) and Performance NFR (no SLA — infrequent human action) |
| H-GOV | Discovery `## Approved By` section has ≥1 non-blank entry | ✅ PASS | "Hamis — 2026-05-19" in discovery.md |
| H-ADAPTER | Injectable adapter wiring check (D37) | ✅ PASS (with mandatory constraints) | cdg.4 introduces `setValidate(fn)` in `journey.js`. D37 requires: (1) default stub MUST throw "Adapter not wired: validate. Call setValidate() before use." — not return empty/null; (2) DoR includes AC5 as the explicit wiring AC: "server.js wires production validate via setValidate(require('../enforcement/cli-outer-loop').validate)"; (3) implementation plan MUST name server.js wiring as a SEPARATE task from the handler task. Both tasks are required — not optional. |

**Result: ALL 17 HARD BLOCKS PASSED**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | N/A | N/A |
| W2 | Scope stability is declared | ✅ | N/A | N/A |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ ACKNOWLEDGED | Finding resolved inline — NFR section added before review report written | decisions.md RISK-ACCEPT-004 (2026-05-24) |
| W4 | Verification script reviewed by a domain expert | ⚠️ ACKNOWLEDGED | Misspecified behaviour may not be caught until post-merge | decisions.md RISK-ACCEPT-005 (2026-05-24) — operator acts as sole domain expert on solo project |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | N/A — all gap table entries have explicit mitigations | N/A |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Web UI gate-confirm CLI validation integration
Story artefact: artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.4.md
Test plan: artefacts/2026-05-19-cli-deterministic-governance/test-plans/cdg.4-test-plan.md
Verification script: artefacts/2026-05-19-cli-deterministic-governance/verification-scripts/cdg.4-verification.md
DoR contract: artefacts/2026-05-19-cli-deterministic-governance/dor/cdg.4-dor-contract.md

Goal:
Make every test in tests/check-cdg4-gate-confirm-validation.js pass. The test plan
has 10 tests. The test file is currently failing because the validate injection
does not exist in journey.js. Write the minimum implementation to make all 10 tests
pass — no additional scope.

CRITICAL — TWO SEPARATE TASKS REQUIRED (D37 rule):
Task 1 — Handler integration: Add setValidate(fn) export + default throwing stub +
  path traversal guard + validate-before-pipelineStateWriter call to
  src/web-ui/routes/journey.js.
Task 2 — Production wiring: Wire real validate in server.js via
  setValidate(require('../enforcement/cli-outer-loop').validate). This task is
  MANDATORY and must not be omitted. Stub-only wiring that is never called in
  production is a D37 violation.

Files to modify:
- src/web-ui/routes/journey.js — add: (a) let _validate and setValidate(fn) export
  with default stub that throws "Adapter not wired: validate. Call setValidate()
  before use."; (b) in handlePostGateConfirm, when stage === 'definition-of-ready':
  resolve dorArtefactPath from req.session, assert path starts with repoRoot
  (return 400 if not), call _validate(dorArtefactPath, 'definition-of-ready',
  repoRoot), if exitCode !== 0 return 422 with failing check; only then call
  _pipelineStateWriter(). Order: write-artefact (already done before this point)
  → validate → write-state (ADR-023 disk canonicity).
- src/web-ui/server.js — wire production validate:
  const { setValidate } = require('./routes/journey');
  setValidate(require('../enforcement/cli-outer-loop').validate);

Files to create:
- tests/check-cdg4-gate-confirm-validation.js — 10 tests (T1–T7 unit + IT1–IT2
  integration + NFR-SEC-1). Write in TDD red state first if not yet on disk.

Files to modify (test chain):
- package.json — append && node tests/check-cdg4-gate-confirm-validation.js

Constraints:
- dorArtefactPath is read from req.session (set in an earlier journey step). Never
  read it from req.body or req.params — that would bypass session-scoped validation.
- Path traversal guard (OWASP A01 / ougl): path.resolve(req.session.dorArtefactPath)
  must start with repoRoot + path.sep. Return HTTP 400 if the check fails. Do not
  log the raw path value in the response body.
- repoRoot is determined from the server process working directory or an established
  pattern in server.js — use the same method already in use for other file operations.
- validate is called ONLY for stage === 'definition-of-ready'. All other stages pass
  through to existing handler behaviour unchanged.
- No frontend changes. No HTML, CSS, or client-side JS modifications.
- No subprocess calls (child_process). validate is called via require() (ADR-H7.1).
- Read .github/architecture-guardrails.md before implementing.
- Open a draft PR when all 10 tests pass — do not mark ready for review.

Oversight level: Medium — platform maintainer reviews PR before merge
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech lead awareness before assigning to coding agent
**Signed off by:** Hamis — 2026-05-24
