# Definition of Ready: fresc-s1 — Add orientation copy to two first-run empty states, and gate the Modules card on feature count

**Story reference:** `artefacts/2026-08-25-first-run-empty-state-copy/stories/fresc-s1-product-and-modules-clarity-copy.md`
**Test plan reference:** `artefacts/2026-08-25-first-run-empty-state-copy/test-plans/fresc-s1-test-plan.md`
**Assessed by:** Claude (agent)
**Date:** 2026-08-25
**Track:** Short-track (bundles `beta-007.md` Signals 11 and 12 — real beta-user + operator-observed first-run clarity feedback)

---

## Contract review

Contract Proposal reviewed against fresc-s1's 4 ACs and the test plan (`artefacts/2026-08-25-first-run-empty-state-copy/dor/fresc-s1-dor-contract.md`): every AC maps to at least one unit or integration test, no AC requires E2E/CSS-layout verification, and no proposed touch point falls outside the story's Architecture Constraints. **✅ Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a brand-new `wuce` user or a user who just created a product with no features yet" — role-based persona, same convention as `bvnd-s1`'s accepted precedent |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1: 3 tests, AC2: 2 tests, AC3: 3 tests, AC4: covered by repaired pre-existing suite + T4/T7 + full-suite run |
| H4 | Out-of-scope section is populated | ✅ | 4 explicit exclusions in story |
| H5 | Benefit linkage field references a named metric | ✅ | `2026-06-29-beta-entry-experience` (M1 activation) |
| H6 | Complexity is rated | ✅ | Complexity 1, Scope stability Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ (short-track exemption) | No `/review` was run — short-track explicitly skips discovery-through-review per `CLAUDE.md`'s own routing table. There is no review report to have findings in. Treated as satisfied by short-track policy, not silently skipped — same treatment `bvnd-s1`'s DoR applied. |
| H8 | Test plan has no uncovered ACs | ✅ | Test plan's own "Coverage gaps" section states "None" |
| H8-ext | Cross-story schema dependency check | ✅ N/A | Story's Dependencies field is "None" — no upstream story declared, schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | 4 constraints in story, each naming exact function/line references; no architecture-guardrails review flagged a Category E finding (none applicable — no new adapter, route, or session logic) |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC in this story is CSS-layout-dependent — confirmed in test plan's "Coverage gaps" section |
| H-NFR | NFR profile or explicit `NFRs: None — reviewed [date]` | ✅ | Story's NFR section now reads "NFRs: None — reviewed 2026-08-25" |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance NFR named |
| H-NFR3 | Data classification field blank check | ✅ N/A | No NFR profile exists (not required — H-NFR satisfied via explicit "None") |
| H-NFR-profile | NFR profile presence (B1-enforce) | ✅ N/A | Story's NFR section is explicit "None" — profile not required |
| H-GOV | Governance approval (`## Approved By` in discovery artefact) | ✅ (short-track exemption) | No discovery artefact exists for this story — short-track deliberately skips discovery per `CLAUDE.md`. H-GOV's own AC1-AC5 all presuppose a discovery artefact exists; none anticipate the short-track case. Treated as satisfied by short-track policy, consistent with H7's treatment above — this is a repo-level routing decision already made in `CLAUDE.md`, not a fresh risk being waived per-story. |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | No injectable adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set on this story's pipeline-state entry |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set on this story's pipeline-state entry |

**All hard blocks pass. 17/17.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or explicitly "None — confirmed" | ✅ | — | N/A — satisfied |
| W2 | Scope stability declared | ✅ | — | N/A — satisfied |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No `/review` was run (short-track) — no MEDIUM findings exist to acknowledge | N/A |
| W4 | Verification script reviewed by a domain expert | ⚠️ Acknowledged | Unreviewed script may miss edge cases, or the coding agent may verify against wrong criteria | Hamish King (operator) — "Acknowledge and proceed", logged as RISK-ACCEPT in `decisions.md` |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | Test plan's only gap ("exact copy wording") is explicitly handled — not left uncertain | N/A — satisfied |

All warnings resolved or acknowledged. RISK-ACCEPT for W4 logged in `artefacts/2026-08-25-first-run-empty-state-copy/decisions.md`.

---

## Oversight level

**Medium** — this repo's short-track precedent (`bvnd-s1`, `vcfrc-s1`) treats short-track stories as Medium oversight by default (tech-lead/operator awareness, no formal named sign-off required). The operator has already given explicit direction twice in this conversation to bundle the signals into a story and proceed to `/test-plan`, then to `/definition-of-ready` — satisfying the "share the DoR artefact, confirm you'll do this" formality for Medium, since the operator is reviewing this artefact directly.

---

## Standards injection

**Domain tags:** `[web-ui]` (added to the story for this run — previously prose-only "wuce / web-ui-products")
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

That file is 374 lines covering many concerns unrelated to this story's scope (injectable adapters, journey orchestration, disk-write path-traversal guards, artefact signal protocol, rollup aggregation math) — none of which apply here (no new adapter, no new route, no session/disk-write logic touched). Rather than inject the full, mostly-irrelevant text into the coding agent's instructions (risk: scope confusion, agent second-guessing whether it needs to implement disk-write guards for a copy change), the two sections that are actually applicable are excerpted directly into the Coding Agent Instructions below, with the full file attributed by path for reference. This is a deliberate curation choice, flagged here rather than silently deviating from the skill's literal "include full text" instruction.

**Applicable excerpts (from `.github/standards/web-ui/web-ui-patterns.md`):**

> **Shared shell module (line 84-95):** `src/web-ui/utils/html-shell.js` is the single canonical source for `renderShell()` and `escHtml()`. Every HTML route view must use both — never re-implement or duplicate. `escHtml()` must be applied to every user-supplied or model-supplied string before injecting into an HTML response. *(This story's own explanatory-copy strings are static, not user-supplied, so `escHtml()` is not required for the new lines themselves — but any existing dynamic content in the touched functions, e.g. module names, must remain escaped exactly as it already is.)*
>
> **HTML render function unit test pattern (line 99-117):** Assert on specific string fragments, never full-HTML snapshot equality. Minimum coverage per render function: happy path, XSS injection (escaped `<script>`/`"` does not appear raw), empty/null data (no throw, graceful empty state). This story's test plan already follows this pattern (fragment assertions, stable marker elements rather than exact-copy assertions).

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: fresc-s1 — Add orientation copy to two first-run empty states, and gate the Modules card on feature count
  — artefacts/2026-08-25-first-run-empty-state-copy/stories/fresc-s1-product-and-modules-clarity-copy.md
Test plan: artefacts/2026-08-25-first-run-empty-state-copy/test-plans/fresc-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Task order:
1. Repair the 5 pre-existing tests in tests/check-a1-modules-taxonomy-crud.js
   (lines 467, 475, 486, 494, 502) so their features/journeys fixtures produce
   2+ features, before writing any new code — confirms you understand the
   current behaviour you're about to change, and isolates the "expected"
   pre-fix failures from genuinely new bugs once the gate is added.
2. Implement the features.length > 1 gate around the _renderModulesManagement
   call in _renderProductView (products.js line ~932).
3. Add the explanatory line inside _renderModulesManagement (line ~656),
   wrapped in a stable element (e.g. id="a1-modules-hint").
4. Add the explanatory line inside _renderProductDashboard's empty-state
   branch (line ~147-151), wrapped in a stable element (e.g.
   id="sw-products-empty-hint").
5. Write tests/check-fresc-s1-empty-state-clarity-copy.js per the test plan
   (8 tests). Run it standalone, then re-run the repaired
   check-a1-modules-taxonomy-crud.js standalone, then run the full suite.

Constraints:
- No new npm dependencies, no Express — matches existing file's raw
  http.createServer conventions (see Applicable standards above).
- escHtml() must remain applied to all existing dynamic content (module
  names, product names) in the functions you touch — do not remove or
  weaken existing escaping while adding the new static copy lines.
- Do not modify _renderScaleGauge, _renderConsolidatedFeaturesSection, or
  _renderModuleSection — out of scope per the story.
- Do not change the ">1" threshold value or make it configurable.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing. Do not introduce patterns listed as anti-patterns or
  violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal named sign-off — tech-lead/operator awareness (satisfied: operator directed this DoR run directly)
**Signed off by:** Claude (agent), on explicit operator direction ("Yes please" — bundle into a story and proceed to /test-plan; "Yes please" — proceed to /definition-of-ready)
**Date:** 2026-08-25
**Proceed:** Yes — all hard blocks pass, all warnings resolved or acknowledged (RISK-ACCEPT logged for W4)
