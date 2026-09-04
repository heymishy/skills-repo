# Definition of Ready Checklist

## Definition of Ready: Production Docker image includes artefacts/ and .github/pipeline-state.json, so local-disk-based artefact features actually work

**Story reference:** artefacts/2026-09-04-dockerignore-artefacts-and-github-exclusion-fix/stories/daga-s1-include-artefacts-and-github-in-docker-image.md
**Test plan reference:** artefacts/2026-09-04-dockerignore-artefacts-and-github-exclusion-fix/test-plans/daga-s1-test-plan.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-04

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs (3 for Fix 1 + 2 for Fix 2) |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 5 items |
| H5 | Benefit linkage field references a named metric | ✅ | Time to First Actionable Content — same metric this whole investigation thread has targeted; found via the operator's own direct production check of `fapg-s1`'s result |
| H6 | Complexity is rated | ✅ | Rating 2 (raised from an initial 1 during DoR preparation, once the writer regression was found), Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ N/A | No review report — short-track skips /review by design (CLAUDE.md) |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | Depends on `aada-s1`, `fapg-s1` (the features this story makes actually work in production) and `owle.6` (the pipeline-state-writer feature this story's own Fix 2 touches) — all merged, DoD-complete. No incomplete-upstream risk. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated in detail — both fixes named precisely, the regression risk that expanded this story's own scope documented with its full causal chain (found via direct code reading of `server.js`, `journey.js`, `pipeline-state-writer.js`, and `check-owle6-pipeline-state-auto-write.js`, not guessed). No review ran (short-track), so no Category E findings exist to check. |
| H-E2E | CSS-layout-dependent gap check | ✅ N/A | No CSS-layout-dependent language — this is a build-config text check plus a Node-adapter precondition check, not UI |
| H-NFR | NFR profile exists | ✅ | Created at `artefacts/2026-09-04-dockerignore-artefacts-and-github-exclusion-fix/nfr-profile.md` |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Present |
| H-GOV | Governance approval (discovery `## Approved By`) | ⚠️ **Same treatment as every prior short-track story this session** | No discovery artefact exists — short-track skips /discovery by design. Satisfied via the operator's direct in-session instruction ("OK yes please"), following two rounds of `AskUserQuestion` (fix approach, then the expanded scope once the writer regression was found) — both resolved before this DoR was written, not decided unilaterally. Recorded transparently, matching the identical, already-logged H-GOV gap pattern for every prior short-track story in this repo. |
| H-ADAPTER | D37 adapter wiring check | ✅ N/A | `pipelineStateWriterFactory` is an existing, already-D37-compliant adapter (stub-throws via `setPipelineStateWriter(function(){})` in test mode, per `server.js`) — this story changes its own internal precondition logic, not its adapter-wiring shape. |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set — a `.dockerignore` content change, not new infrastructure |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass — 19/19 (13 direct passes + 6 explicit N/A), with the H-GOV note recorded transparently.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No review ran (short-track) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | This story touches a safety-critical precondition in an already-shipped feature (`owle.6`) — a wrong fix here risks silent production data loss, the exact failure mode this story exists to prevent, not just to avoid introducing | **Acknowledged — proceed.** The regression itself, its root cause, and the corrected fix were all found and verified via direct code reading (not guessed) before this DoR was written, and resolved with the operator via `AskUserQuestion` rather than decided unilaterally. AC4/AC5's own tests directly assert the exact before/after safety property (throws without `.git/`, succeeds with it) that matters here. |
| W5 | No UNCERTAIN items in test plan gap table | ✅ N/A | Test plan's own gap table names the one real, structural gap (no `docker build` available in this environment) and states its mitigation (the manual verification script) rather than leaving it silent | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Production Docker image includes artefacts/ and .github/pipeline-state.json, so local-disk-based artefact features actually work — artefacts/2026-09-04-dockerignore-artefacts-and-github-exclusion-fix/stories/daga-s1-include-artefacts-and-github-in-docker-image.md
Test plan: artefacts/2026-09-04-dockerignore-artefacts-and-github-exclusion-fix/test-plans/daga-s1-test-plan.md
DoR contract: artefacts/2026-09-04-dockerignore-artefacts-and-github-exclusion-fix/dor/daga-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify. Two fixes, both required
together -- Fix 1 alone would introduce a real data-loss regression:

(1) .dockerignore: remove the artefacts/ line (currently ~line 41) and
the .github/ line (currently ~line 53), including their own comment
lines. Do NOT remove .git/'s own exclusion (line 27-28) -- Fix 2 depends
on it staying excluded. Do NOT touch .github/scripts/ (line 63) -- it
becomes meaningfully re-scoped automatically once its parent is no
longer wholesale-excluded.

(2) src/web-ui/adapters/pipeline-state-writer.js (pipelineStateWriterFactory):
change the factory's own "is this a real checkout" precondition to
explicitly check fs.existsSync(path.join(repoRoot, '.git')) once at
factory-creation time (not per-call). When false, the returned writer
function throws immediately (before any read/write attempt), naming the
missing .git/ directory. When true, every other line of behaviour is
unchanged from today.

(3) tests/check-owle6-pipeline-state-auto-write.js: add
fs.mkdirSync(path.join(tmpDir, '.git'), { recursive: true }) to T3, T4,
T5, and T8's own fixture setup (the only tests using the real factory,
not a spy) -- alongside their existing .github/ mkdir, not replacing it.

Constraints:
- Do NOT change pipelineStateWriter's own field-level logic, schema
  validation, atomic-write (.tmp-then-rename) mechanics, or prototype-
  pollution guard.
- Do NOT change owle.6's own T1/T2/T6/T7 -- they use a spy, not the real
  factory, and are unaffected by this change.
- Do NOT change server.js's own wiring of setPipelineStateWriter, or its
  own NODE_ENV=test no-op branch.
- No new npm dependencies. No schema or query change.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or violate
  named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium — touches a safety-critical precondition in an already-shipped, production-reachable feature (`owle.6`); the risk of getting this wrong (silent production data loss) is higher-stakes than this story's own small code footprint would otherwise suggest, warranting tech-lead-equivalent awareness even though the fix itself is precisely scoped and its correctness verified by direct tests.
**Sign-off required:** No (Medium — awareness only, not formal sign-off)
**Signed off by:** Hamish King (Platform Owner) — reviewed story, contract, test plan, NFR profile, and this DoR directly in-session, 2026-09-04, via two rounds of `AskUserQuestion` confirmation (fix approach, then the expanded scope) before this DoR was finalized.
