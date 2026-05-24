# Story cdg.7 — Gated advance: validate-before-write for stage transitions, and web UI adapter wiring

**Feature slug:** 2026-05-19-cli-deterministic-governance
**Story ID:** cdg.7
**Epic:** cdg-phase2-advance-and-trace
**Short-track:** Yes — new command + adapter refactor. Bounded scope with no new dependencies.
**Created:** 2026-05-24
**Priority:** High — closes the trust gap for stage-boundary state writes (VS Code + web UI both covered)
**Complexity:** 2 — Well understood design, but `pipeline-state-writer.js` refactor requires care around two-write sequencing.
**Scope stability:** Stable
**Benefit linkage:** M4 — Schema violation rate on CLI-written state writes; M2 — Deterministic state write rate (stories using gated advance for stage transitions)

---

## User story

As a platform operator or platform maintainer,
I want stage-boundary pipeline state writes to be blocked unless the corresponding artefact passes a deterministic `skills validate` check first,
So that pipeline-state.json can never record a stage transition (e.g. `dor-signed-off`, `branch-complete`) for an artefact that has not passed its gate — regardless of whether the write comes from the CLI or the web UI.

---

## Background

cdg.3 and cdg.6 deliver a reliable `skills advance` CLI. The remaining trust gap is: nothing forces validate to pass before state is written. An agent (or a web UI handler) can call `advance` with `stage=dor-signed-off` while the DoR artefact has structural failures — the state writes, the stage advances, and the violation is invisible.

"Tolerable is good enough" is not acceptable for state writes and gate checks. The fix is a gated variant of advance that enforces validate-first as a structural property, not a discipline expectation.

Two surfaces need this:

**CLI (VS Code):** A new `skills gate-advance` subcommand. Runs validate, then advance. If validate is non-zero, the state write is blocked. The agent calls `gate-advance` for stage transitions and `advance` for status-only updates.

**Web UI adapter:** `pipeline-state-writer.js` currently has its own partial enum validation and inline story lookup that misses epic-nested stories (the gap cdg.6 fixed in `cli-advance.js` but not in the adapter). The adapter must delegate story-level writes to `advance()` so all write paths use the same validated, proto-guarded, enum-checked logic.

A new `src/enforcement/gate-map.js` file records the static mapping of gated stage values to gate names — a machine-readable registry of which stages require artefact validation.

---

## Acceptance criteria

### AC1 — `skills gate-advance` blocks write when validate fails
Given `node bin/skills gate-advance <feature-slug> <story-id> <gate-name> <artefact-path> [field=value...]` is called,
And `skills validate <artefact-path> <gate-name>` would exit non-zero (any exit code 1–8),
When `gate-advance` runs,
Then it exits with the same non-zero code that validate would have returned,
And pipeline-state.json is not modified.

### AC2 — `skills gate-advance` writes state when validate passes
Given `skills validate <artefact-path> <gate-name>` would exit 0,
When `gate-advance` is called with one or more `field=value` pairs,
Then it calls `advance()` with those pairs and exits 0,
And the field values are written to pipeline-state.json as `advance()` would write them.

### AC3 — `skills gate-advance` exits with usage error on missing required args
Given `gate-advance` is called with fewer than 4 positional arguments (feature-slug, story-id, gate-name, artefact-path),
When the command runs,
Then it exits with code 8,
And stderr contains a usage message naming the 4 required positional arguments.

### AC4 — `src/enforcement/gate-map.js` exports the gated-stage registry
When `require('./gate-map')` is called,
Then it returns an object with exactly 7 keys, one for each gated stage value:
`discovery-approved`, `benefit-metric-active`, `definition-complete`, `test-plan-complete`, `dor-signed-off`, `branch-complete`, `definition-of-done`,
And each value is an object with a `gate` string property naming the validate gate to apply.

### AC5 — `pipeline-state-writer.js` delegates story-level writes to `advance()`
Given the web UI calls the factory-created writer with a `storyId` and one or more story-level field values,
When the writer runs,
Then it calls `advance(featureSlug, storyId, pairs, repoRoot)` from `cli-advance.js` for the story-level write,
And if `advance()` returns a non-zero exit code, the writer throws with the stderr message,
And the writer correctly updates epic-nested stories (inheriting the cdg.6 lookup fix via `advance()`),
And the factory signature and public interface are unchanged.

### AC6 — `copilot-instructions.md` mandates gate-advance for stage transitions
When reading `.github/copilot-instructions.md`,
Then it contains a rule in the Coding Standards section stating:
- Agent sessions MUST use `node bin/skills gate-advance` when advancing a stage-boundary field (`stage=<gated-value>`)
- `skills advance` (non-gated) remains correct for status/field-only updates that do not involve a stage transition
- The 7 gated stage values are listed explicitly so there is no ambiguity about which advances require the gated variant.

---

## Out of scope

- Implementing validate gate rules for gates not yet in `cli-outer-loop.js` — gate-advance calls whatever validate currently supports; if a gate name is unknown, validate exits with its current "unknown gate" error.
- Automatic gate detection from stage value — the caller always specifies the gate name explicitly; no auto-lookup from gate-map in the gate-advance command itself (gate-map is a registry for documentation and tooling, not runtime routing in Phase 2).
- Deep dot-notation (2+ levels) — inherited from cdg.6 scope boundary.
- Changes to `cli-advance.js` or `cli-outer-loop.js` — those modules are consumed, not modified.
- Changes to `.github/pipeline-state.schema.json`.
- Windows `.cmd` wrapper for gate-advance.
