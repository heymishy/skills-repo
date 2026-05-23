# Definition of Ready: Chain-hash trace emission on gate-confirm

**Story reference:** artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.5.md
**Test plan reference:** artefacts/2026-05-19-cli-deterministic-governance/test-plans/cdg.5-test-plan.md
**Verification script:** artefacts/2026-05-19-cli-deterministic-governance/verification-scripts/cdg.5-verification.md
**Review artefact:** artefacts/2026-05-19-cli-deterministic-governance/review/cdg.5-review-1.md
**Decisions artefact:** artefacts/2026-05-19-cli-deterministic-governance/decisions.md
**Assessed by:** GitHub Copilot (Claude Sonnet 4.6)
**Date:** 2026-05-24

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ PASS | "As a **platform operator**, I want to have every successful web UI gate-confirm write an append-only trace entry... So that M2 (gate bypass rate) is measurable by construction and compliance stakeholders can inspect an unforgeable audit trail..." |
| H2 | At least 3 ACs in Given / When / Then format | ✅ PASS | 8 ACs, all in Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ PASS | AC1→T1, AC2→T2, AC3→T3, AC4→T4, AC5→T5, AC6→T6, AC7→NFR-ISO-1, AC8→npm test chain |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ PASS | 3 explicit out-of-scope items: emit-trace CLI subcommand, trace verification CLI, non-DoR gate trace entries |
| H5 | Benefit linkage field references a named metric | ✅ PASS | "M2 (Gate bypass rate) and T3M1 (Tier 3, Meta-metric 1 — independent non-engineer audit)" |
| H6 | Complexity is rated | ✅ PASS | Rating: 2 (chain hash algorithm + governance-package.writeTrace extension needed) |
| H7 | No unresolved HIGH findings from the review report | ✅ PASS | 0 HIGH findings in cdg.5-review-1.md (MEDIUM finding resolved inline — NFR section added; RISK-ACCEPT-004 logged) |
| H8 | Test plan has no uncovered ACs | ✅ PASS | All 8 ACs covered; 10 tests total (6 unit + 1 integration + NFR-INT-1 + NFR-ISO-1 + governance check) |
| H8-ext | Cross-story schema dependency check | ✅ PASS | Upstream: cdg.4 must be DoD-complete before cdg.5 coding starts. `governance-package.writeTrace()` exists on master. cdg.4's setValidate pattern must be in place before setWriteTrace is added. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ PASS | 7 architecture constraints: ADR-023 (trace write AFTER state write), append-only (fs.appendFileSync), chain hash (SHA-256 via Node crypto), D37 (setWriteTrace injectable), no gitignore of trace in story branches (.gitignore add), governance-package.writeTrace canonical, ADR-013 compatibility (Phase 4 predecessor) |
| H-E2E | No CSS-layout-dependent ACs without E2E tooling or RISK-ACCEPT | ✅ PASS | No CSS-layout-dependent ACs (`hasLayoutDependentGaps: false`). No frontend changes. |
| H-NFR | NFR profile exists | ✅ PASS | artefacts/2026-05-19-cli-deterministic-governance/nfr-profile.md |
| H-NFR2 | Compliance NFRs with named regulatory clauses have human sign-off | ✅ PASS | No regulated clauses; `regulated: false` in context.yml |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ PASS | "[x] Internal — pipeline artefacts contain delivery planning data" |
| H-NFR-profile | NFR profile present and story has NFRs declared | ✅ PASS | NFR profile active; story declares Integrity NFR (append-only, chain-hash), Test isolation NFR, No-external-crypto-dependency NFR |
| H-GOV | Discovery `## Approved By` section has ≥1 non-blank entry | ✅ PASS | "Hamis — 2026-05-19" in discovery.md |
| H-ADAPTER | Injectable adapter wiring check (D37) | ✅ PASS (with mandatory constraints) | cdg.5 introduces `setWriteTrace(fn)` in `journey.js`. D37 requires: (1) default stub MUST throw "Adapter not wired: writeTrace. Call setWriteTrace() before use." — not return silently; (2) DoR includes AC5 as the explicit wiring AC: "server.js wires production trace writer via setWriteTrace(require('../enforcement/governance-package').writeTrace)"; (3) implementation plan MUST name server.js wiring as a SEPARATE task from the handler task. |

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
Story: Chain-hash trace emission on gate-confirm
Story artefact: artefacts/2026-05-19-cli-deterministic-governance/stories/cdg.5.md
Test plan: artefacts/2026-05-19-cli-deterministic-governance/test-plans/cdg.5-test-plan.md
Verification script: artefacts/2026-05-19-cli-deterministic-governance/verification-scripts/cdg.5-verification.md
DoR contract: artefacts/2026-05-19-cli-deterministic-governance/dor/cdg.5-dor-contract.md

PREREQUISITE: cdg.4 must be DoD-complete (merged to master) before this story
starts. If cdg.4 has not merged, do not begin implementation — add a PR comment
naming the blocker.

Goal:
Make every test in tests/check-cdg5-trace-emission.js pass. The test plan has 10
tests. The test file is currently failing because setWriteTrace does not exist in
journey.js and governance-package.writeTrace does not include chain hashing. Write
the minimum implementation to make all 10 tests pass — no additional scope.

CRITICAL — TWO SEPARATE TASKS REQUIRED (D37 rule):
Task 1 — Handler integration: Extend handlePostGateConfirm in journey.js to call
  _writeTrace(traceEntry) AFTER a successful _pipelineStateWriter() call. Add
  setWriteTrace(fn) export + default throwing stub. The trace entry object must
  include: timestamp, featureSlug, storyId, stage, operatorEmail (git config
  user.email), exitCode: 0, and chainHash.
Task 2 — Production wiring: Wire real writeTrace in server.js via
  setWriteTrace(require('../enforcement/governance-package').writeTrace).
  This task is MANDATORY and must not be omitted.

Chain hash implementation (in governance-package.writeTrace or a helper):
  1. Read the last line of workspace/traces/<featureSlug>.trace.jsonl if it exists
     (empty string if file does not exist or is empty).
  2. Parse the last line as JSON; extract its chainHash field (or empty string for
     first entry).
  3. Compute: SHA-256(JSON.stringify(entryWithoutChainHash) + prevChainHash)
     using Node.js built-in require('crypto').createHash('sha256').
  4. Set entryWithChainHash.chainHash = computedHash.
  5. Append entryWithChainHash + '\n' via fs.appendFileSync.

Files to modify:
- src/web-ui/routes/journey.js — add setWriteTrace(fn) + default throwing stub;
  in handlePostGateConfirm after successful _pipelineStateWriter() call: build
  traceEntry object, call _writeTrace(traceEntry).
- src/web-ui/server.js — wire production writeTrace:
  const { setWriteTrace } = require('./routes/journey');
  setWriteTrace(require('../enforcement/governance-package').writeTrace);
- src/enforcement/governance-package.js — extend writeTrace to include chain hash
  computation (SHA-256 via Node.js crypto). If writeTrace does not yet implement
  chain hashing, add it here.
- .gitignore — add workspace/traces/ if not already present.

Files to create:
- tests/check-cdg5-trace-emission.js — 10 tests. Write in TDD red state first.

Files to modify (test chain):
- package.json — append && node tests/check-cdg5-trace-emission.js.

Constraints:
- Trace write uses fs.appendFileSync (append-only — never fs.writeFileSync on the
  trace file). One newline-delimited JSON object per call.
- Trace file path: workspace/traces/<featureSlug>.trace.jsonl. The directory
  workspace/traces/ is created if it does not exist (mkdir -p equivalent).
- Chain hash uses require('crypto') only — no external library.
- operatorEmail: obtain from child_process.execSync('git config user.email').
  If the command fails (non-git environment), use an empty string — never throw.
- Trace write occurs AFTER successful state write (ADR-023). If state write fails
  (pipelineStateWriter throws), no trace entry is written.
- Test isolation: tests inject setWriteTrace stub. No real trace files should be
  written during unit tests. Integration tests that write real trace files must
  clean them up in teardown.
- Read .github/architecture-guardrails.md before implementing.
- Open a draft PR when all 10 tests pass — do not mark ready for review.
- ADR-013 note: This writeTrace is the Phase 2 predecessor of Phase 4
  writeVerifiedTrace. Do not close off the extension path — keep writeTrace
  signature extensible (e.g. accept an options/context parameter even if unused).

Oversight level: Medium — platform maintainer reviews PR before merge
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech lead awareness before assigning to coding agent
**Signed off by:** Hamis — 2026-05-24
