# Definition of Ready: Fix audit record slug resolution

**Story reference:** `artefacts/2026-04-29-audit-slug-resolution/stories/sar.1-audit-record-slug-fix.md`
**Test plan reference:** `artefacts/2026-04-29-audit-slug-resolution/test-plans/sar.1-test-plan.md`
**Assessed by:** GitHub Copilot (/definition-of-ready — short-track)
**Date:** 2026-04-29

---

## Contract Proposal

**What will be built:**
A new Node.js module `scripts/extract-pr-slug.js` that exports two functions: `extractPRSlug(bodyText)` (returns first artefact slug found in PR body, or `""`) and `buildSlugSourceNote(source, slug)` (returns the appropriate header string for the audit record comment). The `resolve_feature` bash step in `.github/workflows/assurance-gate.yml` is updated to call `node scripts/extract-pr-slug.js` via `PR_BODY` environment variable and use its output as `outputs.slug` before falling back to the current pipeline-state.json heuristic. The JavaScript comment-building block in the workflow is updated to include the slug source note in the "What was delivered" section header.

**What will NOT be built:**
- Cross-checking the staging manifest slug against the extracted slug and blocking on mismatch (deferred to a follow-up story per Out of Scope section).
- Any change to how artefact hashes are computed, displayed, or verified.
- Any change to the governance gate verdict logic.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1/T2/T3 — unit tests on `extractPRSlug()` with various PR body inputs | Unit |
| AC2 | T4/T5 — unit tests on `extractPRSlug()` with empty/null input | Unit |
| AC3 | T6 — spawn `scripts/extract-pr-slug.js` as child process with `PR_BODY` env var; assert stdout = slug | Integration |
| AC4 | T7 — unit test on `buildSlugSourceNote("auto-resolved")` | Unit |
| AC5 | T8 — unit test on `buildSlugSourceNote("pr-body", slug)` | Unit |

**Assumptions:**
- PR template "Chain references" table always uses the format `` `artefacts/<slug>/...` `` — the backtick-wrapped path is the stable pattern to match.
- `github.event.pull_request.body` is available in the workflow context for all `pull_request` triggers (confirmed by GitHub Actions docs).
- The current `resolve_feature` bash step can call `node` — Node.js is pre-installed on `ubuntu-latest` GitHub Actions runners.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a platform operator reviewing a merged PR" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs, all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | T1–T8 cover AC1–AC5 |
| H4 | Out-of-scope section is populated | ✅ | Explicit deferred items listed |
| H5 | Benefit linkage field references a named metric | ✅ | Named as "Pipeline governance integrity (short-track defect)" — acceptable for short-track |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ | Short-track exemption — no formal review run. Scope bounded to single new script + workflow update; no HIGH-risk behaviour. Operator acknowledged. |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | Two integration gaps acknowledged in gap table with manual verification plan |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-009 (no contents:write), zero-new-deps, fail-open — all stated |
| H-E2E | No CSS-layout-dependent ACs | ✅ | N/A — CLI/workflow only |
| H-NFR | NFR profile or explicit "None" | ✅ | Story declares "None identified" |
| H-NFR2 | No compliance NFR with unsigned regulatory clause | ✅ | N/A |
| H-NFR3 | Data classification not blank | ✅ | N/A — no data classification required for CLI script |

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | N/A | |
| W2 | Scope stability declared | ✅ | Stable | |
| W3 | MEDIUM review findings acknowledged | ✅ | Short-track — no review run | |
| W4 | Verification script reviewed by domain expert | ⚠️ | Script not reviewed by a separate human before coding | Operator — 2026-04-29 |
| W5 | No UNCERTAIN gaps in test plan | ✅ | Both gaps are acknowledged integration gaps with manual verification plans | |

**W4 acknowledgement:** Short-track — operator reviewed verification script during this DoR run and accepts the risk. The verification scenarios are simple CLI commands and GitHub UI checks.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Fix audit record slug resolution — artefacts/2026-04-29-audit-slug-resolution/stories/sar.1-audit-record-slug-fix.md
Test plan: artefacts/2026-04-29-audit-slug-resolution/test-plans/sar.1-test-plan.md

Goal:
Make every test in tests/check-sar1-slug-resolution.js pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js built-ins only — no new npm dependencies
- Create scripts/extract-pr-slug.js exporting extractPRSlug(bodyText) and buildSlugSourceNote(source, slug)
- Update the resolve_feature step in .github/workflows/assurance-gate.yml to call
  node scripts/extract-pr-slug.js via PR_BODY environment variable
- Update the JavaScript comment-building block in assurance-gate.yml to include
  the slug source note in the "What was delivered" section header
- Files in scope: scripts/extract-pr-slug.js (new), .github/workflows/assurance-gate.yml,
  tests/check-sar1-slug-resolution.js (already exists as failing stub)
- Files explicitly out of scope: all other scripts/, all artefacts/, all .github/skills/,
  pipeline-state.json (except the story's own pipeline-state update at PR merge)
- Architecture standards: read .github/architecture-guardrails.md before implementing
- ADR-009: no contents:write permission added to workflow
- Fail-open: if extraction fails, fall back to heuristic — do NOT fail the gate
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for review

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required — Low oversight, operator acknowledged W4
