## Definition of Ready: Restyle the Landing Page to Match DESIGN.md

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s3.md
**Test plan reference:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s3-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-09-18 (re-signed 2026-09-19 for the FEATURE-WIDE mobile-responsiveness amendment, new AC5 — see `decisions.md`)

---

## Contract Proposal

**What will be built:**
Restyle `src/web-ui/templates/landing.html` (read into `_LANDING_HTML` by `src/web-ui/routes/public.js` at module load, served via `handleRoot` for `GET /`) to match `DESIGN.md`'s "Marketing/landing" layout pattern, applying the token values already updated by `dsa-s1`. This refines the DoR contract precision further than the story's own Architecture Constraints field: `landing.html` genuinely IS the right file to edit (confirmed via direct trace: `public.js:31-34` reads it into `_LANDING_HTML`), it is simply served by `public.js`'s `handleRoot`, not `routes/landing.js`'s unused `handleLanding`.

**What will NOT be built:**
Any change to `handleRoot`'s own logic (auth redirect, PostHog capture, CSRF token substitution, `posthog-js` wiring) — those are all real, working, unrelated concerns this story does not touch. No change to marketing copy.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 (dark-mode tokens) | Playwright: `getComputedStyle` read | E2E |
| AC2 (light-mode tokens) | Playwright: same, light mode toggled | E2E |
| AC3 (layout matches mock) | Playwright: structural assertions on hero/sections/screenshot-frame | E2E |
| AC4 (no regression) | Playwright: re-run `wuce23-skill-launcher-landing.spec.js` unmodified | E2E |
| AC5 (mobile responsive, no horizontal overflow) | Playwright: `page.setViewportSize()` at 375px/390px, measure `document.body.scrollWidth` | E2E |

**Assumptions:**
`landing.html`/`public.js`'s `handleRoot` are the real target (confirmed via direct code trace, correcting the story's own initial file-ambiguity, resolved during `/review`). AC5's implementation will likely require adding explicit CSS to `landing.html`'s own styles (not yet confirmed whether the hero/full-bleed sections already naturally reflow, or need an explicit `@media (max-width: 768px)` override per `DESIGN.md`'s new Responsive behavior section) — investigate at `/implementation-plan` time rather than assuming either way.

**Estimated touch points:**
Files: `src/web-ui/templates/landing.html`. Services: none. APIs: none.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs, no mismatches. Contract further sharpens the story's own Architecture Constraints with the exact `_LANDING_HTML` load trace.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "a beta user... or a future prospective user" — dual framing, flagged LOW in `/review`, not a block |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs (AC5 added 2026-09-19, FEATURE-WIDE mobile-responsiveness amendment) |
| H3 | Every AC has at least one test | ✅ | AC1-AC5 covered |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references named metric | ✅ | "Visual consistency across the 4 real screens" |
| H6 | Complexity rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings | ✅ | 0 HIGH, review PASS run 2 (route ambiguity resolved during review run 1, not carried forward; AC5 amendment reviewed clean in run 2) |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated and precision-corrected during `/review`; Category E scored 5/5 |
| H-E2E | CSS-layout-dependent + no E2E tooling + no RISK-ACCEPT → block | ✅ | No gap-type ACs; Playwright configured |
| H-NFR | NFR profile exists | ✅ | Feature nfr-profile.md exists |
| H-NFR2 | Compliance NFR sign-off | ✅ | No compliance NFRs, N/A |
| H-NFR3 | Data classification not blank | ✅ | "Public" |
| H-GOV | Discovery `Approved By` populated, non-engineering | ✅ | Same discovery artefact — already confirmed |

**H8-ext:** Dependencies lists `dsa-s1` as upstream (same-feature token-rename dependency, not a pipeline-state schema field dependency) — not applicable.
**H-ADAPTER:** No new adapter introduced. Not applicable.
**H-INF / H-MIG:** Both absent — skipped.

**All hard blocks: 12/12 PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ⚠️ | 1 MEDIUM (1-M1, AC4 verification-method wording — the route-ambiguity finding was resolved during review, not carried forward) not yet logged | Logging now, see decisions.md |
| W4 | Verification script reviewed | ✅ | — | Operator confirmed |
| W5 | No UNCERTAIN gap items | ✅ | — | Gap table: "No gaps" |

---

## Oversight level

**Oversight:** Medium (inherited from parent epic)

---

## Standards injection

**Domain tags:** [web-ui]
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Restyle the Landing Page to Match DESIGN.md — artefacts/2026-09-18-design-system-adoption/stories/dsa-s3.md
Test plan: artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s3-test-plan.md

Goal:
Make every test in the test plan pass. Restyle src/web-ui/templates/landing.html
(the file read into _LANDING_HTML by src/web-ui/routes/public.js:31-34, served
via handleRoot for GET /) to match DESIGN.md's "Marketing/landing" layout
pattern and the Skills Platform - Landing.dc.html reference mock, using the
token values dsa-s1 already updated in html-shell.js. Do NOT edit
routes/landing.js or its handleLanding function -- confirmed dead code, never
dispatched. Do not add scope beyond what the tests and ACs specify.

AC5 (added 2026-09-19): the page must also be genuinely mobile responsive --
verify with a real Playwright viewport-size check (375px and 390px widths)
that document.body.scrollWidth never exceeds the viewport width, per
DESIGN.md's new "Responsive behavior" section (single 768px breakpoint,
Marketing/landing minimum bar: single-column hero/copy, no forced horizontal
overflow, screenshot frames scale down rather than clip). Investigate whether
the existing layout already reflows naturally or needs an explicit
@media (max-width: 768px) override -- do not assume either way going in.

Constraints:
- dsa-s1 must land first (token rename dependency).
- Do not touch handleRoot's own logic (auth redirect, PostHog capture, CSRF
  token substitution, posthog-js wiring) -- unrelated, working concerns.
- Do not rewrite marketing copy.
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
