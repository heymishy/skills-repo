# Definition of Done: Produce a ranked markdown artefact with enforced rationale fields, divergence record, and v2 extension point, and save it to disk

**PR:** https://github.com/heymishy/skills-repo/pull/199 | **Merged:** 2026-04-28
**Story:** artefacts/2026-04-27-prioritise-skill/stories/pr.5.md
**Test plan:** artefacts/2026-04-27-prioritise-skill/test-plans/pr.5-test-plan.md
**DoR artefact:** artefacts/2026-04-27-prioritise-skill/dor/pr.5-dor.md
**Assessed by:** Copilot
**Date:** 2026-04-28

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | Test suite verifies output artefact contains: (a) candidate list with final rankings, (b) scores per item per framework, (c) rationale field per item per framework (with placeholder if not provided), (d) session metadata block (date, framework(s), resolution if divergence present) | Automated — tests/check-pr.5.js | None |
| AC2 | ✅ | Test suite verifies warning highlighted when "[rationale not provided]" present (e.g. "⚠ N items missing rationale"), with offer to fill before saving — not silently omitted | Automated — tests/check-pr.5.js | None |
| AC3 | ✅ | Test suite verifies divergence section included when multi-framework divergence was detected: names divergent items, model-level explanation, operator resolution choice | Automated — tests/check-pr.5.js | None |
| AC4 | ✅ | Test suite verifies filename prompt with default path (`artefacts/prioritise-[YYYY-MM-DD]-[topic-slug].md`) and accepts operator-provided path; does not save without confirming path | Automated — tests/check-pr.5.js | None |
| AC5 | ✅ | Test suite verifies clean exit after save: displays confirmed path, states session complete, no further prompts | Automated — tests/check-pr.5.js | None |
| AC6 | ✅ | `node .github/scripts/check-skill-contracts.js` reports 0 violations; `prioritise` entry present in CONTRACTS[] with required structural section markers; 39 skills, 165 contracts OK | Automated — tests/check-pr.5.js (T5.16) | None |
| AC7 | ✅ | Test suite verifies framework abbreviations expanded on first use: WSJF, RICE, MoSCoW all expanded in artefact header or legend | Automated — tests/check-pr.5.js | None |
| AC8 | ✅ | Test suite verifies extension point section present at bottom of SKILL.md with explicit instructions for adding a new framework: sections to add, scoring dimension structure, output format field to extend | Automated — tests/check-pr.5.js | None |

---

## Scope Deviations

None. Dashboard integration, pipeline-state.json writeback, automatic git commit, external tool publishing, and non-markdown formats are all confirmed out of scope and not present.

---

## Test Plan Coverage

**Tests from plan implemented:** 16 / 16
**Tests passing in CI:** 16 / 16

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| T5.1 — Output has candidate list with rankings | ✅ | ✅ | |
| T5.2 — Output has scores per item per framework | ✅ | ✅ | |
| T5.3 — Output has rationale field per item per framework | ✅ | ✅ | |
| T5.4 — Output has session metadata block | ✅ | ✅ | |
| T5.5 — Missing rationale warning displayed | ✅ | ✅ | |
| T5.6 — Warning offers chance to fill before saving | ✅ | ✅ | |
| T5.7 — Divergence section present when applicable | ✅ | ✅ | |
| T5.8 — Divergence section names divergent items | ✅ | ✅ | |
| T5.9 — Divergence section includes resolution choice | ✅ | ✅ | |
| T5.10 — Filename prompt with default path | ✅ | ✅ | |
| T5.11 — Default path format matches convention | ✅ | ✅ | |
| T5.12 — Clean exit after save (confirmed path + session complete) | ✅ | ✅ | |
| T5.13 — No further prompts after exit | ✅ | ✅ | |
| T5.14 — Framework abbreviations expanded on first use | ✅ | ✅ | |
| T5.15 — Extension point section present with add-framework instructions | ✅ | ✅ | |
| T5.16 — NFR: check-skill-contracts.js 0 violations | ✅ | ✅ | |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Skill contract: complete SKILL.md passes check-skill-contracts.js with 0 violations | ✅ | T5.16 — `node .github/scripts/check-skill-contracts.js` — 39 skills, 165 contracts OK. `prioritise` entry present in CONTRACTS[] |
| No credentials or personal identifiers in output artefact | ✅ | Output format contains operator-authored scores and rationale only — no system tokens or personal data |
| No performance constraint (conversational skill; local file save) | ✅ | Not applicable — instruction text only |

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| M1 — Session completion rate | ❌ (0 sessions run) | After first 5 real sessions | A session is counted as complete only when an artefact is written to disk (AC5). pr.5 provides the completion mechanism. **Measurement gap:** denominator (sessions started) is currently untracked — accepted as honour-system self-count for v1 (acknowledged in benefit-metric.md). |
| M2 — Rationale completeness | ❌ (0 sessions run) | After first completed artefact | Output format enforces rationale field per item per framework (AC1c). Absence is visible (AC2 warning). M2 signal measurable from first saved artefact. |
| MM1 — Cold-start replication | ❌ (0 sessions run) | After first cold-start operator run | Extension point documentation (AC8) is the primary MM1 mechanism in this story — makes the skill self-contained for a cold-start operator wanting to add Kano without asking the original author. Signal measurable once a second operator runs the skill. |

**Overall outcome:** COMPLETE. All 5 stories (pr.1–pr.5) are merged, all tests passing in CI (64 assertions total across 5 suites), skill contracts verified, and the complete SKILL.md at `.github/skills/prioritise/SKILL.md` is library-grade. Metrics are not yet measurable — first real session required for M1/M2, first non-engineer session for M3, first cold-start run for MM1.
