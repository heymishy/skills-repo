# Review Report: Skill launcher and guided question flow — Run 1

**Story reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.13-skill-launcher.md
**Date:** 2026-05-02
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** FAIL

---

## HIGH findings — must resolve before /test-plan

- **[13-H1]** [C/D — AC quality / Completeness] — AC2 requires presenting "the first question from the skill's question sequence" to the user, but no data source for the skill question sequence is defined anywhere in the story or in the upstream stories it depends on. wuce.11 explicitly excludes this in its Out of Scope: "Presenting skill metadata (description, required parameters) to the UI — the UI in wuce.13 reads skill names only; metadata display is post-MVP." The `-p` flag + `--no-ask-user` architecture (wuce.9) means the CLI does not drive an interactive question sequence — the entire assembled prompt is passed in one shot. The "step-by-step form" questions must therefore come from a source that wuce.13 reads, but that source is undefined. An implementing agent cannot satisfy AC2 without knowing whether questions come from: (a) parsing the SKILL.md file directly, (b) a companion `questions.json` schema file alongside SKILL.md, (c) a metadata endpoint that wuce.11 should but explicitly does not provide, or (d) a hardcoded question list per skill. Without a named data source, the coding agent will invent one — producing an implementation that may be entirely wrong.
  Fix: Add an Architecture Constraint naming the question sequence data source. The most consistent option given the existing ADR-012 adapter pattern is: `listSkillQuestions(skillName, repoPath)` reads the SKILL.md file for the named skill and extracts structured question blocks from a defined section (e.g. `## Questions` or `## Clarifying questions`). This requires updating wuce.11's out-of-scope to allow SKILL.md content reading via a separate adapter call — or scoping that into this story's Architecture Constraints directly. Whichever option is chosen, the data source must be explicit before /test-plan.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

None.

---

## Category Scores

| Category | Score | Pass/Fail | Notes |
|----------|-------|-----------|-------|
| A — Traceability | 5 | PASS | All references present. P2 linkage is direct — "a non-technical stakeholder who can launch /discovery and answer each question in a web form, without assistance, is the direct measurement event for P2". Strongest P2 traceability in the feature. |
| B — Scope integrity | 5 | PASS | Out of scope precisely bounded: artefact rendering deferred to wuce.14, session persistence to wuce.16, launcher supporting all skills with e2e testing only on /discovery. ACP caveat in Architecture Constraints is present and correctly formatted. |
| C — AC quality | 2 | FAIL | AC3 (sanitisation), AC4 (prompt injection), AC5 (subscription check) are well-formed. AC1 (skill list from wuce.11) is testable. AC2 fails: requires a question sequence data source that is not defined — and is explicitly excluded by wuce.11's out-of-scope. The HIGH finding (13-H1) applies here. Score 2 = story rework required. |
| D — Completeness | 4 | PASS | All template fields populated. Named persona (non-technical stakeholder). ACP caveat present. Scope stability marked Unstable — correct for a story that depends on ACP GA. Complexity 3 is appropriate given the multi-dependency chain and prompt injection surface. |
| E — Architecture | 4 | PASS | ADR-012 referenced for the launcher→execution engine call. Security constraints are strong: server-side skill name allowlist validation, server-side prompt sanitisation, length limits server-side. Subscription detection mechanism ("failed token validation against the Copilot API") is not further specified but is an implementation detail rather than a design gap. |

---

## Summary

1 HIGH, 0 MEDIUM, 0 LOW.
**Outcome: FAIL** — 13-H1 blocks /test-plan. The question sequence data source is undefined — a direct contradiction with wuce.11's out-of-scope that explicitly excludes metadata/question content. Resolve by either (a) naming a new adapter in wuce.13's Architecture Constraints that reads SKILL.md question content directly, or (b) updating wuce.11 to provide question sequences via an extended `listSkillQuestions` adapter. Decision required before /test-plan can write question-form tests.
