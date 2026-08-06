# Definition of Ready Checklist

## Definition of Ready: Commit completed-stage artefacts to the product's connected repo, with git-fallback on Resume conversation

**Story reference:** artefacts/2026-08-06-durable-artefact-storage/stories/das-s1-commit-artefact-to-repo-with-git-fallback.md
**Test plan reference:** artefacts/2026-08-06-durable-artefact-storage/test-plans/das-s1-test-plan.md
**Review artefact:** artefacts/2026-08-06-durable-artefact-storage/review/das-s1-review-2.md
**Assessed by:** Copilot (Claude Code)
**Date:** 2026-08-07

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "Real SaaS operator running their own delivery pipeline" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | |
| H4 | Out-of-scope section is populated | ✅ | 3 items |
| H5 | Benefit linkage field references a named metric | ✅ | Cross-redeploy artefact durability |
| H6 | Complexity is rated | ✅ | Rating 2, Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 2: PASS, 0 HIGH/MEDIUM/LOW |
| H8 | Test plan has no uncovered ACs | ✅ | |
| H8-ext | Cross-story schema dependency check | ✅ | `schemaDepends: []` declared — code-level reuse of `mtrr-s1`, not a schema field dependency |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | ADR-023, ADR-025, D37 constraint; Category E score 4 (Run 2) |
| H-E2E | CSS-layout-dependent AC check | ✅ N/A | All 5 ACs are server-side logic — no visual/layout dependence |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-08-06-durable-artefact-storage/nfr-profile.md |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No named regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | Confidential |
| H-NFR-profile | NFR profile presence check | ✅ | Present |
| H-GOV | Discovery Approved By populated | ✅ | Hamish King — Platform maintainer / Product owner |
| H-ADAPTER | Injectable adapter wiring check (D37) | ✅ | New `setArtefactCommitAdapter`/`getArtefactCommitAdapter` — AC1/AC2 scope the wiring and failure behaviour; stub throws by default (per Architecture Constraints); implementation plan must name server.js wiring as a task separate from the handler changes; wiring test (`artefactCommitAdapter_twoProductsResolveToTwoDifferentRepos`) asserts behavioural correctness, not just that a setter was called |
| H-INF | Infra-plan gate | ✅ N/A | Not set |
| H-MIG | Migration-review gate | ✅ N/A | Not set |

**All hard blocks pass — 18/18 (14 direct passes + 4 explicit N/A).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified | ✅ | — | — |
| W2 | Scope stability is declared | ✅ | — | — (Stable) |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | Review Run 2: 0 MEDIUM (1-M1 from Run 1 already resolved directly) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Coding agent implements against an unreviewed script | Hamish King — acknowledged, RISK-ACCEPT logged in `decisions.md` (2026-08-07), matching this session's established pattern |
| W5 | No UNCERTAIN items left unaddressed | ✅ N/A | Test plan's Coverage gaps table is "None" | — |

---

## Standards injection

Domain tags: `[web-ui, data]`. Matched standards files: `.github/standards/web-ui/web-ui-patterns.md`. `data` domain has no dedicated standards file in `index.yml` at this time — no match, not silently dropped: flagged here per the standards-injection algorithm.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Commit completed-stage artefacts to the product's connected repo, with git-fallback on Resume conversation — artefacts/2026-08-06-durable-artefact-storage/stories/das-s1-commit-artefact-to-repo-with-git-fallback.md
Test plan: artefacts/2026-08-06-durable-artefact-storage/test-plans/das-s1-test-plan.md
DoR contract: artefacts/2026-08-06-durable-artefact-storage/dor/das-s1-dor-contract.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- D37 (mandatory): new setArtefactCommitAdapter/getArtefactCommitAdapter in a
  new adapter module, generalising sign-off-writer.js's existing GitHub
  Contents API PUT mechanics -- default stub throws ("Adapter not wired:
  artefactCommitAdapter. Call setArtefactCommitAdapter() with a real
  implementation before use."), never returns null/empty. Wire it in
  server.js as a SEPARATE task from the stage-completion handler changes.
- Write-then-verify sequencing (discovery-flagged hazard, AC2): the git
  commit must succeed BEFORE the stage is marked complete in the journey
  store -- never the reverse order. A failed commit must leave the stage
  incomplete with a surfaced error, not a silently "completed" stage with
  no durable backing.
- Dual-write, not a replacement (AC1/AC4): the existing local-disk write
  is UNCHANGED -- do not remove it or make it conditional on the git commit
  succeeding. Only products WITH a connected repo get the additional git
  commit; repo-less products must behave byte-for-byte as before.
- Reuse mtrr-s1's ownerRepoForFeature(slug, credential) for owner/repo
  resolution -- do not invent a second resolution mechanism.
- Do NOT extend the existing inline-edit-then-resave flow to also commit
  to git -- explicitly out of scope.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing (ADR-023, ADR-025 apply).

## Applicable standards (domain: web-ui, data)

[Standards files matched from .github/standards/index.yml for the web-ui
domain -- inject full content here per standards-injection.js's algorithm.
No standards file matched for the "data" domain tag at this time.]

- Open a draft PR when tests pass — do not mark ready for review.
- Never merge or self-merge any PR. Never push directly to origin/master.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: High
```

---

## Sign-off

**Oversight level:** High — introduces a new write-then-verify sequencing pattern around stage-completion that directly affects data-durability guarantees for real (future beta) customer artefacts, matching the epic's own stated rationale.
**Sign-off required:** Yes — named human sign-off before assigning
**Signed off by:** Hamish King — Platform maintainer / Product owner — 2026-08-07
