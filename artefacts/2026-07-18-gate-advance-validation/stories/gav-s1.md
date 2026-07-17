# Story: Extend gate-advance structural validation to all 7 canonical gate names

**Epic reference:** None — short-track (bounded refactor, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the gap surfaced during `/definition-of-done` on the product-rollup epic (2026-07-16-product-rollup) and confirmed via `/improve`
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As **an operator or coding agent advancing a story across a gated stage boundary**,
I want **`skills gate-advance` to actually validate the relevant artefact for every one of the 7 canonical gate names in `src/enforcement/gate-map.js`, not just one**,
So that **every documented gate boundary genuinely blocks a bad state advance on a missing or malformed artefact, instead of silently falling back to an unvalidated direct `advance` call or failing with `UNSUPPORTED_GATE`**.

## Benefit Linkage

**Metric moved:** Governance gate integrity — the fraction of `gate-map.js`'s 7 documented gate boundaries that are actually structurally enforced by `gate-advance`, not just documented.
**How:** Today, `src/enforcement/cli-outer-loop.js`'s `validate()` only implements `SUPPORTED_GATES = ['definition-of-ready']` — a string that doesn't even match any of `gate-map.js`'s own 7 canonical gate names (the closest, `dor-signed-off`, is a different string entirely). This means 0 of the 7 documented gate boundaries are reliably enforceable via `gate-advance` today; CLAUDE.md's cdg.7 mandate ("use gate-advance... rather than calling advance directly") is currently unactionable for 6 of 7 boundaries and silently mismatched for the 7th. Closing this gap means a story can no longer advance past `definition-of-done`, `branch-complete`, or any other gated boundary without its artefact actually being checked.

## Architecture Constraints

- CLAUDE.md's cdg.7 rule ("skills gate-advance mandate") names the 7 gate boundaries this story must cover: `discovery-approved`, `benefit-metric-active`, `definition-complete`, `test-plan-complete`, `dor-signed-off`, `branch-complete`, `definition-of-done`.
- `src/enforcement/gate-map.js` is the frozen, existing registry of these 7 names — this story does not change its shape or add new gate names, only makes `validate()` actually handle each one.
- `src/enforcement/cli-outer-loop.js`'s existing H1–H9 checks (the only currently-implemented gate, under the mismatched name `definition-of-ready`) are the established pattern for what "structural validation" looks like — read artefact content, check required sections/fields are present and non-blank, return a typed exit code per failing check. New gate checks should follow this same shape (read artefact, check structure, typed failure) rather than inventing a different validation style.
- Path traversal guards (OWASP A01) already present in `validate()` and `gateAdvance()` must be preserved unchanged for every new gate branch — no new artefact-path resolution logic that bypasses the existing `resolvedPath.startsWith(repoRoot + sep)` check.

## Dependencies

- **Upstream:** None.
- **Downstream:** None directly, but every future feature's `/definition-of-ready`, `/branch-complete`, and `/definition-of-done` runs benefit once this ships — gate-advance becomes a trustworthy enforcement point instead of a partially-implemented one.

## Acceptance Criteria

**AC1:** Given `validate()` currently only recognises the literal gate name `'definition-of-ready'` (which matches none of `gate-map.js`'s 7 canonical names), When `skills gate-advance <feature> <story> dor-signed-off <dor-artefact>` is called using the canonical name, Then it runs the exact same H1–H9 checks as the existing `'definition-of-ready'` path — both names remain accepted (the existing string is not removed, avoiding a breaking change for any existing caller), and both resolve to identical validation logic.

**AC2:** Given a `discovery.md` artefact, When `skills gate-advance <feature> <story> discovery-approved <discovery-artefact>` is called, Then validation passes only if the artefact contains non-blank `Problem Statement`, `Who It Affects`, `Why Now`, `MVP Scope`, and `Out of Scope` sections, and an `## Approved By` line naming a real person (not blank, not a placeholder like `[FILL IN]` or `TBD`).

**AC3:** Given a `benefit-metric.md` artefact, When `skills gate-advance <feature> <story> benefit-metric-active <benefit-metric-artefact>` is called, Then validation passes only if at least one Tier 1 metric is defined with non-blank `What we measure`, `Baseline`, `Target`, and `Measurement method` fields.

**AC4:** Given a feature's story artefacts, When `skills gate-advance <feature> <story> definition-complete <a-story-artefact-path>` is called, Then validation passes only if the named story artefact has a populated `Acceptance Criteria` section with at least 3 ACs, a populated `Out of Scope` section, and a `Complexity Rating` field with a value of 1, 2, or 3.

**AC5:** Given a `test-plan.md` artefact and its referenced story, When `skills gate-advance <feature> <story> test-plan-complete <test-plan-artefact>` is called, Then validation passes only if every `AC[n]` marker present in the referenced story also appears somewhere in the test plan's AC Coverage table (reusing the existing H3/H8 coverage-check logic, generalised to run standalone rather than only as part of the DoR chain).

**AC6:** Given a story's `pipeline-state.json` entry, When `skills gate-advance <feature> <story> branch-complete <artefact-path>` is called, Then validation passes only if the story has a non-empty `prUrl` (or equivalent PR reference field) and `verifyStatus: "passed"` recorded in `pipeline-state.json` at the time of the call.

**AC7:** Given a `dod/[story-slug]-dod.md` artefact, When `skills gate-advance <feature> <story> definition-of-done <dod-artefact>` is called, Then validation passes only if every AC row in the artefact's `AC Coverage` table is marked ✅ or ⚠️ with a non-blank Deviation note — a blank, missing, or ❌ row without a recorded deviation fails validation.

## Out of Scope

- Redesigning `gate-map.js`'s own registry structure, or adding/removing gate names from the canonical 7 — this story only makes `validate()` capable of handling the existing 7.
- Wiring `gate-advance` calls into every SKILL.md's own step-by-step instructions so it's actually invoked in practice during normal skill runs — confirmed during this story's own discovery that no SKILL.md currently instructs an agent to call `gate-advance` with any gate name at all; that adoption work is a separate follow-up once the validation logic itself exists.
- The dashboard/viz "governance-sync" gate concept (`'.github/governance-gates.yml'` + `DEFAULT_GOVERNANCE_GATES` in `pipeline-viz.html`) — confirmed unrelated during investigation; a completely separate gate-ID system for the visual kanban dashboard, not `gate-advance`'s CLI validation.
- Any change to `bin/skills advance` (the non-gated direct-write path) — that remains valid for non-gate-boundary field updates per cdg.7, unchanged by this story.

## NFRs

- **Performance:** Not applicable — this is CLI/tooling validation, not a runtime hot path. Each check reads a small number of Markdown/JSON files synchronously, matching the existing H1-H9 checks' cost profile.
- **Security:** Path traversal guards (OWASP A01) must be preserved for every new artefact-path resolution added by this story — verified by a dedicated test per new gate, not just the existing `definition-of-ready` path's test.
- **Accessibility:** Not applicable — no UI surface.
- **Audit:** Every validation failure must produce a clear, typed stderr message naming which specific check failed and why (matching the existing H1–H9 message convention: `H[n] FAIL: <specific reason>`), so a caller can diagnose without reading source code.

## Complexity Rating

**Rating:** 3 — high ambiguity. Six of the seven gate checks require designing new structural-validation criteria from scratch (this story proposes concrete AC-level criteria for each, but real edge cases in artefact shape may surface during implementation that require adjusting the exact check logic). `gate-map.js` is also currently unconsumed by any real caller (confirmed via repo-wide search), so this story is building validation logic for a mechanism not yet exercised in practice anywhere.
**Scope stability:** Unstable — the exact validation criteria for AC2–AC6 (what counts as "non-blank," which fields are truly mandatory vs advisory) may need refinement once implementation surfaces artefacts that don't cleanly fit the proposed checks.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
