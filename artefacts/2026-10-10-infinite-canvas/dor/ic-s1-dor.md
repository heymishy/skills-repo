# Definition of Ready Checklist

## Definition of Ready: Render journey stages as connected nodes on a drawflow canvas, replacing the linear list

**Story reference:** artefacts/2026-10-10-infinite-canvas/stories/ic-s1.md
**Test plan reference:** artefacts/2026-10-10-infinite-canvas/test-plans/ic-s1-test-plan.md
**Assessed by:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-10

---

## Contract review

✅ **Contract review passed** — the proposed implementation (serve drawflow assets, render stages as nodes with auto-connections, preserve every existing per-stage action) aligns with all 6 ACs and the test plan's own coverage table. No mismatches found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So, named persona | ✅ | "Outer loop practitioner (PO / SME / discovery lead)" |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 6 ACs |
| H3 | Every AC has ≥1 test | ✅ | All 6 covered, 0 gaps |
| H4 | Out-of-scope section populated | ✅ | 4 items |
| H5 | Benefit linkage references a named metric | ✅ | M2 |
| H6 | Complexity rated | ✅ | 2, Stable |
| H7 | No unresolved HIGH findings | ✅ | `review/ic-s1-review-2.md` — PASS, 0 HIGH/MEDIUM/LOW open |
| H8 | Test plan has no uncovered ACs | ✅ | Gap table: None |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: "None" — schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Cites `decisions.md` ADR-001 (disambiguated), `csd-s1`, ADR-025; 0 HIGH in review |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | Gap table: None — no layout-dependent ACs in this story |
| H-NFR | NFR profile exists | ✅ | `artefacts/2026-10-10-infinite-canvas/nfr-profile.md` |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance frameworks apply |
| H-NFR3 | Data classification not blank | ✅ | Internal |
| H-NFR-profile | NFR profile presence | ✅ | Confirmed exists |
| H-GOV | Discovery `## Approved By` non-blank | ✅ | `discovery.md` — Approved By: Hamish King — Platform Owner — 2026-10-10 |
| H-ADAPTER | Injectable adapter wiring (D37) | ✅ N/A | No new adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent — this story touches no schema |
| H-DESIGN | Design-token compliance gate | ✅ N/A | `hasDesignSystemTrack` absent |

**All hard blocks PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated | ✅ | — | — |
| W2 | Scope stability declared | ✅ | Stable | — |
| W3 | MEDIUM review findings acknowledged | ✅ | None remain (Run 2: 0 MEDIUM) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Not yet formally reviewed — RISK-ACCEPTed, see `decisions.md` | Hamish King |
| W5 | No UNCERTAIN items in gap table | ✅ | Gap table: None | — |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

### .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

[Relevant sections for this story:]

- "Injectable adapter pattern (D37 / ADR-009)" — confirmed NOT applicable, no new adapter.
- "HTML render function unit test pattern" — follow this file's own existing test-fixture conventions (`makeCanvasMockPool`-style) for the new node-render tests, not a new pattern.
- "Shared shell module — canonical source for renderShell()" — the Canvas tab's own page shell is unaffected by this story; only the inner canvas content changes.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Render journey stages as connected nodes on a drawflow canvas, replacing the linear list -- artefacts/2026-10-10-infinite-canvas/stories/ic-s1.md
Test plan: artefacts/2026-10-10-infinite-canvas/test-plans/ic-s1-test-plan.md

Goal:
Make every test in the test plan pass (9 tests: 7 unit, 2 integration).
Do not add scope, behaviour, or structure beyond what the tests and ACs
specify.

Constraints:
- Node.js, CommonJS, raw http.createServer -- no Express, no bundler.
- Install drawflow via `npm install drawflow` -- confirm it lands as a
  real package.json dependency (ADR-001), not a devDependency.
- Serve BOTH drawflow.min.js AND drawflow.min.css via dedicated routes
  in public.js, each mirroring handleMermaidAsset()'s exact pattern
  (fs.readFileSync from node_modules at request time, gzip + in-memory
  cache). Do not bundle, do not copy the file into a static assets
  folder -- read it live from node_modules, matching the mermaid
  precedent exactly.
- Reuse the EXISTING Edit-stage link, Map-feature button, health
  indicator, and moment-of-truth badge markup/handlers verbatim inside
  each drawflow node's HTML content -- do not reimplement these from
  scratch. Read handleGetJourneyCanvas's own current rendering code
  first to find the exact existing markup to reuse.
- CRITICAL -- do not touch the Customer experience or Delivery tabs,
  or any journey data/health-computation logic. This story is pure
  Canvas-tab rendering.
- No unicode glyphs for new icons -- DESIGN.md's own icon-set rule
  (already established 3x this session) applies if any new icon is
  needed; reuse this file's existing SVG icon constants where possible.
- Architecture standards: read .github/architecture-guardrails.md
  before implementing. ADR-025 (tenant scoping) applies -- this story
  only RE-renders already-tenant-scoped data, introduces no new query.
- Open a draft PR when all tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests:
  add a PR comment describing the ambiguity and do not mark ready for
  review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium (per the parent epic's own "Human Oversight Level: Medium" declaration)
**Sign-off required:** No — tech lead awareness only.
**Signed off by:** Not required. Shared with Hamish King — Platform Owner (acting tech lead for this feature) — 2026-10-10.
