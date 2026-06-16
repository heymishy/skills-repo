# Definition of Ready: Kanban Card and Detail Page CX (kfd1)

**Story reference:** `artefacts/2026-06-17-kanban-feature-detail-cx/stories/kfd1-kanban-card-and-detail-page-cx.md`
**Test plan reference:** `artefacts/2026-06-17-kanban-feature-detail-cx/test-plans/kfd1-kanban-card-and-detail-page-cx-test-plan.md`
**Verification script:** `artefacts/2026-06-17-kanban-feature-detail-cx/verification-scripts/kfd1-kanban-card-and-detail-page-cx-verification.md`
**Assessed by:** Copilot (Claude Sonnet 4.6)
**Date:** 2026-06-17

---

## Contract Proposal

See `artefacts/2026-06-17-kanban-feature-detail-cx/dor/kfd1-kanban-card-and-detail-page-cx-dor-contract.md` for the full contract. Summary:

**What will be built:** Title truncation + tooltip + artefact-count badge in `kanban-view.js`; mojibake data fix in `pipeline-state.json`; new `listLocalArtefacts` export in `artefact-list.js`; artefact-count wiring and grouped detail-page HTML in `features.js`; `renderShell` wrapping in `artefact.js`; local-first wiring in `server.js`; CSS additions in `html-shell.js`.

**What will NOT be built:** Next-best-action, skill-trigger from board, in-place editing, drag-and-drop, non-board list view changes, `renderArtefactItem()` signature changes.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 6 ACs and the test plan. No mismatches between the contract, the AC acceptance criteria, and the 38-test assertion set in `check-kfd1-kanban-card-and-detail-page-cx.js`.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a platform operator…" — kfd1 story section 1 |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs, all in Given/When/Then format (AC1–AC6) |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: 14 assertions; AC2: 6 assertions; AC3: 8; AC4: 8; AC5: 2; AC6: 7 — full coverage table in test plan |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 5 explicit out-of-scope items including item 5 deferral |
| H5 | Benefit linkage field references a named metric | ✅ | M1 — WIP visibility (`artefacts/2026-06-14-web-ui-pm-flow/benefit-metric.md`) |
| H6 | Complexity is rated | ✅ | Complexity: 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Short-track — review skipped per pipeline convention (same as b3 short-track precedent) |
| H8 | Test plan has no uncovered ACs | ✅ | All 6 ACs mapped with explicit coverage; 3 CSS-layout-dependent visual gaps acknowledged in the gap table with manual scenario handling |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None — schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | 5 constraints listed (render-only, escHtml, reuse existing renderer, no new deps, local-first pattern); no conflicts with architecture guardrails |
| H-E2E | CSS-layout-dependent ACs + E2E tooling check | ✅ | CSS-layout-dependent gaps identified for visual quality of AC3/AC4; E2E tooling IS configured in this repo (Playwright, `npm run test:e2e`). Condition "no E2E tooling configured" is false → H-E2E does not block. Manual verification scenarios cover the visual gaps |
| H-NFR | NFR profile or explicit "None" | ✅ | NFR profile created at `artefacts/2026-06-17-kanban-feature-detail-cx/nfr-profile.md` with data classification |
| H-NFR2 | Compliance NFRs with regulatory clause have documented human sign-off | ✅ | None — no regulatory clauses in scope |
| H-NFR3 | Data classification not blank | ✅ | "Internal tooling — no PII, no PCI, no regulated data" in NFR profile |
| H-NFR-profile | NFR profile exists (story has NFR content) | ✅ | `artefacts/2026-06-17-kanban-feature-detail-cx/nfr-profile.md` created as part of this DoR run |
| H-GOV | Approved By in discovery artefact | ✅ | Short-track exemption: no discovery artefact. Origin: operator request 2026-06-16 ("before I can run a /ideate Web session, can we run another short track enhancement to feature kanban"). Same exemption applied as b3 short-track precedent |
| H-ADAPTER | Injectable adapter wiring check | ✅ | No NEW `setX()` adapters introduced. `listLocalArtefacts` is a named export (pure function), not a `setX()` injectable. All existing adapters (`setListArtefacts`, `setFetchPipelineState`, `setFetchArtefactDirectory`) are pre-existing from prior stories — N/A |

**Hard blocks result: ALL PASS — 17/17**

---

## Warnings

| # | Check | Status | Notes |
|---|-------|--------|-------|
| W1 | NFRs identified or "None — confirmed" | ✅ | NFR profile created; all 4 NFRs documented with data classification |
| W2 | Scope stability declared | ✅ | Scope stability: Stable |
| W3 | MEDIUM review findings acknowledged | ✅ | Short-track — no review — N/A |
| W4 | Verification script reviewed by a domain expert | ✅ | Verification script is operator-reviewable (plain language, no technical knowledge required). Operator reviewed and approved short-track scope 2026-06-16 |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | All gaps have explicit gap type (CSS-layout-dependent) and handling decision (manual scenario in verification script) — no UNCERTAIN items |

**Warnings result: ALL CLEAR — no warnings to acknowledge**

---

## Standards injection

Domain tags: None declared in story.
Standards injection: skipped — no domain field.

---

## Oversight level

**Low** — complexity 2, short-track, UI-only changes (no state machine writes, no auth changes, no external API changes), operator confirmed scope 2026-06-16. No sign-off required.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Kanban Card and Detail Page CX (kfd1)
Story artefact: artefacts/2026-06-17-kanban-feature-detail-cx/stories/kfd1-kanban-card-and-detail-page-cx.md
Test plan: artefacts/2026-06-17-kanban-feature-detail-cx/test-plans/kfd1-kanban-card-and-detail-page-cx-test-plan.md
DoR contract: artefacts/2026-06-17-kanban-feature-detail-cx/dor/kfd1-kanban-card-and-detail-page-cx-dor-contract.md
Test file (already written, currently failing): tests/check-kfd1-kanban-card-and-detail-page-cx.js

Goal:
Make every test in tests/check-kfd1-kanban-card-and-detail-page-cx.js pass (38 assertions;
23 currently failing). Do not add scope, behaviour, or structure beyond what the tests and
ACs specify.

Implementation tasks (in order):
1. src/web-ui/views/kanban-view.js
   - Add 'ideation' to LANES discovery entry's stages array
   - Update featureCard(f): truncate title to 48 chars + '…' suffix; add title= attribute with
     full text; add <span class="kb-artefact-badge"> showing "N artefacts" (N > 0) or
     "No artefacts yet" (N === 0) using f.artefactCount

2. .github/pipeline-state.json
   - Fix name fields for 3 features: 2026-04-19-skills-platform-phase4-opus,
     2026-04-14-skills-platform-phase3, 2026-04-23-non-technical-channel
   - Each has garbled double-encoded UTF-8 byte sequences where an em dash (—) should appear
   - Replace the mojibake sequences with a literal em dash character (U+2014)

3. src/web-ui/adapters/artefact-list.js
   - Add and export new function: listLocalArtefacts(repoRoot, featureSlug)
   - Recursively walks <repoRoot>/artefacts/<featureSlug>/ using fs.readdirSync with
     { withFileTypes: true, recursive: true } OR a manual recursive walker
   - Returns flat array of { path: <absolute-or-relative path>, type: 'file' } for each file
   - Returns null (not empty array) when the target directory does not exist
     (caller uses null to trigger fallback to GitHub API)

4. src/web-ui/routes/features.js
   - handleGetFeatures board-view branch: after building viewFeatures, call
     _listArtefacts(f.slug, token) for each feature (where _listArtefacts is the injectable
     setListArtefacts function), set artefactCount to the number of artefacts returned
   - renderArtefactIndexHtml(artefacts, featureSlug): rewrite to group by getLabel(a.type)
     using groupArtefactsByStage() from plain-language-labels.js; render each group as
     <div class="sw-card"><h2 class="sw-section-title">Label</h2>..items..</div>
   - renderArtefactItem(artefact) MUST NOT be modified (tested public contract)
   - Existing string substrings preserved (Discovery, Ready Check, href, date) — confirmed
     by test assertions AC3d-h

5. src/web-ui/routes/artefact.js
   - Wrap ALL three response paths (200, 404, 503) in renderShell({ title, bodyContent, user })
   - Success body: <div class="sw-doc">${html}</div> as bodyContent
   - 404 bodyContent: must contain the lowercase substring 'artefact not found'
     (required by check-wuce2-read-render-artefact.js T4.2 — do not change case)
   - 503 bodyContent: must contain the substring 'Unable to load artefact'
     (required by check-wuce2-read-render-artefact.js T4.3)
   - Import renderShell from '../utils/html-shell'

6. src/web-ui/server.js
   - In the setFetchArtefactDirectory callback, add local-first branch:
     import listLocalArtefacts from './adapters/artefact-list'
     if COPILOT_REPO_PATH is set, call listLocalArtefacts(COPILOT_REPO_PATH, slug);
     if non-null result returned, use it instead of calling GitHub API
     (mirror the existing pipeline-state local-first pattern)

7. src/web-ui/utils/html-shell.js
   - Append to DESIGN_SYSTEM_CSS: table/th/td prose rules for .sw-doc; .metadata-bar /
     .meta-* legibility rules; tidy .artefact-list* rules; .feature-detail__groups grouping
   - Additive only — no changes to existing tokens

8. package.json
   - Add node tests/check-kfd1-kanban-card-and-detail-page-cx.js to the npm test chain

Constraints:
- ONLY modify the 8 files listed above + package.json; do NOT modify any other artefact files
- renderArtefactItem(artefact) in features.js must not change its signature or output structure
- All rendered text must remain HTML-escaped via escHtml — no raw user-controlled strings
- No new npm dependencies (no markdown libs, no templating engines)
- The check-wuce2-read-render-artefact.js test suite must remain fully green (38 existing
  assertions — specifically T4.2 'artefact not found' lowercase and T4.3 'Unable to load'
  substring checks)
- The check-wuce20-artefact-index-html.js test suite must remain fully green (all existing
  assertions about label text, dates, hrefs, nav presence, escaping)
- The check-kanban-view.js test suite must remain fully green (6 lanes in order,
  renderKanban works, feature card placement, XSS escaping)
- Architecture standards: read .github/architecture-guardrails.md before implementing
- Open a draft PR when all 38 tests in check-kfd1-kanban-card-and-detail-page-cx.js pass
  AND the full npm test suite is green — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment

Oversight level: Low
Sign-off required: No
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required — Low oversight
