## Definition of Ready: Fix dark-mode (and light-mode) button contrast bug on the Products page

**Story reference:** artefacts/2026-08-16-button-contrast-fix/stories/bcf-s1-fix-button-contrast.md
**Test plan reference:** artefacts/2026-08-16-button-contrast-fix/test-plans/bcf-s1-test-plan.md
**Review artefact:** artefacts/2026-08-16-button-contrast-fix/review/bcf-s1-review-1.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-16

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "any signed-in wuce user" (not admin-gated) |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs |
| H3 | Every AC has at least one test in the test plan | ✅ | 4/4 |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 6 exclusions |
| H5 | Benefit linkage field references a named metric | ✅ | Short-track substitute: a validated, root-caused defect from `beta-003.md` signal #9, same pattern as `tmss-s1`/`pcr-s1`/`nia-s1`/`bpe-s1` precedent |
| H6 | Complexity is rated | ✅ | Rating: 1, justified (mechanical value fix) |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review PASS, 0 HIGH, 0 MEDIUM |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged in /decisions) | ✅ | 0 gaps — all 4 ACs fully unit-testable, no RISK-ACCEPT needed |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies block is "None" — schema check not required |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated with real reasoning (single-file inline-style value fix, existing reference pattern, measured scope-verification finding); review ran C/D only (short-track), no Category E findings |
| H-E2E | CSS-layout-dependent AC gap check | ✅ (N/A) | Scanned all 4 ACs — none require rendering a page in a browser; AC4's contrast claim is a pure numeric computation from token hex values (see test plan's E2E detection section, explicitly contrasted with `nia-s1`'s AC3, which WAS CSS-layout-dependent). No RISK-ACCEPT needed under CLAUDE.md's B2 rule since there is no gap to classify. |
| H-NFR | NFR profile exists or story has explicit "NFRs: None" | ✅ | `artefacts/2026-08-16-button-contrast-fix/nfr-profile.md` created |
| H-NFR2 | Compliance NFR with named clause has documented sign-off | ✅ | No compliance NFR named — not applicable |
| H-NFR3 | Data classification field in NFR profile not blank | ✅ | "Internal" |
| H-NFR-profile | NFR profile presence check | ✅ | Story NFR section has real content (Accessibility is the primary driver, with measured numeric evidence, not boilerplate) → profile created and populated |
| H-GOV | Governance approval check | ✅ (N/A) | No `discovery.md` exists — short-track deliberately skips discovery. Treated as not-applicable per the `tmss-s1`/`pcr-s1`/`nia-s1` precedent; recorded as an ASSUMPTION entry in `decisions.md` (citing precedent rather than re-deriving) |
| H-ADAPTER | Injectable adapter wiring check | ✅ (N/A) | No new adapter (`setX()`) introduced by this story |
| H-INF | Infra-plan gate check | ✅ (N/A) | `hasInfraTrack` not set |
| H-MIG | Migration-review gate check | ✅ (N/A) | `hasMigrationTrack` not set |

**Result: 16/16 hard blocks passed (5 not-applicable, explicitly recorded as such; no CSS-layout-dependent AC gap to classify).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or explicitly "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — (0 MEDIUM findings) | — |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases; agent may verify against wrong criteria | RISK-ACCEPTed — see `decisions.md`, citing `tmss-s1`/`nia-s1`'s identical rationale (solo-operator repo, no separate domain-expert role available) |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | — (no gaps at all — all 4 ACs fully covered) | — |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Fix dark-mode (and light-mode) button contrast bug on the Products page — artefacts/2026-08-16-button-contrast-fix/stories/bcf-s1-fix-button-contrast.md
Test plan: artefacts/2026-08-16-button-contrast-fix/test-plans/bcf-s1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Change ONLY `color:var(--accent-ink)` to `color:#fff` at the 11 identified
  button/link instances in `src/web-ui/routes/products.js`. Re-verify the
  exact current line numbers with a fresh
  `grep -n "var(--accent)" src/web-ui/routes/products.js` before editing —
  the triage artefact's line numbers are approximate and may have shifted.
- Do NOT touch the `Designate` (~line 1168) or `Save` (~line 1312) buttons
  — they already use the correct `background:var(--accent);color:#fff`
  pattern and are the reference this fix matches.
- Do NOT touch any plain accent-colored text link with no `background:`
  property (`color:var(--accent)` alone — "Edit", "Add", "Connect a repo",
  "Request promotion", "Approve", the pending-review badge, the approved
  span, or the `.pvc-tab:focus-visible` outline rule).
- Do NOT touch the progress-bar-fill `<div>` (~line 605,
  `background:var(--accent);opacity:...`, no `color` property).
- Do NOT touch any file other than `src/web-ui/routes/products.js` and the
  new test file.
- Do NOT introduce a `[data-theme]`-conditional CSS override — the fix is
  an unconditional inline-style value change (see story's Architecture
  Constraints for why theme-scoping would be more complex, not more
  conservative).
- Architecture standards: read `.github/standards/web-ui/web-ui-patterns.md`
  and `.github/architecture-guardrails.md` before implementing. Do not
  introduce patterns listed as anti-patterns or violate named mandatory
  constraints or Active ADRs.
- Run the full suite (`npm test`) after every task and compare against the
  fresh baseline established at branch-setup — any new failure beyond that
  baseline must be root-caused and fixed (or documented as a CORRECTION in
  `decisions.md`) before committing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

Oversight level: Low
```

---

## Sign-off

**Oversight level:** Low
**Sign-off required:** No
**Signed off by:** Not required — operator (Hamish King) requested and is directly reviewing this work in-session; scope is bounded to one file, one property (`color`), at 11 already-identified lines, no new adapters, no new routes, no new data flows, no CSS-layout-dependent AC gap. (Complexity 1 reflects a purely mechanical value fix with no remaining design ambiguity — the one substantive judgment call made during authoring, light-mode scope, is resolved and documented with measured evidence in the story's Architecture Constraints and `decisions.md`, not left open.)
