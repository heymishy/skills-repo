## Definition of Ready: Restyle the Artefact Viewer to Match DESIGN.md

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s1.md
**Test plan reference:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s1-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-09-18

---

## Contract Proposal

**What will be built:**
Updated CSS custom-property values in `src/web-ui/utils/html-shell.js`'s `:root`/dark-mode blocks (the `--green`/`--amber`/`--red` → `--success`/`--warn`/`--danger` rename, plus all color hex values, applied to match `DESIGN.md`'s token tables). Markup/layout adjustments in `src/web-ui/views/artefact-view.js`'s `renderArtefact` function and `src/web-ui/routes/artefact.js`'s `handleArtefactRoute` handler to match `DESIGN.md`'s "Artefact/document viewer" layout pattern (two-column, `minmax(0,1fr) 320px`, Source Serif 4 doc body, Sign-off + Comments sidebar cards).

**What will NOT be built:**
Any change to `handleArtefactRoute`'s existing injectable adapters (`setFetcher`, `setJourneyStore`, `setLogger`) or the artefact-fetching/sign-off/comment logic itself — this story is presentation-only. The light/dark toggle mechanism in `settings.js` is also out of scope — only the token *values* it applies are changed.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 (dark-mode tokens) | Playwright: `getComputedStyle` read against every named color custom property | E2E |
| AC2 (light-mode tokens) | Playwright: same, after toggling light mode | E2E |
| AC3 (layout matches mock) | Playwright: structural assertions on the two-column layout, doc body font, sidebar cards | E2E |
| AC4 (no regression) | Playwright: re-run `artefact-preview.spec.js`, `artefact-read.spec.js`, `artefact-writeback.spec.js`, `wuce20-artefact-index-html.spec.js` unmodified | E2E |

**Assumptions:**
`renderArtefact` and `handleArtefactRoute` are the real, correct target functions for this restyle (confirmed via direct code read, not assumed from file names alone — the same discipline this story's own Architecture Constraints field already documents for `dsa-s3`'s sibling story).

**Estimated touch points:**
Files: `src/web-ui/utils/html-shell.js`, `src/web-ui/views/artefact-view.js`, `src/web-ui/routes/artefact.js`. Services: none. APIs: none (no new routes or endpoints).

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 4 ACs. No mismatches found: each AC's verification method matches what the AC actually requires (computed-style/layout assertions for AC1-AC3, real pre-existing spec re-runs for AC4).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "a beta user" — segment-level, sourced honestly from discovery/benefit-metric (flagged as LOW in `/review`, not a block) |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 4 ACs, all Given/When/Then |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1-AC4 all covered by E2E tests |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | 3 genuine items |
| H5 | Benefit linkage field references a named metric | ✅ | "Visual consistency across the 4 real screens" |
| H6 | Complexity is rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings from the review report | ✅ | 0 HIGH findings, review PASS run 1 |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | 0 gaps |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Populated, cites real anti-pattern guardrail; Category E scored 5/5 in review |
| H-E2E | CSS-layout-dependent AC + no E2E tooling + no RISK-ACCEPT → block | ✅ | No gap-type ACs exist (all classified E2E-testable, not gaps); Playwright is configured regardless |
| H-NFR | NFR profile exists or story has "NFRs: None" | ✅ | `artefacts/2026-09-18-design-system-adoption/nfr-profile.md` exists |
| H-NFR2 | Compliance NFR with named regulatory clause has documented human sign-off | ✅ | No compliance NFRs — `regulated: false`, N/A |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | "Public" declared |
| H-GOV | Discovery `Approved By` populated, non-engineering-only | ✅ | "Hamish King — Founder/Operator — 2026-09-18" — Founder/Operator is a non-engineering leadership role, matching the established precedent from `web-ui-experience-redesign`'s own `a1-dor.md` |

**H8-ext:** No upstream dependencies declared for this story (Dependencies: "Upstream: None") — schema check not required.

**H-ADAPTER:** This story does not introduce any new injectable adapter — `handleArtefactRoute`'s existing `setFetcher`/`setJourneyStore`/`setLogger` adapters are pre-existing, untouched. Not applicable.

**H-INF / H-MIG:** `hasInfraTrack`/`hasMigrationTrack` both absent from this story's pipeline-state entry — skipped entirely.

**All hard blocks: 12/12 PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified (or "None — confirmed") | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ⚠️ | 2 MEDIUM findings from `/review` (1-M1 So-that/metric mismatch, 1-M2 AC4 verification-method wording) not yet logged in `decisions.md` | Pending — see below |
| W4 | Verification script reviewed by a domain expert | ✅ | — | Operator confirmed "OK verified scripts" |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ✅ | — | Gap table: "None" |

**W3 resolution:** logging both MEDIUM findings as RISK-ACCEPT in `decisions.md` now, per the operator's standing choice to proceed rather than rework the story text.

---

## Oversight level

**Oversight:** Medium (inherited from parent epic — "Visual Restyle Rollout")
**Rationale:** Real, already-shipped, in-production screen with real users; human review at PR warranted, not full autonomous merge.

---

## Standards injection

**Domain tags:** [web-ui]
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

These will be appended to the coding agent instructions block.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Restyle the Artefact Viewer to Match DESIGN.md — artefacts/2026-09-18-design-system-adoption/stories/dsa-s1.md
Test plan: artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s1-test-plan.md

Goal:
Make every test in the test plan pass. Update src/web-ui/utils/html-shell.js's
:root/dark-mode CSS custom-property blocks to match DESIGN.md's token tables
exactly (including renaming --green/--amber/--red to --success/--warn/--danger),
and restyle src/web-ui/views/artefact-view.js (renderArtefact) plus
src/web-ui/routes/artefact.js (handleArtefactRoute) to match DESIGN.md's
"Artefact/document viewer" layout pattern and the Skills Platform - Artefact
Viewer.dc.html reference mock. Do not add scope, behaviour, or structure beyond
what the tests and ACs specify.

Constraints:
- Reuse and extend the existing CSS custom-property architecture — do not
  introduce a parallel styling mechanism.
- Any change to shared surface modules (html-shell.js, design tokens,
  navigation structure, shared CSS) must stay within this story's own scope —
  this story IS the story that satisfies architecture-guardrails.md's own
  anti-pattern guardrail on this exact class of change.
- Do not touch handleArtefactRoute's existing adapters (setFetcher,
  setJourneyStore, setLogger) or the artefact-fetching/sign-off/comment logic —
  presentation-only change.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

## Applicable standards
- .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui)

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — share the DoR artefact with tech lead awareness (operator is both roles in this solo-operator context)
**Signed off by:** Not required (Medium oversight)
