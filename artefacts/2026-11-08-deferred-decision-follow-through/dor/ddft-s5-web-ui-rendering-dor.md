## Definition of Ready: Web UI rendering alongside incident records

**Story reference:** artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s5-web-ui-rendering.md
**Test plan reference:** artefacts/2026-11-08-deferred-decision-follow-through/test-plans/ddft-s5-web-ui-rendering-test-plan.md
**Assessed by:** Claude Sonnet 5 (agent)
**Date:** 2026-11-09

**Review:** PASS — Run 1, 2026-11-09 (0 HIGH, 0 MEDIUM, 0 LOW)
**Test plan:** 9 tests covering 4 ACs (4 unit, 3 integration, 2 NFR — accessibility + security)
**Verification script:** 4 scenarios

---

## Contract Review

✅ **Contract review passed** — proposed implementation (extending `_renderConsolidatedFeaturesSection` a second time, reusing `itar-s3`'s `fetchRepoPath` pattern) aligns with all 4 ACs. No mismatch found.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a delivery engineer / platform owner reviewing what's been deferred" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1–AC4 all covered |
| H4 | Out-of-scope section is populated | ✅ | 2 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | "Web UI rendering existence" |
| H6 | Complexity is rated | ✅ | Rating: 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Run 1 PASS, 0 HIGH |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | No gaps |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block names TWO upstream stories (not "None"): `ddft-s1` (same feature) and `itar-s3` (**cross-feature** — `2026-11-08-incident-triage-and-respond`). `schemaDepends: ["dorStatus"]` declared for both, since each gate is "has the upstream story's own DoR signed off," a field that exists identically on every story object in `pipeline-state.schema.json` regardless of which feature it belongs to — the field check does not change for a cross-feature reference. Field present — PASS. **Current status, checked directly (not assumed):** `ddft-s1`'s DoR is being produced in this same run; `itar-s3`'s DoR has **not yet been produced** as of this check (`artefacts/2026-11-08-incident-triage-and-respond/dor/` contains only `itar-s1`'s artefacts at this time). H8-ext itself passes (the schema field exists) — this does not block DoR sign-off, but the real sequencing constraint is carried forward explicitly into the Coding Agent Instructions below as a hard implementation-order precondition, not silently dropped. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated (shared-surface extension, hard dependency, `product/constraints.md` #9, `fetchRepoPath` reuse, MC-A11Y-02); no Category E findings |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | No AC typed `CSS-layout-dependent` — confirmed directly: "text label, not colour alone" and "visible without click-through" are DOM-content-presence assertions, not rendered-position checks |
| H-NFR | NFR profile exists | ✅ | Exists |
| H-NFR2 | Compliance NFR regulatory sign-off | ✅ N/A | No compliance NFR with a named regulatory clause applies |
| H-NFR3 | Data classification field not blank | ✅ | "Internal" checked |
| H-NFR-profile | NFR profile presence (B1-enforce) | ✅ | Story's NFR section populated; feature profile exists |
| H-GOV | Governance approval check | ✅ | Same as ddft-s1 — PASS, M1 positive |
| H-ADAPTER | Injectable adapter wiring check (D37) | ✅ N/A | No new injectable adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` absent/false |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` absent/false |
| H-DESIGN | Design-token compliance gate | ⚠️ **PASS-with-accepted-exception** | `hasDesignSystemTrack: true` on this story. `node scripts/check-design-tokens.js src/web-ui/routes/products.js` (the declared touched file from this contract's Estimated touch points) found ~40 pre-existing non-token colors (`#fff`, `#ef4444`, `#22c55e`, `#b00020`, `#c33`, `#a4262c`, `#c0392b`, and others) scattered throughout the file — none introduced by this story. RISK-ACCEPTed per operator decision, logged in `artefacts/2026-11-08-unified-reactive-proactive-visibility/decisions.md` (2026-11-09, full entry) with a cross-reference in this feature's own `decisions.md`. **This story's own new/changed lines must still use real `DESIGN.md` tokens** — stated explicitly as a binding constraint in the Coding Agent Instructions below, not waived. |

**All hard blocks: 17/18 passed cleanly, 1 PASS-with-accepted-exception (H-DESIGN, pre-existing debt RISK-ACCEPTed), 3 N/A — 0 genuine failures.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs populated or explicitly "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ N/A | No MEDIUM findings | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | No independent reviewer exists in this project | Acknowledged — same RISK-ACCEPT in `decisions.md` covering all 5 of this feature's stories |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | — | — |

**Additional NFR gap acknowledged (beyond the standard W1–W5 set):** `nfr-profile.md`'s Gaps table flagged the `workspace/incidents.json` web-UI fetch-latency baseline as "Due: Before ddft-s5 reaches /definition-of-ready" — that point is now reached. Acknowledged via RISK-ACCEPT in `decisions.md` (2026-11-09), matching the identical already-accepted gap on `urpv-s3`'s and `itar-s3`'s own fetch paths — not a new, unprecedented gap.

**1 standard warning acknowledged (W4), 1 additional NFR gap acknowledged, 4 standard checks passed cleanly.**

---

## Standards injection

**Domain tags:** [web-ui]
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

These will be appended to the coding agent instructions block (full text included in this DoR artefact below — see "## Applicable standards").

---

## Applicable standards

**Domain: web-ui** — source: `.github/standards/web-ui/web-ui-patterns.md`

> Full text of this 416-line standards file is injected verbatim into the coding agent's working context for this story. Key points directly relevant to this story's own scope (not a substitute for reading the full file):
> - This repo's web-ui server uses raw `http.createServer` — no Express-style middleware chain. `_renderConsolidatedFeaturesSection` and its callers follow this repo's own request-handling conventions, not a generic framework pattern.
> - Every full-page handler must call `renderShellWithNav` (the nav-data-fetching wrapper) — "the single most common web-ui defect in this repo" per this standards file's own framing. This story extends an existing section already reached via that wrapper; do not bypass it.
> - `req.session.accessToken` is the canonical session-token field name — never `req.session.token` (CLAUDE.md coding standard, cross-referenced here).
> - Escaped rendering is mandatory for any user- or repo-sourced content rendered into the page (MC-SEC-01, already named in this story's own NFRs) — this applies directly to `revisitCondition` free-text content.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Web UI rendering alongside incident records — artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s5-web-ui-rendering.md
Test plan: artefacts/2026-11-08-deferred-decision-follow-through/test-plans/ddft-s5-web-ui-rendering-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- HARD PRECONDITION: Do not start this story's implementation until itar-s3's PR has merged. As of this DoR's sign-off date (2026-11-09), itar-s3's own /definition-of-ready had not yet completed. Re-check itar-s3's merge status before beginning — this is a confirmed cross-feature dependency, not a soft suggestion.
- Extend _renderConsolidatedFeaturesSection (src/web-ui/routes/products.js) in place — do not build a second, parallel rendering path for deferred-item records.
- Reuse itar-s3's fetchRepoPath call pattern against workspace/incidents.json — do not introduce a second fetch mechanism.
- Any new or changed color value you introduce in this file MUST come from DESIGN.md's token table (artefacts/2026-09-18-design-system-adoption/reference/DESIGN.md). Pre-existing non-token colors already in this file (~40, confirmed unrelated to this story, RISK-ACCEPTed in decisions.md) are NOT your responsibility to fix — do not expand this story's scope to a file-wide retrofit. Flag in your PR description if you are unsure whether a given line you touched pre-dates this story.
- The incident/deferred-item type distinction must carry a text label, never colour alone (MC-A11Y-02).
- Escape all rendered content from workspace/incidents.json (MC-SEC-01) — this file contains repo-sourced free text (revisitCondition), not just structured fields.
- Read-only rendering only — do not build any create/resolve UI for deferred-item records.
- Architecture standards: read `.github/architecture-guardrails.md` AND `.github/standards/web-ui/web-ui-patterns.md` (full text available in this DoR artefact's "Applicable standards" section) before implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (tech-lead awareness only — Hamish King (Platform Owner) is this personal-scope project's own awareness checkpoint; no second engineering role exists to separately notify)
**Signed off by:** Not required
