## Definition of Ready: Add the "Product in Action" Demo Section to the Landing Page

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s7.md
**Test plan reference:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s7-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-09-19

---

## Contract Proposal

See `artefacts/2026-09-18-design-system-adoption/dor/dsa-s7-dor-contract.md`.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 6 ACs, no mismatches. Contract reuses `dsa-s3`'s own already-confirmed real target file and token system, adding only what this story's own scope requires.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "a prospective user reaching the landing page before signing up (or an existing beta user revisiting it)" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs |
| H3 | Every AC has at least one test | ✅ | AC1-AC5 have automated E2E coverage; AC6 has E2E+Node regression coverage; AC3 is verified by code review (appropriate for a maintainability claim, not a runtime behavior) |
| H4 | Out-of-scope populated | ✅ | 5 items |
| H5 | Benefit linkage references named metric | ✅ | "Beta user feedback on visual quality" / "Visual consistency across the 4 real screens" |
| H6 | Complexity rated | ✅ | Rating: 1 |
| H7 | No unresolved HIGH findings | ✅ | 0 HIGH, review PASS run 1 |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated, reuses `dsa-s3`'s own already-confirmed trace; Category E scored 5/5 |
| H-E2E | CSS-layout-dependent + no E2E tooling + no RISK-ACCEPT → block | ✅ | AC1/AC5 are CSS-layout-dependent but have real E2E coverage (Playwright configured and used) — condition for blocking not met |
| H-NFR | NFR profile exists | ✅ | Feature `nfr-profile.md` exists, still Active |
| H-NFR2 | Compliance NFR sign-off | ✅ | No compliance NFRs, N/A |
| H-NFR3 | Data classification not blank | ✅ | "Public" (feature-level, unchanged by this story) |
| H-GOV | Discovery `Approved By` populated, non-engineering | ✅ | Same discovery artefact as every other story in this feature — already confirmed |

**H8-ext:** Dependencies lists `dsa-s3` as upstream (same-file, already-merged prerequisite, not a pipeline-state schema field dependency) — not applicable.
**H-ADAPTER:** No new adapter introduced. Not applicable.
**H-INF / H-MIG:** Both absent — skipped.

**All hard blocks: 12/12 PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ⚠️ | 1 MEDIUM ([1-M1], AC6 verification-method wording) | Logged in `decisions.md`, RISK-ACCEPT |
| W4 | Verification script reviewed | ✅ | — | Will be produced alongside this DoR |
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
Story: Add the "Product in Action" Demo Section to the Landing Page — artefacts/2026-09-18-design-system-adoption/stories/dsa-s7.md
Test plan: artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s7-test-plan.md

Goal:
Make every test in the test plan pass. Add a new "Product in action" section
to src/web-ui/templates/landing.html (the same real file dsa-s3 already
restyled, served via public.js's handleRoot for GET /) -- a browser-chrome
-framed area (traffic-light dots + URL-bar-style label, matching DESIGN.md's
mock's own visual treatment) containing a static, clearly-labeled placeholder
in place of a real demo GIF. Leave a single, clearly-commented swap-in point
for the real GIF asset (a future story's own scope, not this one).

Do NOT build the mock's own tab-switching, multi-frame carousel -- this is
explicitly replaced with a single-GIF format per the operator's own decision
(see decisions.md). Do NOT source or embed a real demo GIF -- ship a static
placeholder only. Investigate whether an inline CSS-only placeholder or a
small new static file under src/web-ui/public/ is the right approach before
implementing -- not yet decided, this is real, in-scope investigation work
for this task.

Constraints:
- dsa-s3 must already be merged (it is -- confirm the real current state of
  landing.html before starting, do not assume its content from this DoR's
  own description).
- Do not modify anything else dsa-s3 already restyled (tokens, hero,
  golden-trace demo, hero cards, auth panel) beyond adding this new section.
- Reuse dsa-s3's own already-established token values and .section-1120
  full-bleed layout pattern -- do not introduce a parallel styling approach.
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
