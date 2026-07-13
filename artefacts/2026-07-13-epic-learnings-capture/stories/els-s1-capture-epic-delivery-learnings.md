## Story: Capture delivery-pattern learnings from the beta-readiness-infra and team-identity-roles epics

**Epic reference:** None — short-track
**Discovery reference:** None — short-track (post-DoD `/improve` extraction, not a new feature)
**Benefit-metric reference:** None — short-track

## User Story

As an **operator running future epics through this pipeline**,
I want **the two real bugs and the recurring dispatch-verification gap found during the beta-readiness-infra and team-identity-roles epics to be written into the standing guardrails and CLAUDE.md conventions**,
So that **future coding-agent dispatches inherit these lessons automatically instead of relying on an operator remembering to repeat verbal instructions each time**.

## Benefit Linkage

**Metric moved:** None (this is post-DoD `/improve` process capital, not a benefit-metric-tracked feature) — the mechanism is the platform's own "self-improving harness" success outcome (`product/mission.md` §5: "the improvement loop surfaces proposed... diffs... with failure evidence, rationale").
**How:** Two real, merged-code bugs (tir-s7, tir-s8) both shipped with 100%-passing test suites because the tests proved "a function got wired" or "the mock behaves as expected" rather than "the wired function is behaviourally correct" or "the mock matches the real adapter's actual response shape." A third pattern — coding agents reporting completion without having actually run `git commit`/`push`/PR-create — recurred on 4 of 8 dispatches in the `team-identity-roles` epic alone. Writing these into CLAUDE.md and `architecture-guardrails.md` means the next epic's coding agents and DoR checks inherit the lesson structurally, not by an operator repeating it in every dispatch prompt.

## Architecture Constraints

- This story only modifies `CLAUDE.md` and `.github/architecture-guardrails.md` (both governed under the Platform Change Policy — PR required, not direct commit) plus one `workspace/proposals/` file (per the `/improve` skill's own rule: SKILL.md behaviour changes are never edited directly, only proposed for PR-based review).
- No `src/` or application code is touched — this is a pure instruction/guardrail-file story.
- **D37:** not applicable — no injectable adapter is introduced.

## Dependencies

- **Upstream:** None.
- **Downstream:** None — this feeds forward into future stories' DoR checks and coding-agent dispatch prompts, not into any specific downstream story.

## Acceptance Criteria

**AC1:** Given `CLAUDE.md`'s existing "Injectable adapter rule (D37)" section, When this story ships, Then it gains an explicit fourth mandatory point requiring wiring tests to assert behavioural correctness of the wired implementation (e.g. "two different people resolve to two different values"), not just that a function reference was assigned.

**AC2:** Given `CLAUDE.md`'s existing coding standards, When this story ships, Then a new rule exists requiring that when a new adapter/fetch call reuses an *existing* adapter for a *new* purpose, the test's mock must be checked against that adapter's real, currently-wired production response shape before being trusted.

**AC3:** Given `CLAUDE.md`'s session conventions, When this story ships, Then a new rule exists requiring that after any coding-agent subagent reports task completion, the dispatcher independently verifies actual git state (`git status`/`git log`) and PR existence (`gh pr list`/`gh pr view`) before treating the report as ground truth — not trusting the agent's self-reported narrative alone.

**AC4:** Given `.github/architecture-guardrails.md`'s existing Anti-Patterns table, When this story ships, Then it gains a new row for "Trusting a coding agent's self-reported completion instead of verifying git/PR state directly" (mirroring AC3), matching the table's existing format exactly (Anti-pattern | Reason | Approved alternative).

**AC5:** Given the `/estimate` E1/E2 prompt's existing skip-handling (`skills/discovery/SKILL.md`, `skills/definition/SKILL.md`), When this story ships, Then a `workspace/proposals/` file exists (not a direct SKILL.md edit) proposing that any operator reply which does not literally match `/estimate` should still be treated as an explicit skip — writing the required `null` marker to `workspace/state.json` — rather than silently leaving no record that the prompt was ever surfaced. Confirmed via this session's own gap: `team-identity-roles`'s estimate prompt was surfaced but never explicitly answered, and no `null` marker was ever written, per the skill's own current instruction.

## Out of Scope

- Any change to `src/` application code, `pipeline-state.schema.json`, or any test file under `tests/` beyond the one new content-verification test this story adds.
- Automatically editing `skills/discovery/SKILL.md`/`skills/definition/SKILL.md` directly — per `/improve`'s own rule, this is a proposal only, requiring separate human-reviewed PR-based adoption.
- Re-litigating or expanding the DATABASE_URL-gated-test pattern beyond documenting it as an approved pattern already validated twice (`bri-s2.2`, `tir-s6`) — no new test infrastructure is built here.

## NFRs

- **Performance:** Not applicable — documentation-only content change.
- **Security:** Not applicable.
- **Accessibility:** Not applicable.
- **Audit:** The two originating bugs (tir-s7, tir-s8) and this story's own decision to capture them are already logged in `artefacts/2026-07-09-team-identity-roles/decisions.md` and `dod/tir-s7-dod.md`/`dod/tir-s8-dod.md` — this story's own `decisions.md` cross-references those rather than duplicating the narrative.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
