# Discovery: /reverse-engineer Reference Artefact Set

**Status:** Approved
**Created:** 2026-04-30
**Approved by:** Hamish (Platform maintainer) — 2026-04-30
**Author:** Copilot (platform maintainer session)

---

## Problem Statement

When `/reverse-engineer` completes an extraction, it produces a human-readable reverse-engineering report. This report has no machine-readable structure that downstream pipeline skills or coding agents can consume without manual reformatting. After every extraction, the operator must:

- Manually translate PARITY REQUIRED rules into discovery constraints when starting a new feature that touches the legacy system — re-reading a potentially large report each time.
- Re-describe system behaviour to a coding agent when writing DoR artefacts for stories touching legacy-adjacent code, because no structured constraint reference exists.
- Manually brief `/modernisation-decompose` with system context rather than handing it a structured input derived from the corpus.
- Detect when the reference has become stale after a feature changes the system — there is currently no lightweight mechanism to do this without re-running the full extraction.

This makes the extraction's value depreciate: the longer after the extraction a feature is written, the less the team can leverage it, and the more likely it is that a coding agent will violate a legacy constraint that was documented but not surfaced in context.

The `/reverse-engineer` v2 evolution (2026-04-30) introduced the right vocabulary and corpus-management protocol (pass types, corpus-state.md, outcome A/B/C routing) to build structured reference outputs on top of. Those outputs are now explicitly called out in the completion statement but are not yet produced.

---

## Who It Affects

**Platform maintainer (Hamish):** Runs `/reverse-engineer` on legacy codebases as part of modernisation programme scoping and feature-change reference work. Currently must manually re-read the full report each time a new discovery is started. Benefits from a pre-populated discovery seed that eliminates this translation step.

**Tech lead / squad lead:** Writes DoR artefacts and story constraints for features touching legacy-adjacent code. Currently has no structured reference for "rules this story must not break." Benefits from a constraint index that can be pointed to in the DoR without requiring a full report read.

**Coding agents (inner loop):** Receive story DoR artefacts. Currently have no direct pointer to known legacy constraints. With a constraint index in the DoR, agents can read a bounded constraint set without needing the full report in context.

**Developer (secondary):** Implementing a story that touches legacy-adjacent code. Benefits from the constraint index surfaced in the DoR at story start rather than discovering constraints by reading the full report or breaking them in implementation.

---

## Why Now

The `/reverse-engineer` v2 evolution landed on 2026-04-30 and explicitly calls out Outputs 9 and 10 (discovery seed and constraint index) as the next natural extension in its completion statement and further enhancement notes. The corpus-management protocol (`corpus-state.md`, pass types, convergence criterion) is now stable enough to build reference output formats on top of. Any further delay means the v2 skill evolution ships without the reference outputs that make it most useful in practice.

Additionally, the state.json checkpoint from 2026-04-28 records an "artefacts/baseline/" concept signal that aligns directly with this feature — a durable versioned reference corpus representing current known implementation state, distinct from in-flight feature artefacts.

---

## MVP Scope

1. **Output 9 — `/discovery` pre-population seed** (`artefacts/[system-slug]/reference/discovery-seed.md`): produced by `/reverse-engineer` at the end of any INITIAL or DEEPEN pass. Formatted as a partial discovery artefact: problem framing derived from REVIEW-disposition rules, known constraints block populated from PARITY REQUIRED rules, personas block indicating the legacy system's user types. `/discovery` reads this file if present and surfaces it before asking questions.

2. **Output 10 — Constraint index** (`artefacts/[system-slug]/reference/constraint-index.md`): a flat, machine-readable list of every PARITY REQUIRED and MIGRATION CANDIDATE rule from the corpus. One rule per line: `rule-id | source-file | confidence | disposition | one-sentence summary`. Coding agents can be pointed here in DoR artefacts as "rules this implementation must not break."

3. **`/discovery` integration**: reads `constraint-index.md` from the relevant reference folder if it exists. Surfaces it as a "Known legacy constraints" section in the discovery artefact automatically. Operator can remove or override entries.

4. **`/reference-corpus-update` companion skill**: a lightweight SKILL.md-only skill that, after a feature is delivered, accepts a list of changed source files and produces a scoped DEEPEN pass instruction for the affected rules. Updates `corpus-state.md` with the new `lastRunAt` and a brief change note. Keeps the corpus current without a full re-extraction.

---

## Out of Scope

- **Output 11 (`decompose-input.md` for `/modernisation-decompose`)** — `/modernisation-decompose` has not yet been evolved to consume a structured handoff input. Deferring until that skill is ready to define its input contract. Including it now would produce an output with no consumer.

- **`/ea-registry` auto-contribution output** — the EA registry format and contribution flow are subject to evolution in Phase 5 WS1. Deferring auto-contribution to avoid coupling this feature to an unstable interface.

- **Confidence decay / stale-flag tracking in `corpus-state.md`** — adds meaningful complexity to the corpus protocol. Deferred to a follow-on story once the basic reference outputs are validated in at least one real extraction cycle.

- **Automated insertion of constraint-index entries into story DoR artefacts** — requires tooling (script or structured DoR template integration). Deferred; initial value is achieved by the tech lead manually including a reference pointer in the DoR.

- **Any code or script changes** — all four MVP items are SKILL.md instruction additions only. No new npm packages, no new scripts, no workflow changes.

---

## Assumptions and Risks

1. **Platform maintainers actually re-run /discovery when adding features to legacy-adjacent systems** (unvalidated). If teams start coding without a /discovery run, the seed is never used. Risk: low for this platform (governed outer loop is mandatory), but worth verifying in the first real extraction cycle.

2. **A flat pipe-delimited `constraint-index.md` is machine-readable enough for coding agents** without custom parsing. If coding agents struggle to parse the format, we may need a JSON or YAML index instead. Mitigation: test format with at least one real coding agent session before deciding it is the right format.

3. **`/reference-corpus-update` can stay under 100 lines** (SKILL.md constraint). If the update protocol turns out to be complex enough to require a longer skill file, it may need its own pipeline chain.

4. **`/discovery` can integrate constraint-index.md via a read instruction block** without requiring a code change to the conversational flow. This is a SKILL.md-only assumption — the skill already reads reference materials from `artefacts/[feature]/reference/`.

---

## Directional Success Indicators

- An operator who has a reverse-engineering corpus can start a `/discovery` run for a new feature touching that system without describing the system from scratch — the seed surfaces everything already known.
- A coding agent story touching legacy-adjacent code references the constraint index in its DoR without the tech lead having to re-read the full reverse-engineering report first.
- The reference corpus is updated at least once via `/reference-corpus-update` after a feature is delivered — the corpus survives its first delivery cycle without requiring a full re-extraction.

---

## Constraints

- All MVP items are SKILL.md instruction additions only. No new npm packages. No new scripts. No new workflow steps. This is enforced by the platform artefact-first rule: SKILL.md changes require a story chain, but must not also introduce untested code.
- Output formats (discovery-seed.md and constraint-index.md) must be human-readable as well as machine-parseable — these are living documents that operators will also read directly.
- `/reference-corpus-update` must not require the operator to re-read the full corpus to use it — the value proposition is specifically that it is faster than a full re-extraction.

---

## Contributors

- Hamish — Platform maintainer

## Reviewers

- Hamish — Platform maintainer (self-review; platform evolution cycle)

## Approved By

Hamish — Platform maintainer — 2026-04-30

---

**Next step:** /benefit-metric
