# Definition of Ready: Write `/modernisation-decompose` SKILL.md

**Story reference:** artefacts/2026-04-22-modernisation-decompose/stories/md-1-skill-md.md
**Test plan reference:** artefacts/2026-04-22-modernisation-decompose/test-plans/md-1-test-plan.md
**Assessed by:** Copilot
**Date:** 2026-04-22

---

## Contract Proposal

**What will be built:**
A new SKILL.md instruction file at `.github/skills/modernisation-decompose/SKILL.md` containing: YAML frontmatter (`name: modernisation-decompose`, `description`, `triggers`); an entry condition check section that verifies the presence of `artefacts/[system-slug]/reverse-engineering-report.md` and blocks with a clear error message if absent; a numbered decomposition step that surfaces Java boundary signals (Maven module, Spring `@Service`, JPA aggregate root, `@Transactional` span) as the stated rationale per feature boundary; a low-signal escalation section offering three distinct operator options; a completion output section describing the `candidate-features.md` format with 5 required fields per entry and an `umbrellaMetric: true` field with traceability note; and a `## State update — mandatory final step` section describing writes to `corpus-state.md` (module coverage %, VERIFIED:UNCERTAIN ratio, `lastRunAt`). An extension point comment for non-Java languages (COBOL, PL/SQL, .NET) is included but not implemented.

**What will NOT be built:**
Non-Java language heuristics. Changes to any existing SKILL.md. Pipeline visualiser integration for `corpus-state.md` fields. Changes to `/review`, `/definition`, or any other existing skill. The `candidate-features.md` file itself is written by operator invocation at runtime — not pre-created.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — npm test passes | Run `npm test`; check `[skill-contracts]` line shows 0 failures for new skill | Integration |
| AC2 — Entry condition with graceful block | Content inspection: assert entry condition section references report path; assert block/error language present | Unit |
| AC3 — Java boundary signals as rationale | Content inspection: assert all four signal types named; assert rationale-field language present | Unit |
| AC4 — corpus-state.md three fields | Content inspection: assert state update section describes module coverage %, VERIFIED:UNCERTAIN, lastRunAt | Unit |
| AC5 — candidate-features.md five fields | Content inspection: assert output format section names all five fields | Unit |
| AC6 — Low-signal escalation three options | Content inspection: assert escalation section names missing signals and three distinct options | Unit |
| AC7 — umbrellaMetric field in output | Content inspection: assert `umbrellaMetric` and traceability note in output section | Unit |

**Assumptions:**
- The `reverse-engineering-report.md` referenced in AC2 follows the format produced by the `/reverse-engineer` skill.
- `corpus-state.md` is created in the same system-slug directory as the rev-eng report.
- The `umbrellaMetric` field format in `candidate-features.md` is unambiguous in context (review finding 1-M2 acknowledged — the SKILL.md must make the format explicit).

**Estimated touch points:**
Files: `.github/skills/modernisation-decompose/SKILL.md` (new). Services: None. APIs: None.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As / Want / So with named persona | ✅ | "platform maintainer" |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 7 ACs, all GWT |
| H3 | Every AC has at least one test in the test plan | ✅ | All 7 ACs covered — 14 unit + 2 integration tests |
| H4 | Out-of-scope section populated | ✅ | 4 items listed |
| H5 | Benefit linkage references a named metric | ✅ | M1 and MM-A named (M3 and MM-B linkage noted in review finding 1-M1 — acknowledged below) |
| H6 | Complexity rated | ✅ | Complexity 3, Unstable |
| H7 | No unresolved HIGH findings | ✅ | 0 HIGH findings (review run 1) |
| H8 | Test plan covers all ACs or gaps acknowledged | ✅ | 5 gaps typed Untestable-by-nature, all with manual scenarios |
| H8-ext | Cross-story schema dependency check | ✅ | Dependencies: None upstream — schema check not required |
| H9 | Architecture Constraints populated; no Category E HIGH findings | ✅ | 4 constraints; 0 Category E HIGH findings |
| H-E2E | No CSS-layout-dependent ACs without E2E coverage or RISK-ACCEPT | ✅ | No CSS-layout-dependent ACs in this story |
| H-NFR | NFR profile exists; story NFRs populated | ✅ | 3 NFRs; nfr-profile.md exists |
| H-NFR2 | No compliance NFRs with regulatory clauses needing human sign-off | ✅ | No regulated data NFRs |
| H-NFR3 | Data classification field in NFR profile is not blank | ✅ | Classification: Public — confirmed in nfr-profile.md |

**All 14 hard blocks: PASS**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified or "None — confirmed" | ✅ | — | — |
| W2 | Scope stability declared | ✅ | — | — |
| W3 | MEDIUM review findings acknowledged in /decisions | ⚠️ | 1-M1 (benefit linkage incomplete) and 1-M2 (AC7 format ambiguity) not yet formally logged | Hamish — acknowledged, RISK-ACCEPT; 1-M1: test-plan author aware; 1-M2: SKILL.md implementation must make umbrellaMetric format explicit |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Unreviewed script may miss edge cases | Hamish — acknowledged for personal pipeline; script reviewed as spec |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | All gaps typed Untestable-by-nature (not Uncertain) | — |

---

## Oversight Level

**Medium** — Human oversight level set by parent epic e1-modernisation-pipeline-bridging. Share this DoR artefact with the tech lead before assigning to the coding agent. No formal sign-off required.

For this personal pipeline, Hamish acts as both operator and tech lead. DoR artefact reviewed and awareness confirmed.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Write /modernisation-decompose SKILL.md — artefacts/2026-04-22-modernisation-decompose/stories/md-1-skill-md.md
Test plan: artefacts/2026-04-22-modernisation-decompose/test-plans/md-1-test-plan.md

Goal:
Create .github/skills/modernisation-decompose/SKILL.md such that all unit and
integration tests in the test plan pass. The tests are content-inspection tests —
they assert the presence of specific sections, keywords, and format descriptions
in the SKILL.md content.

Constraints:
- Create ONE new file: .github/skills/modernisation-decompose/SKILL.md
- Do not modify any existing SKILL.md files or governance scripts
- Do not modify any files under artefacts/, .github/templates/, or standards/
- SKILL.md must be Markdown only — no embedded HTML except HTML comments
- SKILL.md must contain at minimum: YAML frontmatter with name, description, triggers;
  entry condition section; at least one numbered step; ## Completion output section;
  ## State update — mandatory final step section
- Java heuristics must be deterministic: define explicit priority order
  (Maven module > Spring @Service > JPA aggregate root > @Transactional span)
  and tie-breaking rules
- corpus-state.md write instructions must cover metrics only (counts, ratios,
  timestamps) — no business rule text, no customer data
- Include extension point comment for non-Java languages but do not implement them
- Review finding 1-M2 acknowledged: the umbrellaMetric field format in candidate-
  features.md must be unambiguous — specify the exact format (e.g. YAML front matter
  key, markdown table column, or labelled paragraph) so tests and human reviewers
  agree on what constitutes a valid field
- Architecture standards: read .github/architecture-guardrails.md before
  implementing; do not violate any active ADR or mandatory constraint
- Open a draft PR when tests pass — do not mark ready for review
- Oversight: MEDIUM — platform maintainer must review the PR before merge
- If you encounter ambiguity not covered by the ACs or tests:
  add a PR comment and do not mark ready for review

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** No (awareness only)
**Signed off by:** Hamish (operator + tech lead) — 2026-04-22
