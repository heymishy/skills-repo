## Definition of Ready: Tag short-track features as reactive work in the consolidated features view

**Story reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/stories/urpv-s2-tag-short-track-as-reactive.md
**Test plan reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/test-plans/urpv-s2-tag-short-track-as-reactive-test-plan.md
**Assessed by:** Claude Sonnet 5 (Copilot)
**Date:** 2026-11-09

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | "As a delivery engineer..." |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC1: 2, AC2: 1, AC3: 2, AC4: 2 |
| H4 | Out-of-scope populated | ✅ | 2 items named |
| H5 | Benefit linkage references a named metric | ✅ | "Reactive-work coverage on the surface" |
| H6 | Complexity rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings | ✅ | Run 1, 2026-11-09 — 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | Gap table: "None" |
| H8-ext | Cross-story schema dependency check | ✅ | Upstream urpv-s1 declared; `schemaDepends: ["dorStatus"]` in contract; `dorStatus` confirmed present in `.github/pipeline-state.schema.json` |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | MC-A11Y-02, `product/constraints.md` #9, no-change-to-health-logic constraints named; review Architecture compliance 5/5 |
| H-E2E | CSS-layout-dependent AC without tooling/RISK-ACCEPT | ✅ N/A | Test plan: 0 gaps, text-node assertions only, not layout-dependent |
| H-NFR | NFR profile exists | ✅ | `nfr-profile.md` present |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFR |
| H-NFR3 | Data classification not blank | ✅ | "Internal — non-public but low sensitivity" |
| H-NFR-profile | Profile presence (story declares NFRs) | ✅ | Present |
| H-GOV | Approved By ≥1 named non-blank entry | ✅ | "Hamish King — Platform Owner — 2026-11-08" |
| H-ADAPTER | Injectable adapter wiring | ✅ N/A | No new adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent |
| H-DESIGN | Design-token compliance gate | ⚠️ PASS-with-accepted-exception | `hasDesignSystemTrack: true`. `node scripts/check-design-tokens.js src/web-ui/routes/products.js` finds 36 pre-existing non-token colors (`#fff`, `#ef4444`, `#22c55e`, `#b00020`, etc.), none introduced by this story — confirmed pre-existing legacy debt, RISK-ACCEPTed in `decisions.md` (2026-11-09, "products.js pre-existing design-token debt"). `node scripts/check-design-tokens.js src/web-ui/modules/product-rollup.js` → PASS, clean. **This story's own new/changed lines must use real `DESIGN.md` token classes only — no new hardcoded colors** (enforced in the Coding Agent Instructions below, and re-checked against this story's actual diff at /verify-completion, not just the pre-existing-debt exception). |

**All hard blocks PASS** (H-DESIGN passes with the pre-existing-debt exception explicitly logged, not silently skipped). No BLOCKED state.

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | "Stable" |
| W3 | MEDIUM findings acknowledged | ✅ N/A | None exist | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No second contributor exists to independently review | RISK-ACCEPT in `decisions.md` (2026-11-09, single entry covering all 4 urpv stories) |
| W5 | No UNCERTAIN gap-table items | ✅ | — | Gap table: "None" |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

Most load-bearing for this story: the **shared shell / escHtml** rule does not newly apply (this story adds a tag to an existing render path, not a new full-page handler), but the **HTML render function unit test pattern** (assert specific string fragments, not full-snapshot equality) directly applies to the AC3/AC4 integration tests.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Tag short-track features as reactive work in the consolidated features view — artefacts/2026-11-08-unified-reactive-proactive-visibility/stories/urpv-s2-tag-short-track-as-reactive.md
Test plan: artefacts/2026-11-08-unified-reactive-proactive-visibility/test-plans/urpv-s2-tag-short-track-as-reactive-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js built-ins only, no new npm dependencies, per .github/standards/web-ui/web-ui-patterns.md
- The "Reactive"/"Planned" tag MUST use a DESIGN.md token class only — no inline style="color:..." and no new hardcoded hex value. This is a hard requirement distinct from the pre-existing color debt elsewhere in products.js (see decisions.md 2026-11-09 RISK-ACCEPT) — that exception covers colors this story did NOT introduce; it does not extend to anything this story adds.
- Text label is mandatory per MC-A11Y-02 — colour alone is never sufficient.
- Files out of scope: no new filtering UI (urpv-s4's job); no change to computeOverallHealthSignal.
- Test assertions: use specific string-fragment checks (e.g. html.includes('Reactive')), not full-snapshot equality, per web-ui-patterns.md's "HTML render function unit test pattern."
- Architecture standards: read .github/architecture-guardrails.md before implementing. ADR-025 (multi-tenancy) — no new query path.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

## Applicable standards

### .github/standards/web-ui/web-ui-patterns.md (domain: web-ui)

- HTML render function unit test pattern: assert specific string fragments; cover happy path, XSS escaping (N/A here — no user-text rendering in this story), empty/null data.
- Stack constraints: Node.js built-ins only, no Express, no new npm dependencies.
- Full file: .github/standards/web-ui/web-ui-patterns.md (read in full before implementing).

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — tech-lead-equivalent awareness only (Hamish King, Platform Owner)
**Signed off by:** Not required — share the DoR artefact for awareness before assigning
