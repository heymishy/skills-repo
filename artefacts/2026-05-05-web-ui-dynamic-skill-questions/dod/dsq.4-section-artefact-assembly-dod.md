# Definition of Done: Section-by-section artefact assembly using skill template structure

**PR:** #312 | **Merged:** 2026-05-05
**Story:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/stories/dsq.4-section-artefact-assembly.md
**Test plan:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/test-plans/dsq.4-section-artefact-assembly-test-plan.md
**DoR artefact:** artefacts/2026-05-05-web-ui-dynamic-skill-questions/dor/dsq.4-section-artefact-assembly-dor.md
**Assessed by:** Copilot
**Date:** 2026-05-05

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 (Acceptance Criterion 1: htmlGetPreview returns artefactContent with one H2 per SKILL.md section in document order, no Q/A prefixes) | ✅ | T4.1 — artefactContent contains H2 section headings in SKILL.md order; no "Q1:" / "A:" prefix in output | Automated test `check-dsq4-section-artefact-assembly.js` T4.1 | None |
| AC2 (Acceptance Criterion 2: session.sectionDrafts[sectionIndex] populated → content under heading is confirmed draft text) | ✅ | T4.2 — artefactContent under section heading matches sectionDrafts[0] when draft is present | Automated test T4.2 | None |
| AC3 (Acceptance Criterion 3: session.sectionDrafts[sectionIndex] absent/null → content is concatenated answers, one per line, no Q/A labels) | ✅ | T4.3 — artefactContent under heading is newline-joined answers when no draft present | Automated test T4.3 | None |
| AC4 (Acceptance Criterion 4: Skill with no H2 section structure → single section using skill name as heading; answers concatenated; no regression) | ✅ | T4.4 — flat-skill artefact uses skill name as heading; answers concatenated; no Q/A prefix | Automated test T4.4 | None |
| AC5 (Acceptance Criterion 5: commit-preview page renders section-structured artefactContent — preview matches what will be committed) | ✅ | T4.5 — commit-preview response includes the section-structured content from htmlGetPreview | Automated test T4.5 | None |
| AC6 (Acceptance Criterion 6: All prior tests continue to pass — artefactContent assertions updated to expect section-structured format) | ✅ | T4.6 — regression suite passes; prior htmlGetPreview artefactContent assertions updated to section format | Automated test T4.6 | None |

---

## Scope Deviations

None

---

## Test Plan Coverage

**Tests from plan implemented:** 7 / 7 total
**Tests passing in CI:** 7 / 7

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T4.1 — AC1: H2 headings in document order, no Q/A prefix | ✅ | ✅ | |
| T4.2 — AC2: sectionDrafts populated → draft text used | ✅ | ✅ | |
| T4.3 — AC3: no sectionDrafts → answers concatenated per line | ✅ | ✅ | |
| T4.4 — AC4: flat skill → skill-name heading, concatenated answers | ✅ | ✅ | |
| T4.5 — AC5: commit-preview renders section-structured content | ✅ | ✅ | |
| T4.6a — AC6: regression suite passes | ✅ | ✅ | |
| T4.6b — AC6: prior artefactContent assertions updated | ✅ | ✅ | |

**Gaps (tests not implemented):**
None

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Correctness: section order in assembled artefact matches SKILL.md section order | ✅ | T4.1 verifies document order; sections rendered in same sequence as H2 headings appear in SKILL.md |
| Regression safety: no change to artefact file path derivation or commit call — only content inside htmlGetPreview changes | ✅ | Code review confirmed: change is isolated to htmlGetPreview; route handlers, session store shape, and commit flow are unchanged |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| P2 — Web UI share of outer loop artefacts (> 25% within 8 weeks) | ❌ | After real sessions produce committed artefacts | Baseline was 0%; section-structured artefacts now commit to pipeline-compatible format; measure web UI artefact share after first real operator sessions |
| M3 — Context surfacing rate (> 60% of sessions with context show ≥ 1 grounded model response) | ❌ | After first real sessions run | Section headings provide clearer template-grounded context for downstream model calls; measurement requires real session observation |

---

## Outcome

**COMPLETE**

**Follow-up actions:**
None — measure P2 and M3 after first real production sessions. Use `/record-signal` when evidence is available.

---

## DoD Observations

1. T4.6 required updating prior htmlGetPreview artefactContent assertions — expected and authorised per AC6. The prior "flat Q&A dump" format is now replaced by the section-structured format across all test assertions.
2. AC4 (flat skill regression) is a critical backward-compatibility test. Skills without H2 section structure continue to produce valid artefacts using the skill name as heading — no operator impact for flat skills.
3. This story completes the full dsq feature arc: session start (dsq.1) → section parsing (dsq.1.5) → section confirmation (dsq.2) → session end gate (dsq.3) → artefact assembly (dsq.4).
