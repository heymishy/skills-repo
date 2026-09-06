# Definition of Ready: The feature artefact-index page renders every document's real status, using the canonical trace

**Story reference:** artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s4-features-page-integration.md
**Test plan reference:** artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s4-features-page-integration-test-plan.md
**Contract:** artefacts/2026-09-06-canonical-artefact-trace/dor/cat-s4-dor-contract.md
**Assessed by:** Copilot (Claude)
**Date:** 2026-09-06

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | Persona: Developer/engineer |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 5 ACs |
| H3 | Every AC has ≥1 test | ✅ | 9 unit + 2 integration across 5 ACs |
| H4 | Out-of-scope populated | ✅ | 2 exclusions named |
| H5 | Benefit linkage references named metric | ✅ | Both "Unregistered documents visible without a bug report" and "registered-vs-disk divergence rate" |
| H6 | Complexity rated | ✅ | Rating 2 |
| H7 | No unresolved HIGH findings | ✅ | Review: 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | No uncovered ACs | ✅ | 0 gaps |
| H8-ext | Cross-story schema dependency | ✅ | schemaDepends: ["stage","reviewStatus"] on cat-s1/cat-s2/cat-s3 — both fields exist in pipeline-state.schema.json |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | fadm-s1 token reuse, MC-A11Y-02 named by id; review Architecture compliance score 5 |
| H-E2E | CSS-layout-dependent gap check | ✅ | Not triggered — all ACs are markup-presence assertions, not layout |
| H-NFR | NFR profile exists | ✅ | artefacts/2026-09-06-canonical-artefact-trace/nfr-profile.md |
| H-NFR2 | Compliance NFR sign-off | ✅ | Not triggered |
| H-NFR3 | Data classification not blank | ✅ | Populated |
| H-NFR-profile | NFR profile presence | ✅ | Populated; profile exists |
| H-GOV | Approved By non-blank, non-engineer-only | ✅ | "Hamish King — Platform Owner" — positive M1 signal |
| H-ADAPTER | Injectable adapter wiring | ✅ | Not triggered — no `setX()` adapters introduced |
| H-INF | Infra-plan gate | ✅ | Not triggered |
| H-MIG | Migration-review gate | ✅ | Not triggered |

**Result: 19/19 hard blocks passed.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM findings acknowledged | ✅ | — | N/A — 0 findings |
| W4 | Verification script reviewed by domain expert | ⚠️ | Low — derived from PASSed AC/test plan | Hamish King — RISK-ACCEPT logged in decisions.md, 2026-09-06 |
| W5 | No UNCERTAIN gap-table items | ✅ | — | — |

---

## Standards injection

**Domain tags:** [web-ui]
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: The feature artefact-index page renders every document's real status, using the canonical trace — artefacts/2026-09-06-canonical-artefact-trace/stories/cat-s4-features-page-integration.md
Test plan: artefacts/2026-09-06-canonical-artefact-trace/test-plans/cat-s4-features-page-integration-test-plan.md

Goal:
Make every test in tests/check-cat-s4-features-page-integration.js pass. Do
not add scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- Node.js CommonJS only, no new npm dependencies. No Express — raw
  http.createServer only (existing convention).
- Modify src/web-ui/routes/features.js: the /features/:slug handler and
  renderGroupedArtefactIndexHtml must consume cat-s1's buildArtefactTrace +
  cat-s3's classifyDivergence instead of feature-story-structure.js's
  getFeatureStoryStructure. Labels come from cat-s2's resolveLabel/resolveColumnKey.
- CAPTURE A GOLDEN-FIXTURE SNAPSHOT of the current fadm-s1 output for
  2026-09-06-feature-artefact-document-matrix BEFORE making any other change —
  AC4's "byte-identical" comparison is meaningless otherwise.
- Reuse fadm-s1's exact existing design tokens (--surface, --line, --ink,
  --muted, --accent) and table/matrix primitives (.doc-table, .doc-matrix) —
  no new visual language.
- The "Unregistered" indicator MUST be a .sw-pill variant with a text label
  plus icon — never color alone (MC-A11Y-02). Every renderShell() caller in
  this codebase must supply Products-nav sidebar data — verify
  features.js's existing render call already does this correctly (it should,
  since this story doesn't add a new page, just changes its data source) and
  does not regress it.
- Out of scope: /artefact/:slug/:type's own fetch/resolve logic (cat-s5);
  sorting, filtering, search.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium — share this DoR artefact with the tech lead before
assigning (confirmed by Hamish King, 2026-09-06). No formal sign-off required.
```

### Applicable standards — web-ui

Source: `.github/standards/web-ui/web-ui-patterns.md` — read in full before implementing.

Most directly relevant sections for this story (modifies an existing full-page HTML route handler):

- **Shared shell module — canonical source for renderShell() and escHtml()**: this story modifies an *existing* full-page handler (`/features/:slug`), not a new one — confirm it already calls `renderShellWithNav()` (or threads nav data as described in that section) and does not regress to a bare `renderShell()` call while making the data-source swap.
- **HTML render function unit test pattern**: assert specific string fragments (the "Unregistered" pill text, the gap-state marker text) — do not snapshot the full HTML string, except for the one deliberate AC4 byte-identical golden-fixture comparison, which is a different, explicitly-justified case.
- **Stack constraints**: No new npm `dependencies`; no Express.
- No injectable adapter or new session-token usage is introduced by this story — those sections don't apply here.

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — tech-lead awareness only
**Acknowledged by:** Hamish King — Platform Owner — 2026-09-06 (confirmed via /definition-of-ready)
