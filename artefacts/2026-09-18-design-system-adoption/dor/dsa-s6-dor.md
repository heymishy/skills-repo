## Definition of Ready: Fix Mobile-Responsiveness Gaps on the Already-Shipped Artefact Viewer and Dashboard

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s6.md
**Test plan reference:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s6-test-plan.md
**Review artefact:** artefacts/2026-09-18-design-system-adoption/review/dsa-s6-review-1.md
**Assessed by:** Claude (agent)
**Date:** 2026-09-20

---

## Contract Proposal

**What will be built:**
`@media (max-width: 768px)` CSS overrides (or an equivalent responsive-grid function) for two already-shipped, real target files: `src/web-ui/views/dashboard-view.js`'s `.sw-skill-grid` and `.sw-cols` (collapse from `repeat(3,1fr)`/`1fr 1fr` to single-column below 768px), and `src/web-ui/routes/artefact.js`'s `.sw-artefact-layout` (collapse the `minmax(0,1fr) 320px` grid to a single-column stack below 768px, with the document-content element reordered to appear before the sidebar element in visual/DOM order — not just a naive grid-to-block CSS collapse, since `DESIGN.md`'s own requirement is document-body-first ordering).

**What will NOT be built:**
Any new functionality, data source, or route on either screen. Any change to the shared app shell (`html-shell.js`'s sidebar/header mobile-collapse) — already correct, established by `dsa-s1`, not touched. Any change to either screen's desktop-width (≥768px) layout, data-wiring, or functional behavior (sign-off, comments, skill-grid links, waiting-on-you/recent-sessions content) — CSS-only at narrow widths.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 (dashboard no overflow) | Playwright: `document.body.scrollWidth` measured at 375px/390px | E2E |
| AC2 (dashboard collapses legibly) | Playwright: real rendered column/card widths + title text wrap inspection | E2E |
| AC3 (artefact viewer no overflow, content not collapsed) | Playwright: `scrollWidth` + main content column's real rendered width at 375px/390px | E2E |
| AC4 (artefact viewer stacks body-first) | Playwright: real DOM/visual order of content vs. sidebar at ≤768px | E2E |
| AC5 (no regression) | Playwright: re-run `dsa-s1`'s and `dsa-s2`'s own full pre-existing E2E suites unmodified | E2E |

**Assumptions:**
Both root-cause CSS locations are already confirmed by direct code read, not assumed (see `decisions.md`, "dsa-s6 created" entry — includes a live Playwright re-measurement of the artefact viewer's real current mobile behavior, since the prior inference about it turned out to be wrong in specifics: no horizontal overflow, but the main content column collapses to 0-14px width while the sidebar stays fixed at 320px). `DESIGN.md`'s own "Artefact/document viewer" pattern text describes the wrong column compressing (predicts the sidebar; the real bug is the main content column) — its prescribed fix (stack single-column, document-body-first) remains correct regardless, so no `DESIGN.md` correction is needed, only implementer awareness (already noted in the story's own Architecture Constraints).

**Estimated touch points:**
Files: `src/web-ui/views/dashboard-view.js`, `src/web-ui/routes/artefact.js`. Services: none. APIs: none — this story adds no new routes, only modifies existing rendering CSS.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs, no mismatches. Both target files and their exact root-cause selectors were independently verified by direct code read before this DoR was written, not assumed from the story's own text alone.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Dual persona ("Hamish King... and... a beta user accessing the platform from a phone") — flagged LOW in `/review` ([1-L2]), matching `dsa-s4`'s own identical precedent, not a block |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test | ✅ | AC1-AC5 all covered, 5 E2E tests |
| H4 | Out-of-scope populated | ✅ | 5 items |
| H5 | Benefit linkage references named metric | ✅ | "Visual consistency across the 4 real screens" |
| H6 | Complexity rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings | ✅ | 0 HIGH, review PASS run 1 |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated with exact real file paths, line numbers, and live-measured (not assumed) bug descriptions per screen; Category E scored 5/5 |
| H-E2E | CSS-layout-dependent + no E2E tooling + no RISK-ACCEPT → block | ✅ | All 5 ACs are CSS-layout-dependent; Playwright already configured, all 5 have real E2E tests — no gap |
| H-NFR | NFR profile exists | ✅ | Feature `nfr-profile.md` exists |
| H-NFR2 | Compliance NFR sign-off | ✅ | No compliance NFRs, N/A |
| H-NFR3 | Data classification not blank | ✅ | "Public" |
| H-GOV | Discovery `Approved By` populated, non-engineering | ✅ | Same discovery artefact — already confirmed by every prior story in this feature |

**H8-ext:** Dependencies lists `dsa-s1`/`dsa-s2` as upstream (both DoD-complete, same-feature — this story only reuses their already-shipped, already-merged code, it reads no cross-story `pipeline-state.json` field either of them wrote). `schemaDepends: []` — no schema field dependency exists.
**H-ADAPTER:** No new adapter introduced. Not applicable.
**H-INF / H-MIG:** Both absent — skipped.

**All hard blocks: 12/12 PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ⚠️ | 1 MEDIUM (1-M1, AC5 verification-method wording) | Logged as RISK-ACCEPT in `decisions.md`, matching every prior story's identical pattern |
| W4 | Verification script reviewed | ✅ | — | Operator confirmed |
| W5 | No UNCERTAIN gap items | ✅ | — | Gap table: "No gaps" |

---

## Oversight level

**Oversight:** Medium (inherited from parent epic — same level as `dsa-s1`-`dsa-s4`/`dsa-s7`, the other stories in this epic)

---

## Standards injection

**Domain tags:** [web-ui]
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Fix Mobile-Responsiveness Gaps on the Already-Shipped Artefact Viewer and Dashboard — artefacts/2026-09-18-design-system-adoption/stories/dsa-s6.md
Test plan: artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s6-test-plan.md

Goal:
Make every test in the test plan pass. Add @media (max-width: 768px)
overrides (or an equivalent responsive-grid function) to two already-shipped,
real files: src/web-ui/views/dashboard-view.js's .sw-skill-grid/.sw-cols
(collapse to single column), and src/web-ui/routes/artefact.js's
.sw-artefact-layout (collapse to single column, document-content element
BEFORE the sidebar element in visual order -- not a naive grid-to-block
collapse). Do not add scope beyond what the tests and ACs specify.

Constraints:
- Real root-cause selectors already confirmed by direct code read -- verify
  against current code once yourself before implementing (files may have
  shifted since this DoR was written), do not re-derive from scratch.
- CSS-only fix. Do not touch either screen's data-wiring, routes, or
  functional behavior (sign-off, comments, skill-grid links, session data).
- Do not touch html-shell.js's shared shell -- already correct.
- DESIGN.md's own "Artefact/document viewer" pattern text predicts the wrong
  column compresses (says sidebar; the real, measured bug is the main
  content column collapsing to near-zero width while the sidebar stays
  fixed at 320px) -- read decisions.md's "dsa-s6 created" entry before
  implementing, do not build against DESIGN.md's prose description alone.
  The PRESCRIBED FIX (stack single-column, document-body-first) is still
  correct regardless.
- Before opening a PR, run the mandatory route/handler E2E coverage check
  on both touched files (per /verify-completion's own established
  requirement): identify every pre-existing spec touching either route,
  run every non-@real-staging one locally.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

## Applicable standards
- .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — share DoR artefact with tech lead awareness
**Signed off by:** Not required (Medium oversight)
