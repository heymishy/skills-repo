## Epic: Inner Loop Skill Reliability — Phase 1 (Consumer-Reported Gaps)

**Discovery reference:** artefacts/2026-05-18-skill-robustness-improvements/discovery.md
**Benefit-metric reference:** artefacts/2026-05-18-skill-robustness-improvements/benefit-metric.md
**Slicing strategy:** Risk-first — highest-impact gap first (git fetch hang is most disruptive: results in full session loss); DoD message and Step 6 follow.

## Goal

When this epic is complete, pipeline consumers can run the full `/branch-complete → /definition-of-done` inner loop in any local-only or network-constrained repository without session loss, and any operator — including those new to the pipeline — can resolve a pre-merge DoD invocation and complete an infrastructure story DoD run without confusion or dead time.

## Out of Scope

- Automated infrastructure-story detection via slug patterns or name heuristics (fragile, repo-specific — rejected in discovery review of issue #344).
- Adding YAML frontmatter to test plan templates for test count mismatch detection (requires separate discovery due to template schema change risk — deferred to Phase 2).
- Commit message template generation (Issue #8 in #344 — low value, rejected in discovery).
- Changing the `git fetch` pattern in any skill other than the three named in this epic (`/branch-complete`, `/implementation-plan`, `/subagent-execution`).
- Adding a new `measurementReady` field to story artefacts or pipeline-state.json schema (operator-question approach is sufficient for Phase 1).

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1 — Inner loop hang-free rate on no-origin repos | 0% — hangs indefinitely | 100% — fallback path completes with a warning | sri.1 wraps git fetch in all 3 skills with timeout + fallback chain |
| M2 — DoD entry condition actionability (3 elements present) | 0 of 3 elements | 3 of 3 elements | sri.2 rewrites the entry condition block with PR status check, next steps, and gate rationale |
| M3 — Infrastructure story DoD Step 6 completion time | >2 minutes, no satisfactory outcome | <30 seconds, records `not-yet-measured` | sri.3 adds measurement-ready gate as first Step 6 question |

## Stories in This Epic

- [ ] sri.1 — Add git fetch timeout and fallback in `/branch-complete`, `/implementation-plan`, `/subagent-execution`
- [ ] sri.2 — Expand `/definition-of-done` entry condition message with actionable guidance
- [ ] sri.3 — Add measurement-ready gate to `/definition-of-done` Step 6 for infrastructure stories

## Human Oversight Level

**Medium** — All three changes are modifications to governed SKILL.md files under `.github/skills/`. Platform change policy requires PR with platform team review before merge. Coding agent may implement and open a draft PR; a human must review before merge.
