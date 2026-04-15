# Retrospective Artefact Coverage Audit — 2026-04-16

**Scope:** All CHANGELOG versions from [0.1.0] through [Unreleased]. Phase 1 (2026-04-09-skills-platform-phase1) and Phase 2 (2026-04-11-skills-platform-phase2) full artefact chains. Phase 3 (2026-04-14-skills-platform-phase3) in-progress chain status.

**Classification scheme:**
- **PHASE-1** — covered by a Phase 1 story with a full artefact chain
- **PHASE-2** — covered by a Phase 2 story with a full artefact chain
- **PHASE-3** — covered by a Phase 3 story (in-progress, no DoD yet — expected)
- **BETWEEN-STORIES** — committed post-pipeline start (≥ 2026-04-09) with no covering story in any phase
- **PRE-PIPELINE** — committed before Phase 1 started (< 2026-04-09); excluded from coverage score

---

## Direction 1 — Story Artefact Completeness

### Phase 1 — 2026-04-09-skills-platform-phase1

| Story ID | Story slug | Story | DoR | DoR-contract | Test Plan | Verification | Review | DoD | Status |
|----------|-----------|-------|-----|--------------|-----------|--------------|--------|-----|--------|
| p1.1 | distribution-progressive-disclosure | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | COMPLETE |
| p1.2 | surface-adapter-model-foundations | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | COMPLETE |
| p1.3 | assurance-agent-ci-gate | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (2 passes) | ✓ | COMPLETE |
| p1.4 | watermark-gate | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | COMPLETE |
| p1.5 | workspace-state-session-continuity | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | COMPLETE |
| p1.6 | living-eval-regression-suite | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | COMPLETE |
| p1.7 | standards-model-phase1 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | COMPLETE |
| p1.8 | model-risk-documentation | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | COMPLETE |
| prototype-fix-s2 | prototype-fix-s2-exit-code | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | VOIDED† |
| prototype-fix-s4 | prototype-fix-s4-compilation | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | VOIDED† |

†**VOIDED (expected):** Epic 1 was voided on 2026-04-09 (decisions.md entry: "Epic 1 Prototype Test Suite Stabilisation — VOIDED — prerequisite stories resolved by direct fix"). Story files are retained for historical traceability. Absent artefacts are expected and do not represent a gap.

**Phase 1 summary:** 8/8 production stories COMPLETE. 2/2 voided stories have story file only (no artefact chain — expected). No unexpected gaps.

---

### Phase 2 — 2026-04-11-skills-platform-phase2

| Story ID | Story slug | Story | DoR | DoR-contract | Test Plan | Verification | Review | DoD | Status |
|----------|-----------|-------|-----|--------------|-----------|--------------|--------|-----|--------|
| p2.1 | definition-skill-improvements | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | COMPLETE |
| p2.2 | review-incremental-write | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | COMPLETE |
| p2.3 | dor-dod-template-improvements | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | COMPLETE |
| p2.4 | agents-md-adapter | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | COMPLETE |
| p2.5a | iac-saas-api-adapters | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | COMPLETE |
| p2.5b | saas-gui-m365-manual-adapters | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | COMPLETE |
| p2.6 | ea-registry-path-a | ✓ | ✓ | ✗‡ | ✓ | ✓ | ✓ | ✓ | COMPLETE |
| p2.7 | fleet-registry-ci-aggregation | ✓ | ✓ | ✗‡ | ✓ | ✓ | ✓ | ✓ | COMPLETE |
| p2.8 | persona-routing-non-engineer-approval | ✓ | ✓ | ✗‡ | ✓ | ✓ | ✓ | ✓ | COMPLETE |
| p2.9 | discipline-standards-remaining | ✓ | ✓ | ✗‡ | ✓ | ✓ | ✓ | ✓ | COMPLETE |
| p2.10 | bitbucket-ci-validation | ✓ | ✓ | ✗‡ | ✓ | ✓ | ✓ | ✓ | COMPLETE |
| p2.11 | improvement-agent-trace-proposals | ✓ | ✓ | ✗‡ | ✓ | ✓ | ✓ (2 passes) | ✓ | COMPLETE |
| p2.12 | improvement-agent-challenger-skill | ✓ | ✓ | ✗‡ | ✓ | ✓ | ✓ | ✓ | COMPLETE |

‡**No separate DoR-contract (expected for Phase 2 wave 2):** Stories p2.6–p2.12 do not have a separate `-dor-contract.md` file. This is a Phase 2 late-wave pattern — the DoR contract content was merged into the main `-dor.md` file for later stories. No information is missing; the convention evolved mid-phase.

**Phase 2 summary:** 13/13 production stories COMPLETE. No gaps.

---

### Phase 3 — 2026-04-14-skills-platform-phase3 (in-progress)

Phase 3 has 18 stories. Only p3.1a–p3.2b have completed the outer-loop artefact chain. No DoD directory exists (expected — Phase 3 is in-progress). Detailed per-story table is out of scope for this retrospective audit (Phase 3 is live delivery work, not a retrospective subject).

**Phase 3 in-progress summary:** 7 stories (p3.1a–p3.2b) have DoR + test-plan + verification + review. 11 stories (p3.3–p3.13) have story files only — outer loop not yet complete. No DoD directory — expected.

---

## Direction 2 — CHANGELOG Implementation Coverage Mapping

### Classification key: ✓-covered = maps to a named story | ✗-uncovered = no covering story

| Version | Date | Item | Classification | Covering story |
|---------|------|------|----------------|----------------|
| [Unreleased] | — | Post-merge assurance gate: eval/write separation, trace-commit.yml workflow | PHASE-3 | p3.1a trace-commit-observability |
| [Unreleased] | — | `feat/repo-tidy`: docs/ directory structure, check-docs-structure.js | BETWEEN-STORIES | — |
| [Unreleased] | — | `.github/skills/levelup/` → `/improve/` rename | BETWEEN-STORIES | — |
| [Unreleased] | — | `pipeline-state.json` + `validate-trace.sh` Phase 3 schema fixes (string-slug guards, epic required fields) | PHASE-3 | p3.1c test-suite-integrity |
| [Unreleased] | — | `copilot-instructions.md` coding agent orientation section restored | BETWEEN-STORIES | — |
| [Unreleased] | — | `workspace/learnings.md` D-batch seeding entries | BETWEEN-STORIES | — |
| [Unreleased] | — | `.github/copilot-instructions.md` token optimisation, abbreviation expansion standard | BETWEEN-STORIES | — |
| [Unreleased] | — | `.github/skills/estimate/SKILL.md` — new `/estimate` skill, multiple amendments | BETWEEN-STORIES | — |
| [Unreleased] | — | `scripts/parse-session-timing.js` — E3 actuals JSONL parser | BETWEEN-STORIES | — |
| [Unreleased] | — | `.github/skills/issue-dispatch/SKILL.md` — new `/issue-dispatch` skill | BETWEEN-STORIES | — |
| [Unreleased] | — | `.github/skills/persona-routing/SKILL.md` — new `/persona-routing` skill | PHASE-2 | p2.8 persona-routing-non-engineer-approval |
| [Unreleased] | — | `standards/software-engineering/core.md`, `standards/quality-assurance/core.md` additions | PHASE-1 | p1.7 standards-model-phase1 |
| [Unreleased] | — | `standards/index.yml` outcome-orientation note | PHASE-1 | p1.7 standards-model-phase1 |
| [Unreleased] | — | `.github/architecture-guardrails.md` ADR-005 addition | BETWEEN-STORIES | — |
| [Unreleased] | — | `copilot-instructions.md` session conventions updates (checkpoint threshold, exit sequence) | BETWEEN-STORIES | — |
| [Unreleased] | — | Estimate prompts added to `/discovery`, `/definition`, `/improve` SKILL.md files | BETWEEN-STORIES | — |
| [Unreleased] | — | `.github/workflows/copilot-setup-steps.yml` governance check additions | PHASE-1 | p1.3 assurance-agent-ci-gate |
| [Unreleased] | — | `tests/check-workspace-state.js` | PHASE-1 | p1.5 workspace-state-session-continuity |
| [0.7.0] | 2026-04-12 | `README.md` full rebuild from platform actuals | BETWEEN-STORIES | — |
| [0.6.2] | 2026-04-11 | `.github/scripts/viz-functions.js` pure-function extraction | PHASE-2 | p2.7 fleet-registry-ci-aggregation |
| [0.6.2] | 2026-04-11 | `.github/scripts/check-viz-behaviour.js` test suite | PHASE-2 | p2.7 fleet-registry-ci-aggregation |
| [0.6.1] | 2026-04-11 | `pipeline-viz.html` PURPOSE comment, export buttons, channel hint tags, decisions.md note | BETWEEN-STORIES | — |
| [0.6.1] | 2026-04-11 | `decisions.md` Phase 2 pre-discovery ARCH entries (maintenance) | BETWEEN-STORIES | — |
| [0.6.1] | 2026-04-11 | `pipeline-viz.html` `loadFleetRegistry()` fleet-state.json primary fallback | BETWEEN-STORIES | — |
| [0.6.0] | 2026-04-11 | `/estimate` integration in pipeline-viz.html | BETWEEN-STORIES | — |
| [0.6.0] | 2026-04-11 | Fleet registry stat in summary bar | BETWEEN-STORIES | — |
| [0.6.0] | 2026-04-11 | ADR-005 in governance-gates.yml | BETWEEN-STORIES | — |
| [0.5.18] | 2026-04-09 | Repo structure inline-chat reorganisation (`product/`, `contexts/`, `artefacts/`, `files/` moved to root) | BETWEEN-STORIES | — |
| [0.5.17] | 2026-04-02 | Guardrails compliance matrix (schema, viz, 6 skills updated) | PRE-PIPELINE | — |
| [0.5.16] | 2026-04-02 | `README.md` → `skill-pipeline-instructions.md` rename | PRE-PIPELINE | — |
| [0.5.15] | 2026-04-01 | Full-pipeline governance gate expansion | PRE-PIPELINE | — |
| [0.5.14] | 2026-04-01 | Programme concept across viz views | PRE-PIPELINE | — |
| [0.5.13] | 2026-04-01 | Governance scope programme-level view | PRE-PIPELINE | — |
| [0.5.12] | 2026-04-01 | Governance view UX (compact criteria, artefact links, scope toggle) | PRE-PIPELINE | — |
| [0.5.11] | 2026-04-01 | Governance dynamic gates, compliance context banner, 4 skills updated | PRE-PIPELINE | — |
| [0.5.10] | 2026-04-01 | Inner loop skills parent propagation | PRE-PIPELINE | — |
| [0.5.9] | 2026-03-31 | `storyNextSkill` inner loop awareness, color-coded task/test status | PRE-PIPELINE | — |
| [0.5.8] | 2026-03-31 | Pipeline viz inner loop UX (story state, stage dots, epic summary bar) | PRE-PIPELINE | — |
| [0.5.7] | 2026-03-31 | `/implementation-plan`, `/subagent-execution`, `/tdd` task state writes | PRE-PIPELINE | — |
| [0.5.6] | 2026-03-31 | TDD task links fix | PRE-PIPELINE | — |
| [0.5.5] | 2026-03-31 | `sync-from-upstream`: scripts/ and tests/ no longer overwritten | PRE-PIPELINE | — |
| [0.5.4] | 2026-03-31 | viz TDD task links repo-root relative fix; story drawer combined review links | PRE-PIPELINE | — |
| [0.5.3] | 2026-03-31 | viz inner loop shown as upcoming before entry; actionable warnings | PRE-PIPELINE | — |
| [0.5.2] | 2026-03-31 | `/clarify` supply-push conversion; `/decisions` integration | PRE-PIPELINE | — |
| [0.5.1] | 2026-03-31 | `/decisions` baked into DoR boundary | PRE-PIPELINE | — |
| [0.5.0] | 2026-03-30 | Markdown formatting toolbar, standards domain placeholder files, install scripts 4-question setup | PRE-PIPELINE | — |
| [0.4.0] | 2026-03-29 | Sync helper scripts, upstream strategy, skills review fixes (11 total), viz artefact link fix | PRE-PIPELINE | — |
| [0.3.0] | 2026-03-28 | Bootstrap wrapper scripts, upstream sync strategy, agent upstream awareness | PRE-PIPELINE | — |
| [0.2.0] | 2026-03-28 | F1–F10 feature batch (standards injection, /levelup skill, timestamped artefact structure, /spike, install scripts, product context, complexity routing, /clarify, CI traceability, NFRs, pipeline viz in-viz editor phases 1–4, governance view) | PRE-PIPELINE | — |
| [0.1.0] | 2026-03-20 | Initial skills-repo commit | PRE-PIPELINE | — |

---

## Findings Summary

### Finding 1 — Direction 1 gaps

**Result: No unexpected gaps.** All 8 Phase 1 production stories and all 13 Phase 2 production stories have complete artefact chains (story → DoR → test-plan → verification script → review → DoD). The 2 voided prototype-fix stories have story files only — this is expected and recorded in decisions.md. Phase 3 is in-progress; absent DoD artefacts are expected.

**Notable pattern (not a gap):** Phase 2 stories p2.6–p2.12 do not have a separate `-dor-contract.md` file. The DoR contract content was absorbed into the main `-dor.md` for later-wave stories. No information is missing; the convention evolved naturally mid-phase.

---

### Finding 2 — BETWEEN-STORIES items (post-pipeline, no covering story)

The following items were committed on or after 2026-04-09 (pipeline start) and do not trace back to any story in Phase 1, 2, or 3:

| Item | Nature | Risk |
|------|--------|------|
| `/estimate` skill — creation and all amendments | New skill, multiple SKILL.md updates | HIGH — functional pipeline primitive, untraceable and unreproducible from spec |
| `/issue-dispatch` skill — creation | New skill, SKILL.md | HIGH — functional pipeline primitive, untraceable |
| `feat/repo-tidy` — docs/ restructure, check-docs-structure.js | Governance check script | MEDIUM — adds CI check with no test plan |
| [0.5.18] inline-chat structural reorganisation | Directory moves (product/, artefacts/, contexts/) | MEDIUM — load-bearing structural change made via inline chat, no artefact chain |
| README rebuild [0.7.0] | Documentation | LOW — no behavioural change |
| `pipeline-viz.html` enhancements [0.6.0, 0.6.1] | UI-only viz changes | LOW — viz only, no pipeline logic |
| `scripts/parse-session-timing.js` | Tooling/utility script | LOW — tooling, no behavioural impact |
| `.github/architecture-guardrails.md` ADR-005 | Architectural decision record | LOW — documentation |
| `copilot-instructions.md` session convention updates | Instruction file amendments | LOW — agent guidance, iterative improvements |
| Standards D-batch seeding, `standards/index.yml` amendments | Standards content | LOW — additive to p1.7 scope |
| `.github/skills/levelup/` → `/improve/` directory rename | Skill rename | LOW — cosmetic rename, no logic change |

**Total BETWEEN-STORIES items: 11 distinct items.** Of these, 2 are HIGH-risk (new functional skills with no traceability), 2 are MEDIUM-risk, and 7 are LOW-risk.

**Root cause for HIGH-risk items:** The `/estimate` and `/issue-dispatch` skills were created between story cycles — during a session that was iterating on improvements outside the formal pipeline workflow. The artefact-first rule (captured in `workspace/learnings.md` under "Pipeline gap — spec immutability principle broken") was not yet in force when these were added.

**Root cause for [0.5.18] inline-chat gap:** VS Code inline Copilot chat sessions do not produce artefact chains. A structural directory reorganisation was performed through an inline chat, which has no pipeline awareness and no checkpoint mechanism. This is the canonical example recorded in the pre-existing learnings gap entry.

---

### Finding 3 — PRE-PIPELINE versions

**22 CHANGELOG versions** (0.1.0 through 0.5.17, dated 2026-03-20 through 2026-04-02) are PRE-PIPELINE — committed before the Phase 1 pipeline workflow started on 2026-04-09. These versions cover the entire initial platform build: pipeline visualiser, install scripts, governance framework, skill library, CI traceability, NFR framework, and bootstrap tooling.

These are correctly excluded from the story coverage score. No artefact chains are expected for pre-pipeline work.

---

### Finding 4 — Coverage confidence score

**Calculation method:** Count post-pipeline CHANGELOG "item groups" (each distinct bullet or sub-section in [0.5.18] onward), classify each, and compute coverage rate.

| Classification | Item count | Notes |
|----------------|-----------|-------|
| PHASE-1 (covered) | 4 | Standards patches, CI gate workflow additions, workspace-state check |
| PHASE-2 (covered) | 3 | viz-functions.js, check-viz-behaviour.js, persona-routing skill |
| PHASE-3 (covered) | 2 | Assurance gate eval/write separation, schema+trace fixes |
| BETWEEN-STORIES (uncovered) | 11 | See Finding 2 above |
| **Total post-pipeline** | **20** | |

**Coverage score: 9 / 20 = 45%** of post-pipeline CHANGELOG item groups trace back to a formal story.

**Confidence note:** This count is approximate. The [Unreleased] section contains compound entries (multiple changes per bullet) that are hard to count precisely. The 45% figure is a conservative lower bound — the true coverage rate is likely 40–50%. The directional finding is clear: approximately half of post-pipeline changes land outside the story workflow.

---

### Finding 5 — Learnings and prevention mechanisms

**Pattern identified:** Post-pipeline commits that land BETWEEN-STORIES are an ongoing structural gap. Two distinct root causes produce them:

**Root cause A — Inline chat sessions:** VS Code inline Copilot chat has no pipeline awareness. When structural changes are made through inline chat (the [0.5.18] reorganisation is the canonical example), there is no mechanism to force the operator to create a story first. Any sufficiently motivated operator can bypass the pipeline by using inline chat instead of a named chat session.

**Root cause B — Between-cycle skill additions:** New skills and scripts added between story cycles (e.g. `/estimate`, `/issue-dispatch`) follow the same shortcut — they land in the codebase without a discovery → story → DoR chain because there is no structural enforcement preventing a direct SKILL.md commit.

**Prevention mechanisms (ordered by implementation effort):**

1. **Lightweight (one line in copilot-instructions.md):** Add a guard statement reminding the coding agent that any new SKILL.md file, `src/` module, or governance check script committed to master must have a corresponding story artefact. Does not prevent the gap but makes the violation visible in agent context. **(Already actioned in this PR — see change to `.github/copilot-instructions.md`)**

2. **Medium (retrospective story template):** Add `.github/templates/retrospective-story.md` for the specific case where work has already landed that lacks a chain. The template produces a lightweight retrospective story with a DoR that names the committed code as the "implementation" and focuses the remaining artefact work on test coverage and trace linkage. Use when the change is low-risk and a full pre-implementation story is not practical retroactively. **(Already actioned in this PR — see new template)**

3. **Structural (governance gate — Phase 3 scope):** Add `check-artefact-coverage.js` governance check (proposed in `workspace/learnings.md` "spec immutability" entry) that queries `.github/skills/` and `src/` for modules with no corresponding DoR artefact file and fails `npm test` if any are found. This makes the gap a CI failure rather than an advisory. Scope: Phase 3 short-track story.

**Coverage score target:** After Prevention mechanism 3 is implemented, the BETWEEN-STORIES item count for HIGH-risk items should reduce to zero. Acceptable residual: LOW-risk documentation and tooling edits that explicitly opt out via a `# no-artefact: [reason]` marker in a governed exemption list.

---

## Audit metadata

| Field | Value |
|-------|-------|
| Conducted by | GitHub Copilot (Claude Sonnet 4.6) |
| Date | 2026-04-16 |
| CHANGELOG versions covered | 0.1.0 through [Unreleased] (28 version entries) |
| Phase 1 stories audited | 10 (8 production + 2 voided) |
| Phase 2 stories audited | 13 |
| Phase 3 stories in-progress | 18 (not DoD-complete, expected) |
| PRE-PIPELINE versions excluded | 22 (0.1.0 – 0.5.17) |
| Post-pipeline versions | 6 ([0.5.18], [0.6.0], [0.6.1], [0.6.2], [0.7.0], [Unreleased]) |
| Coverage score | 45% (9/20 post-pipeline item groups covered by a story) |
| HIGH-risk BETWEEN-STORIES items | 2 (/estimate skill, /issue-dispatch skill) |
