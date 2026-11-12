## Implementation Plan: Self-registration at the moment of deferral

**Story reference:** artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s4-self-registration-at-deferral.md
**Test plan reference:** artefacts/2026-11-08-deferred-decision-follow-through/test-plans/ddft-s4-self-registration-at-deferral-test-plan.md
**DoR reference:** artefacts/2026-11-08-deferred-decision-follow-through/dor/ddft-s4-self-registration-at-deferral-dor.md

---

## Design: how a prose skill instruction becomes mechanically enforced

The real deferral points are `## State update` sections in three SKILL.md files, which an AI agent follows. A prose sentence alone is not enforcement. So each State-update section instructs the agent to run one concrete command, `node scripts/register-deferral.js --hook <name> ...`, and the tests prove both halves: the SKILL.md really references that command (in the State-update section, with the right hook name), and running that exact command as a child process writes a valid `deferred-item` record through `scripts/lib/incident-store.js`. What remains un-enforceable is the agent actually following the instruction at runtime; that is stated plainly in the PR.

## File map

| File | Change |
|------|--------|
| `scripts/lib/deferral-hooks.js` | New. `buildRecords(hook, ctx)` maps a hook context to deferred-item record(s) via `createDeferredItemRecord`; `parseOutOfScope(md)`; `registerDeferral(hook, ctx, file)` appends via `appendIncidentRecord`. Default file `workspace/incidents.json`. |
| `scripts/register-deferral.js` | New CLI the three skills invoke. Flags: `--hook`, `--file`, plus per-hook flags. Exits 1 and writes nothing on invalid input. |
| `skills/discovery/SKILL.md` | Additive sub-step in State update section: run the CLI with `--hook discovery-out-of-scope --artefact <discovery.md> --feature <slug>`. |
| `skills/decisions/SKILL.md` | Additive sub-step: for each RISK-ACCEPT logged, run `--hook risk-accept --decision-ref ... --summary ... --revisit ...`. |
| `skills/definition-of-done/SKILL.md` | Additive sub-step tied to Step 6: for each metric recorded `not-yet-measured`, run `--hook unmeasured-benefit-metric --metric ... --evidence ...`. |
| `tests/check-ddft-s4-self-registration-at-deferral.js` | New. Independent test groups per hook (AC5), runnable singly via argv. |

## Tasks

1. Write failing tests (RED: modules absent).
2. Task A: `scripts/lib/deferral-hooks.js` plus `scripts/register-deferral.js` (the shared mechanism; AC4).
3. Task B: patch discovery SKILL.md (AC1).
4. Task C: patch decisions SKILL.md (AC2).
5. Task D: patch definition-of-done SKILL.md (AC3). `/benefit-metric` stays untouched, asserted by a test.
6. Verify wiring: grep that the CLI is referenced by the three skills and the lib by the CLI; run the real CLI against a temp file; confirm `workspace/incidents.json` unchanged.
7. Full suite `npm test`; compare against known baseline failures.

## Deviation noted

The DoR says three separate PRs (one per governed file). The orchestrator's instruction for this run is one branch and one draft PR; the shared script and tests cannot sensibly be split three ways. Recorded in the PR body.
