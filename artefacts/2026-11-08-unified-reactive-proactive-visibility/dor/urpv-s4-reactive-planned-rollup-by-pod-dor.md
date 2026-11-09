## Definition of Ready: Reactive-vs-planned load rollup by pod

**Story reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/stories/urpv-s4-reactive-planned-rollup-by-pod.md
**Test plan reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/test-plans/urpv-s4-reactive-planned-rollup-by-pod-test-plan.md
**Assessed by:** Claude Sonnet 5 (Copilot)
**Date:** 2026-11-09

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story As/Want/So with named persona | ✅ | "As a team lead / EM..." |
| H2 | ≥3 ACs in Given/When/Then | ✅ | 4 ACs |
| H3 | Every AC has ≥1 test | ✅ | AC1: 3, AC2: 1, AC3: 1, AC4: 1 |
| H4 | Out-of-scope populated | ✅ | 3 items named |
| H5 | Benefit linkage references a named metric | ✅ | "EM/team-lead real usage for load visibility" + "Rollup completeness" |
| H6 | Complexity rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings | ✅ | Run 1, 2026-11-09 — 0 HIGH |
| H8 | Test plan has no uncovered ACs | ✅ | Gap table: "None" |
| H8-ext | Cross-story schema dependency check | ✅ | Upstream urpv-s2, urpv-s3 declared; `schemaDepends: ["dorStatus"]`; field confirmed present in schema |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Pod-assignment reuse, Unassigned-bucket honesty note, `product/constraints.md` #9, ADR-025 — all named; review Architecture compliance 5/5 |
| H-E2E | CSS-layout-dependent AC without tooling/RISK-ACCEPT | ✅ N/A | Test plan: 0 gaps |
| H-NFR | NFR profile exists | ✅ | `nfr-profile.md` present |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No compliance NFR |
| H-NFR3 | Data classification not blank | ✅ | "Internal — non-public but low sensitivity" |
| H-NFR-profile | Profile presence (story declares NFRs) | ✅ | Present |
| H-GOV | Approved By ≥1 named non-blank entry | ✅ | "Hamish King — Platform Owner — 2026-11-08" |
| H-ADAPTER | Injectable adapter wiring | ✅ N/A | No new adapter — reuses `getFeaturePodAssignments`/`getProductDefaultPod` |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent |
| H-DESIGN | Design-token compliance gate | ⚠️ PASS-with-accepted-exception | `hasDesignSystemTrack: true`. Same `products.js` pre-existing debt (36 non-token colors, none introduced by this story) — RISK-ACCEPTed in `decisions.md` (2026-11-09). This story's own new rendering (pod rollup counts, text-only per MC-A11Y-02) must use real tokens only. |

**All hard blocks PASS** (H-DESIGN with the logged pre-existing-debt exception). No BLOCKED state.

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | "Stable" |
| W3 | MEDIUM findings acknowledged | ✅ N/A | None exist | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No second contributor exists to independently review | RISK-ACCEPT in `decisions.md` (2026-11-09, covering all 4 urpv stories) |
| W5 | No UNCERTAIN gap-table items | ✅ | — | Gap table: "None" |

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

Most load-bearing for this story: the **blended aggregation for rollup percentages** rule — although this story counts raw items (not percentages), the companion rules (exclude-not-zero for sub-records with no data, explicit-empty-state rather than bare 0%) apply directly to the "Unassigned" bucket and to a pod with zero items of one kind.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Reactive-vs-planned load rollup by pod — artefacts/2026-11-08-unified-reactive-proactive-visibility/stories/urpv-s4-reactive-planned-rollup-by-pod.md
Test plan: artefacts/2026-11-08-unified-reactive-proactive-visibility/test-plans/urpv-s4-reactive-planned-rollup-by-pod-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Node.js built-ins only, no new npm dependencies, per .github/standards/web-ui/web-ui-patterns.md
- Reactive/planned counts rendered as DESIGN.md token-class text, never inline colour, never colour-alone (MC-A11Y-02) — no new hardcoded hex values (distinct from the pre-existing products.js color debt this story does not inherit an exception for on its own new lines).
- A pod with zero items of one kind (e.g. zero reactive) shows that count as a real "0", not an empty/missing cell — this is a genuine zero, not a "no data" state (that distinction is reserved for the whole-product zero-pods case, AC3's "Unassigned" bucket).
- Do not modify pod-assignment-store.js's write paths — this story only reads existing pod-assignment data.
- Files out of scope: no historical/trend tracking; no per-individual-engineer breakdown.
- Architecture standards: read .github/architecture-guardrails.md before implementing. ADR-025 (multi-tenancy) — pod lookups stay tenantId/productId-scoped.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review

## Applicable standards

### .github/standards/web-ui/web-ui-patterns.md (domain: web-ui)

- Blended aggregation for rollup percentages (and its companion exclude/explicit-empty rules) — apply the same spirit to this story's reactive/planned counts: a pod genuinely has 0 of one kind is a real 0, not an excluded/blank cell; the whole-product zero-pods case is the one true "no data, single Unassigned bucket" state.
- Stack constraints: Node.js built-ins only, no Express, no new npm dependencies.
- Full file: .github/standards/web-ui/web-ui-patterns.md (read in full before implementing).

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No — tech-lead-equivalent awareness only (Hamish King, Platform Owner)
**Signed off by:** Not required — share the DoR artefact for awareness before assigning
