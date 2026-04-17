# Phase 4 Backlog: Live Agent Delivery Run (non-GitHub-Copilot tooling)

**Story title:** Conduct a live end-to-end skills pipeline delivery run using a non-GitHub-Copilot AI coding agent

**Epic:** E6 — Enterprise adapters and agent validation
**Feature:** 2026-04-14-skills-platform-phase3 / Phase 4 follow-on
**Registered:** 2026-04-18 (as required by p3.9 DoD: AC3)

---

## ASSUMPTION-04 operational confirmation gate

**Gate condition:** This Phase 4 story requires ASSUMPTION-04 operational confirmation before it can proceed to DoR sign-off.

ASSUMPTION-04 (from discovery artefact, 2026-04-14): *AGENTS.md enterprise validation can be conducted against Cursor or Claude Code as a representative non-GitHub tooling. This assumes either tooling is available to the operator for a genuine end-to-end delivery run.*

**Operational confirmation means:** The operator confirms in writing (PR comment or `artefacts/[feature]/decisions.md` entry) that:
1. At least one of Cursor, Claude Code, or Amazon Q Developer is available to the operator for a full agent session (not read-only inspection).
2. The operator has access to a GitHub repo where the agent can open a draft PR.
3. A story from the active backlog (see prerequisites below) has been selected as the delivery vehicle.

Until ASSUMPTION-04 is operationally confirmed, this story must remain in `dorStatus: blocked` in `pipeline-state.json`.

---

## Minimum prerequisites for a live run

### Tools
- **Primary agent:** One of Cursor (Agent mode), Claude Code (CLI), or Amazon Q Developer (CLI) — operator's choice based on availability.
- **Secondary tooling:** GitHub CLI (`gh`) available in the terminal session for PR creation and trace validation.
- **Baseline agent:** GitHub Copilot in VS Code must remain available for the outer loop (reviews, test-plan, DoR) — the live run is inner-loop only.

### Story
- The delivery vehicle story must be Complexity 1 (well understood, clear path), Scope stability: Stable, with a documentation-only or single-module scope.
- The story must have passed full outer loop: review → test-plan → DoR sign-off.
- Suggested candidates from Phase 3 backlog: p3.9 follow-on (tooling config bridging), or a new small story written specifically for this validation run.

### Squad
- Solo operator is acceptable for the first live run (this is a solo personal project).
- If the run is used as evidence for enterprise adoption evaluation, a second observer (or auditor) should witness or review the session transcript.

### Repository
- The live run must take place in a real GitHub repository (not a sandbox), on a feature branch, with a draft PR opened at completion.
- `validate-trace.sh --ci` must pass on the resulting PR branch.

---

## Success criteria

1. The selected agent completes all implementation tasks for the chosen story without switching to GitHub Copilot mid-run.
2. A draft PR is opened with the DoR-specified two-file diff (or equivalent for the chosen story).
3. `npm test` and `validate-trace.sh --ci` both pass on the PR branch.
4. The operator records a signal entry in `pipeline-state.json` for M5 (agent compatibility matrix — live run evidence tier).

---

## Notes

The `docs/agent-compatibility-matrix.md` file produced in p3.9 (Phase 3) is the Phase 3 evidence tier for M5. This Phase 4 live run is the next evidence tier. Both are required for M5 to reach `status: on-track` at Phase 4 gate.
