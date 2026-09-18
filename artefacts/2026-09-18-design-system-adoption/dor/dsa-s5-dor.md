## Definition of Ready: `design.system` Context Tag Triggers a Real DoR Hard Block

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s5.md
**Test plan reference:** artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s5-test-plan.md
**Assessed by:** Claude (agent)
**Date:** 2026-09-18

---

## Contract Proposal

**What will be built:**
A `design` key referencing `DESIGN.md`'s path in `.github/context.yml` (per `product/constraints.md` #8). A new conditional hard block, `H-DESIGN`, added to `skills/definition-of-ready/SKILL.md`'s hard-block table, modeled precisely on the existing `H-INF`/`H-MIG` trigger-condition/skip-when-absent pattern (confirmed via direct read of that skill file): fires only when a story's pipeline-state entry has `hasDesignSystemTrack: true`, scans the story's declared touched files for hardcoded color/font values not in `DESIGN.md`'s token table, fails with a specific file/value-naming message matching the existing hard-block message convention.

**What will NOT be built:**
An automated structural/layout compliance checker — the manual-reviewer-judgment half of the hybrid model stays manual. No retroactive re-gating of `dsa-s1`–`dsa-s4` or any other already-in-flight story.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 (context.yml references DESIGN.md) | Unit: read the real `context.yml` file, check for the path reference | Unit |
| AC2 (H-DESIGN scans, fails with specific message) | Unit: fixture file with a hardcoded non-token color; fixture file with only token values (negative control) | Unit |
| AC3 (noncompliant test story blocked) | Integration: fixture story tagged `hasDesignSystemTrack: true`, run full DoR hard-block sequence | Integration |
| AC4 (compliant test story passes) | Integration: same, compliant fixture — proves no false positive | Integration |
| AC5 (untagged story unaffected) | Integration: fixture story with flag absent; re-run existing `H-INF`/`H-MIG` test coverage to confirm no regression | Integration |

**Assumptions:**
`H-INF`/`H-MIG`'s real structural pattern (confirmed via direct read of `definition-of-ready/SKILL.md`) is the correct template to extend — not a novel mechanism.

**Estimated touch points:**
Files: `.github/context.yml`, `skills/definition-of-ready/SKILL.md`. Services: none. APIs: none — this is pipeline-tooling logic, not a web-ui route.

---

## Contract Review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs, no mismatches.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | Persona: "Hamish King (Founder/Operator), acting in his role signing off /definition-of-ready" — real named individual |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs |
| H3 | Every AC has at least one test | ✅ | AC1-AC5 all covered |
| H4 | Out-of-scope populated | ✅ | 3 items |
| H5 | Benefit linkage references named metric | ✅ | "`design.system` DoR gate is real and enforced" |
| H6 | Complexity rated | ✅ | Rating: 2 |
| H7 | No unresolved HIGH findings | ✅ | 0 HIGH, review PASS run 1 |
| H8 | Test plan has no uncovered ACs | ✅ | 0 gaps |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Populated, grounded in real `H-INF`/`H-MIG` precedent; Category E scored 5/5 (cleanest of the 5 stories reviewed) |
| H-E2E | CSS-layout-dependent + no E2E tooling + no RISK-ACCEPT → block | ✅ | No layout-dependent ACs exist at all — this story has no UI/rendering component |
| H-NFR | NFR profile exists | ✅ | Feature nfr-profile.md exists |
| H-NFR2 | Compliance NFR sign-off | ✅ | No compliance NFRs, N/A |
| H-NFR3 | Data classification not blank | ✅ | "Public" |
| H-GOV | Discovery `Approved By` populated, non-engineering | ✅ | Same discovery artefact — already confirmed |

**H8-ext:** Dependencies: "Upstream: None" — schema check not required.
**H-ADAPTER:** `H-DESIGN` is a new hard-block CHECK, not an injectable `setX()`-style adapter — not applicable.
**H-INF / H-MIG:** Both absent from this story's own pipeline-state entry — skipped (note: this story BUILDS the equivalent mechanism for design-system compliance, but does not itself carry `hasInfraTrack`/`hasMigrationTrack`).

**All hard blocks: 12/12 PASS.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged | ⚠️ | 1 MEDIUM (1-M1, AC5 mixes an observable outcome with a verification-method clause) not yet logged | Logging now, see decisions.md |
| W4 | Verification script reviewed | ✅ | — | Operator confirmed |
| W5 | No UNCERTAIN gap items | ✅ | — | Gap table: "No gaps" |

---

## Oversight level

**Oversight:** Medium (inherited from parent epic — "Design System Governance")
**Rationale:** New governance/enforcement logic with platform-wide blast radius across all future `design.system`-tagged work, not just this feature — human review at PR warranted.

---

## Standards injection

**Domain tags:** [web-ui]
**Matched standards files:** `.github/standards/web-ui/web-ui-patterns.md`

Note: this story is pipeline-tooling/governance logic, not a web-ui rendering change — the `web-ui` domain tag was set per `/definition`'s own advisory matching (the story touches `.github/context.yml` and a SKILL.md file, arguably closer to platform-tooling than web-ui). Flagging this as a loose domain match, not a blocking concern — H9's own Architecture Constraints check already passed independent of this tag's precision.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: design.system Context Tag Triggers a Real DoR Hard Block — artefacts/2026-09-18-design-system-adoption/stories/dsa-s5.md
Test plan: artefacts/2026-09-18-design-system-adoption/test-plans/dsa-s5-test-plan.md

Goal:
Make every test in the test plan pass. Add a `design` key to .github/context.yml
referencing DESIGN.md's path (never embed its content). Add a new H-DESIGN
conditional hard block to skills/definition-of-ready/SKILL.md's hard-block
table, modeled exactly on the existing H-INF/H-MIG trigger-condition/
skip-when-absent pattern (read that skill file's own H-INF/H-MIG detail
sections before implementing -- do not invent a different shape). Do not add
scope beyond what the tests and ACs specify.

Constraints:
- H-DESIGN must fire ONLY when hasDesignSystemTrack: true is set on a story's
  pipeline-state entry -- absent or false must skip it entirely, with zero
  effect on any other existing hard block (H1-H13, H-GOV, H-ADAPTER, H-INF,
  H-MIG, H-NFR-profile).
- The token-scan half is automated; the structural/layout-compliance half
  stays a manual DoR-reviewer judgment call -- do not attempt to automate it.
- Do not retroactively re-gate dsa-s1 through dsa-s4 or any other already-
  in-flight story.
- Architecture standards: read .github/architecture-guardrails.md before
  implementing.
- Open a draft PR when tests pass -- do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR
  comment describing the ambiguity and do not mark ready for review.

## Applicable standards
- .github/standards/web-ui/web-ui-patterns.md (matched domain: web-ui -- loose
  match, this is governance/pipeline-tooling work, see DoR artefact note)

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No formal sign-off — share DoR artefact with tech lead awareness
**Signed off by:** Not required (Medium oversight)
