# Definition of Ready: alsg-s1 — Add a visible separator between an artefact's type label and its file link

**Story reference:** artefacts/2026-08-27-artefact-label-spacing-gap/stories/alsg-s1-fix-artefact-item-label-separator.md
**Test plan reference:** artefacts/2026-08-27-artefact-label-spacing-gap/test-plans/alsg-s1-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-27
**Track:** Short-track (live production/staging bug, root-caused via direct visual inspection + source read)

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As an operator viewing a feature's artefact list" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 3 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1/AC3: 1 test each; AC2: existing suite re-run |
| H4 | Out-of-scope section is populated | ✅ | 2 explicit exclusions |
| H5 | Benefit linkage field references a named metric | ✅ N/A (short-track direct correctness fix) | No formal benefit-metric artefact |
| H6 | Complexity is rated | ✅ | Complexity 1, Scope stability Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ (short-track exemption) | No `/review` was run — short-track |
| H8 | Test plan has no uncovered ACs | ✅ | Test plan's own "Coverage gaps": "None" |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Literal-separator-over-CSS reasoning detailed |
| H-E2E | CSS-layout-dependent AC gate | ✅ N/A | Story's own NFR section explicitly reasons why visual/screenshot testing isn't warranted for a static string change |
| H-NFR | NFR profile or explicit `NFRs: None — reviewed [date]` | ✅ | Story's NFR section fully populated |
| H-GOV | Governance approval (`## Approved By` in discovery artefact) | ✅ (short-track exemption) | No discovery artefact — short-track |
| H-ADAPTER | Injectable adapter wiring check | ✅ N/A | No adapter introduced |
| H-INF | Infra-plan gate | ✅ N/A | `hasInfraTrack` not set |
| H-MIG | Migration-review gate | ✅ N/A | `hasMigrationTrack` not set |

**All hard blocks pass. 14/14.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or explicitly "None — confirmed" | ✅ | — | N/A — satisfied |
| W2 | Scope stability declared | ✅ | — | N/A — satisfied |
| W4 | Verification script reviewed by a domain expert | ✅ N/A | Complexity 1, single 2-character string change — no verification script needed | N/A |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | — | N/A — satisfied |

All warnings resolved. No RISK-ACCEPT needed.

---

## Oversight level

**Low** — a single, precisely-diagnosed, 2-character string addition with 3 fully-specified regression-guarded ACs. No architectural decision, no multi-file blast radius.

---

## Standards injection

**Domain tags:** `[web-ui]`
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

No section of this file is directly implicated — this is a plain-text HTML generation fix, not a shared-shell, CSRF, or Postgres-fallback concern.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: alsg-s1 — Add a visible separator between an artefact's type label and its file link
  — artefacts/2026-08-27-artefact-label-spacing-gap/stories/alsg-s1-fix-artefact-item-label-separator.md
Test plan: artefacts/2026-08-27-artefact-label-spacing-gap/test-plans/alsg-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Task order:
1. In src/web-ui/routes/features.js's renderArtefactItem, change the
   <span class="artefact-list__type">${escHtml(type)}</span> line to
   append ": " after the label text, inside the span (e.g.
   `${escHtml(type)}:` plus a literal space before the closing </span>,
   or a space after -- implementer's choice on exact placement as long
   as the rendered output reads "Discovery: " immediately before the
   link).
2. Write tests/check-alsg-s1-artefact-label-separator.js covering
   AC1/AC3.
3. Re-run tests/check-wuce6-feature-navigation.js in full (AC2), then
   the full suite.

Constraints:
- No new npm dependencies, no new CSS class.
- Do not touch the <time> element or the Resume conversation link's
  own markup/spacing.
- Do not modify getLabel/the plain-language-labels module -- this
  story only changes renderArtefactItem's own template string.
- Open a draft PR when tests pass -- do not mark ready for review

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No formal named sign-off — tech-lead/operator awareness (satisfied: operator directed this fix directly, chose it as the immediate priority)
**Signed off by:** Claude (agent), on explicit operator direction ("Label-spacing fix now, rest later")
**Date:** 2026-08-27
**Proceed:** Yes — all hard blocks pass, no warnings outstanding
