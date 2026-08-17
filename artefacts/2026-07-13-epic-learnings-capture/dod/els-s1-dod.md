# Definition of Done: Capture delivery-pattern learnings from the beta-readiness-infra and team-identity-roles epics

**PR:** #471 (commit `aff7890b`) | **Merged:** 2026-07-13 (commit date `2026-07-13 20:20:11 +1200`; a `chore: post-merge bookkeeping for els-s1` commit `df8a0c2f` follows it directly on master)
**Story:** `artefacts/2026-07-13-epic-learnings-capture/stories/els-s1-capture-epic-delivery-learnings.md`
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|------------|----------|----------------------|-----------|
| AC1 — D37 section gains a fourth mandatory point requiring wiring tests to assert behavioural correctness | Yes | `CLAUDE.md` "Injectable adapter rule (D37)" now reads "four things are mandatory" and includes point 4: "The wiring test must assert behavioural correctness of the wired implementation, not just that a function reference was assigned," citing the tir-s1/tir-s7 origin | `check-els-s1-epic-learnings-capture.js` — U1.1, U1.2, U1.3 (all pass) | None |
| AC2 — new rule requiring mock-shape verification when an adapter is reused for a new purpose | Yes | `CLAUDE.md` "Mock-shape verification when reusing an adapter for a new purpose" section present, citing the tir-s5/tir-s8 origin | `check-els-s1-epic-learnings-capture.js` — U1.4, U1.5 (both pass) | None |
| AC3 — new rule requiring independent verification of coding-agent dispatch completion via `git status`/`git log` and `gh pr list`/`gh pr view` | Yes | `CLAUDE.md` session conventions contain "Verify coding-agent dispatch completion independently — do not trust the agent's self-report," naming both verification mechanisms | `check-els-s1-epic-learnings-capture.js` — U2.1, U2.2, U2.3 (all pass) | None |
| AC4 — `.github/architecture-guardrails.md` Anti-Patterns table gains a matching row for trusting self-reported completion | Yes | Guardrails file line 118 contains the exact row: "Trusting a coding agent's self-reported task completion instead of verifying git/PR state directly \| ... \| After any dispatch reports completion, independently run `git status`/`git log`... and `gh pr list`/`gh pr view`..." Two additional mirrored rows also present (D37 wiring-test anti-pattern; mocking-a-reused-adapter anti-pattern), exceeding the AC's minimum ask | `check-els-s1-epic-learnings-capture.js` — U3.1, U3.2, U3.3 (all pass) | None |
| AC5 — `workspace/proposals/` file proposing broadened skip-handling for the `/estimate` E1/E2 prompt, not a direct SKILL.md edit | Yes | `workspace/proposals/2026-07-13-estimate-skip-marker-improve-proposal.md` exists with all 8 required front-matter fields (`evidence`, `proposed_diff`, `confidence`, `anti_overfitting_gate`, `status: pending_review`, `created_at`, `skill_target`, `source: improve`), grounded in the team-identity-roles estimate-prompt gap named in the story | `check-els-s1-epic-learnings-capture.js` — U4.1, U4.2 x8 (all pass) | None |

## Scope Deviations

None. The story's own "Out of Scope" section explicitly excludes direct edits to `skills/discovery/SKILL.md`/`skills/definition/SKILL.md` (proposal-only, per `/improve`'s rule) and excludes any new test infrastructure beyond the one content-verification test — both honoured as written, not deviations.

## Test Plan Coverage

`check-els-s1-epic-learnings-capture.js`: 20 passed, 0 failed (freshly re-run 2026-08-17). This single content-verification test file covers all 5 ACs across its four check groups (U1: 5 assertions for AC1/AC2, U2: 3 assertions for AC3, U3: 3 assertions for AC4, U4: 9 assertions for AC5), matching the story's own note that no application code or additional test infrastructure is introduced.

## NFR Status

The story marks Performance, Security, and Accessibility not applicable (documentation-only content change). Audit: the story's own `decisions.md` cross-references `artefacts/2026-07-09-team-identity-roles/decisions.md` and the `tir-s7`/`tir-s8` DoD files rather than duplicating the bug narrative — this DoD did not re-verify those upstream artefacts, treating the story's citation as sufficient per its stated NFR approach.

## Metric Signal

No benefit-metric artefact is referenced by this story — it is explicitly short-track, post-DoD `/improve` process capital rather than a benefit-metric-tracked feature. The story's own benefit linkage is qualitative: future coding-agent dispatches and DoR checks inherit the tir-s7/tir-s8/dispatch-verification lessons structurally via `CLAUDE.md` and `architecture-guardrails.md`, rather than requiring an operator to repeat them per dispatch.

## Outcome

**COMPLETE**
**Follow-up actions:** None. The one item requiring further human action — adoption of the `workspace/proposals/2026-07-13-estimate-skip-marker-improve-proposal.md` proposal into `skills/discovery/SKILL.md`/`skills/definition/SKILL.md` — is itself the story's intended deliverable (a proposal awaiting separate PR-based review), not an open gap in this story.

## DoD Observations

All five ACs are backed by live, currently-passing content in `CLAUDE.md`, `.github/architecture-guardrails.md`, and `workspace/proposals/`, confirmed by direct read rather than test output alone. No drift or regression found since the 2026-07-13 merge.
