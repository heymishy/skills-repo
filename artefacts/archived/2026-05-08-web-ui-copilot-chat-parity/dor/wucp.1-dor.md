# Definition of Ready Checklist

## Definition of Ready: Pipeline context auto-loader at session start (wucp.1)

**Story reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/stories/wucp.1.md
**Test plan reference:** artefacts/2026-05-08-web-ui-copilot-chat-parity/test-plans/wucp.1-test-plan.md
**Verification script:** artefacts/2026-05-08-web-ui-copilot-chat-parity/verification-scripts/wucp.1-verification.md
**Assessed by:** GitHub Copilot
**Date:** 2026-05-09

---

## Contract Proposal — Pipeline context auto-loader at session start

**What will be built:**
`buildSystemPrompt()` in `src/web-ui/routes/skills.js` is extended with a 5th optional parameter `sessionContext = { activeFeatureSlug }`. On each session start, the function reads and includes the following files in the assembled system prompt (each labelled with its filename): `pipeline-state.json`, `workspace/state.json`, `context.yml`, `fleet-state.json` (if present), `artefact-coverage-exemptions.json` (if present). `workspace/learnings.md` is read and only the first 50 lines are included. If `sessionContext.activeFeatureSlug` is set, the file listing of `artefacts/[activeFeatureSlug]/` (filenames only) is included. All files that do not exist are silently skipped — no errors thrown.

A merge gate artefact is created at `artefacts/2026-05-08-web-ui-copilot-chat-parity/reference/context-yml-schema-inspection.md` documenting the full context.yml schema with value-type classification and secretRef confirmation. Test T1.16 asserts this file exists and blocks merge until it does.

**What will NOT be built:**
Mid-session file reads on model request (wucp.3). Token budget hard limiting or dynamic truncation. Artefact file contents — filenames only in the listing. Credential rotation or secrets management. Any new route, middleware, or server-side change other than the `buildSystemPrompt()` extension.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|--------------|------|
| AC1: pipeline-state.json, workspace/state.json, context.yml included with labels | T1.1 (pipeline-state), T1.2 (state.json), T1.3 (context.yml), T1.4 (labels present) | Unit |
| AC2: missing files silently skipped | T1.5 (all absent — no throw), T1.6 (one absent — others present), T1.7 (empty dir — no throw) | Unit |
| AC3: artefact listing scoped to activeFeatureSlug | T1.8 (listing present), T1.9 (scoped to activeFeatureSlug), T1.10 (no slug — no listing) | Unit |
| AC4: learnings.md first 50 lines | T1.11 (50-line limit), T1.12 (short file — all lines), T1.13 (absent — skipped) | Unit |
| AC5: context-yml-schema-inspection.md merge gate | T1.16 (file exists — merge gate) | Integration |
| AC6: fleet-state.json and artefact-coverage-exemptions.json conditional | T1.14 (fleet present), T1.15 (absent — skipped) | Unit |
| AC7: live model orientation accuracy | Manual dogfood scenario | Manual |

**Assumptions:**
`buildSystemPrompt()` is the sole entry point for system prompt assembly. `sessionContext` is passed in by the route handler at each session start. The implementation adds ~40–60 lines to an existing function — no architectural change. `context.yml` at repo root uses `secretRef` pattern for all sensitive values (confirmed by AC5 inspection artefact).

**Estimated touch points:**
Files: `src/web-ui/routes/skills.js` (production), `artefacts/2026-05-08-web-ui-copilot-chat-parity/reference/context-yml-schema-inspection.md` (merge gate document).
Services: none. APIs: none.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So format with named persona | ✅ PASS | "As a platform operator using the web UI" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ PASS | 7 ACs, all in Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ PASS | AC1-AC6: T1.1–T1.15 + T1.16–T1.17; AC7: manual scenario |
| H4 | Out-of-scope section populated | ✅ PASS | Mid-session reads, token limiting, write-mode, fleet artefact listing all named |
| H5 | Benefit linkage references a named metric | ✅ PASS | M3 (outer loop completeness) and MM2 (unassisted replication) |
| H6 | Complexity is rated | ✅ PASS | Rating: 1 (well-understood) |
| H7 | No unresolved HIGH findings from review | ✅ PASS | Review PASS — 0 HIGH, 2 MEDIUM |
| H8 | Test plan has no uncovered ACs | ✅ PASS | All ACs covered; 2 untestable-by-nature gaps handled as manual verification scenarios |
| H8-ext | Cross-story schema dependency check | ✅ PASS | Dependencies: None — schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ PASS | ADR-004, ADR-009/no credential leakage, D37 (conditional), zero npm deps, no SKILL.md modification |
| H-E2E | CSS-layout-dependent ACs with no E2E and no RISK-ACCEPT | ✅ PASS | No CSS-layout-dependent ACs — system prompt only, zero UI changes |
| H-NFR | NFR profile exists | ✅ PASS | artefacts/2026-05-08-web-ui-copilot-chat-parity/nfr-profile.md |
| H-NFR2 | Compliance NFRs with regulatory clauses have human sign-off | ✅ PASS | No compliance regulatory clauses |
| H-NFR3 | Data classification field not blank | ✅ PASS | "Public / Internal — no personal data, no financial data, no regulated data" |
| H-NFR-profile | NFR profile present for story with NFRs | ✅ PASS | Profile exists and covers this story's NFRs |
| H-GOV | Approved By section in discovery artefact has ≥1 non-blank named entry | ✅ PASS | "Hamish King — Platform Owner — 2026-05-09" — positive M1 signal (Platform Owner = non-engineering role) |
| H-ADAPTER | Injectable adapter wiring check (D37) | ✅ PASS | No injectable adapters introduced. D37 is conditional in the story ("if a file-reading function is extracted as an adapter"). Story scope: "pure addition to buildSystemPrompt() — no new routes or adapters". Direct fs.readFileSync calls inside the function. D37 is not triggered. |

**Result: ALL HARD BLOCKS PASS ✅**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | Security + performance NFRs present in story and nfr-profile.md |
| W2 | Scope stability declared | ✅ | — | "Stable" |
| W3 | MEDIUM review findings acknowledged in /decisions | ⚠️ ACKNOWLEDGED | Unacknowledged medium findings increase review rework risk | RISK-ACCEPT logged in decisions.md (wucp.1-W3-1-M2). Test plan T1.16 operationally resolves the AC5 phrasing issue. |
| W4 | Verification script reviewed by domain expert | ⚠️ ACKNOWLEDGED | Unreviewed script may miss edge cases | Operator to review verification-scripts/wucp.1-verification.md before assigning. Medium oversight level means tech lead awareness before assignment. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | — | 2 gaps are "Untestable-by-nature" with explicit handling plans (manual scenarios + T1.16 merge gate). Not uncertain. |

---

## Standards Injection

Domain tags: not declared on story. Web-UI patterns injected proactively because the story modifies `src/web-ui/routes/skills.js` and Architecture Constraints explicitly reference D37 and the no-credential-leakage rule from `web-ui-patterns.md`.

Matched standards files: `.github/standards/web-ui/web-ui-patterns.md`

See **Applicable standards** section in coding agent instructions below.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Pipeline context auto-loader — artefacts/2026-05-08-web-ui-copilot-chat-parity/stories/wucp.1.md
Test plan: artefacts/2026-05-08-web-ui-copilot-chat-parity/test-plans/wucp.1-test-plan.md
Test file: tests/check-wucp1-context-autoloader.js (19 tests, all currently FAILING)
Contract: artefacts/2026-05-08-web-ui-copilot-chat-parity/dor/wucp.1-dor-contract.md

Goal:
Make every test in tests/check-wucp1-context-autoloader.js pass (19 tests, currently all
failing). Do not add scope, behaviour, or structure beyond what the tests and ACs specify.

Primary implementation:
Extend buildSystemPrompt() in src/web-ui/routes/skills.js:
- Add 5th optional parameter: sessionContext = { activeFeatureSlug }
- Read and include in the assembled system prompt (labelled with filename):
    pipeline-state.json (repo root)
    workspace/state.json
    context.yml
    workspace/learnings.md — FIRST 50 LINES ONLY (if file shorter, include all)
    fleet-state.json (if exists — skip silently if absent)
    artefact-coverage-exemptions.json (if exists — skip silently if absent)
- If sessionContext.activeFeatureSlug is set, include the file listing of
  artefacts/[activeFeatureSlug]/ (filenames only, NOT file contents)
- All file reads use fs.readFileSync / fs.readdirSync — Node.js built-ins only
- Every file read is wrapped in a try/catch or existence check: if the file/dir
  does not exist, skip silently (no error thrown, no error in the session output)

Secondary deliverable (T1.16 merge gate):
Create artefacts/2026-05-08-web-ui-copilot-chat-parity/reference/context-yml-schema-inspection.md
documenting: (a) all top-level fields in context.yml and their value types; (b) confirmation
that no field value contains a credential; (c) confirmation all sensitive values use secretRef
pattern. T1.16 asserts this file exists — the story MUST NOT be merged without it.

Constraints:
- Touch ONLY: src/web-ui/routes/skills.js (production code)
  + artefacts/2026-05-08-web-ui-copilot-chat-parity/reference/context-yml-schema-inspection.md
- Do NOT modify: journey.js, server.js, any other src/ file, any test file, any artefact
- Node.js fs built-ins only — no new npm dependencies
- Path traversal guard: NOT required for these reads (all paths are static and known, not
  derived from request data). If you ever derive a path from request input, the guard is mandatory.
- D37: No injectable adapters introduced. buildSystemPrompt() is a direct function extension.
  Do not extract file-read helpers as injectable adapters for this story.
- The existing function signature is: buildSystemPrompt(skillName, sessionPath, repoRoot, priorArtefacts)
  Add the 5th param with default: sessionContext = {}
  Callers that do not pass sessionContext receive {} which gracefully skips
  the activeFeatureSlug-scoped listing (test T1.10 asserts this)

Architecture standards: read .github/architecture-guardrails.md before implementing.
Do not introduce patterns listed as anti-patterns or violate named mandatory constraints.

Open a draft PR when tests pass — do not mark ready for review.
Oversight: Medium — share the DoR artefact with the tech lead before marking any milestone.
If you encounter an ambiguity not covered by the ACs or tests: add a PR comment and stop.

## Applicable standards

Source: .github/standards/web-ui/web-ui-patterns.md

### Injectable adapter pattern (D37)
Any capability that makes a model call or external I/O call MUST be an injectable adapter
with a stub that throws (not null/empty). For this story, no adapters are introduced —
all reads are direct fs calls. If you extract a helper, make it a plain function.

### Session token access
req.session.accessToken is canonical. Never req.session.token.

### Stack constraints
No new npm dependencies. No Express. All session state via req.session.*.

### Shared shell module
src/web-ui/utils/html-shell.js is canonical for renderShell() and escHtml().
This story adds no HTML — no renderShell() usage required.

### Skill name allowlist validation
Not applicable for this story (no skill names derived from user input).
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Tech lead awareness before assigning to coding agent
**Signed off by:** Pending operator confirmation
