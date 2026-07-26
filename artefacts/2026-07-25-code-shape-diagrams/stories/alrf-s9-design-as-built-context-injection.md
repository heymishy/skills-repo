# Retrospective Story: feed as-built Data Model / System Architecture into /design's system prompt

**Story ID:** alrf-s9
**Retrospective audit date:** 2026-07-26
**Risk classification:** LOW (additive, read-only context injection; falls back to no-op when nothing exists to show; scoped to `/design` only)

**Epic reference:** `artefacts/2026-07-25-code-shape-diagrams/epics/csd-e1-code-shape-diagrams.md`
**Parent question:** raised by the operator — does the Data Model/System Architecture visualisation in `/design` need a tie-in to the product's existing schema/architecture from previous feature runs, since a new feature may extend an existing product rather than starting fresh?

## What was delivered

`skills/design/SKILL.md`'s Data Model diagram markers section (csd-s4) already states the correct intent: "existing entities the feature touches, even with no schema change" must appear in the as-designed diagram, specifically so drift can be checked against the full picture of what the feature relies on, not just its own delta. But `/design` is a conversational skill with no mechanism feeding it the product's *real* current schema/architecture before it draws — it relied entirely on the operator's own recall or the model's inference, exactly the "describe from memory what already exists" anti-pattern the as-built generators (csd-s5's `migration-schema-parser.js`, csd-s7's `service-call-detector.js`) were explicitly built to reject.

Those as-built generators already solve the "cumulative across every prior feature run" problem correctly on their own side — `discoverMigrationFiles`/the service-call scanner re-read the *whole* product's real `scripts/migrate-schema-*.js` files and `src/` require-graph every time, never scoped to one feature's slug (the `featureSlug` argument only controls where the *output* is saved). The gap was one-directional: nothing fed that already-correct snapshot back into `/design`'s own context.

**Fix:** `routes/skills.js`'s `buildSystemPrompt()` gains a new section (3.6), scoped to `skillName === 'design'` only: calls `generateAsBuiltDataModelDiagram({repoRoot})` and `generateAsBuiltSystemArchitectureDiagram({repoRoot})` (the same read-only generators csd-s5/csd-s7's routes already use) and injects their mermaid output as labelled context sections, right before the reference-materials/handoff-context sections. Never calls `writeAsBuiltDiagramArtefact` — starting a `/design` session has no side effect of creating a new versioned artefact file. Both generator calls are individually wrapped in try/catch: a brand-new product with no migrations/services yet is not an error, it just has nothing to show, and any generation failure is silently skipped rather than blocking session creation.

## Benefit Linkage

**Metric moved:** closes the loop between two halves of csd-e1 that already existed but didn't talk to each other — `/design`'s as-designed diagram can now be grounded in the real current product state (for multi-run products) rather than memory, directly serving csd-e1's benefit-metric.md P1/P2 (time-to-drift-determination, diagram completion rate), since a diagram drawn from real context is far less likely to omit or misrepresent an existing entity the feature actually touches.

## Acceptance Criteria

**AC1 — a `/design` system prompt includes the real product's as-built Data Model**
Status: MET — `tests/check-alrf-s9-design-as-built-context.js` AC1, verified against this repo's own real `scripts/migrate-schema-*.js` files.

**AC2 — a `/design` system prompt includes the real product's as-built System Architecture**
Status: MET — AC2.

**AC3 — scoped to `/design` only; other skills (e.g. `/discovery`) do not get this section**
Status: MET — AC3.

**AC4 — a product with no migrations yet degrades gracefully (no throw, session still builds, just without the section)**
Status: MET — AC4.

**AC5 — read-only: building a `/design` system prompt never writes a new versioned as-built artefact file as a side effect**
Status: MET — AC5.

**AC6 — no regression to existing `buildSystemPrompt` behaviour for other skills/scenarios**
Status: MET — `check-icv-s1-ideate-canvas-turn2-render-fix.js` (3/3), `check-iwu5-lens-complete.js`, `check-iwu6-skillmd.js` (15/15), `check-psh-s10-standards-injection.js` (8/8), `check-psh-s5-context-injection.js` (9/9), `check-sdg2-journey-persistence.js` (8/8), `check-wucp3-tool-executor.js` (21/21) all pass unchanged. `check-ougl1-buildsystemprompt-handoff.js`'s T1.6 and `check-wucp1-context-autoloader.js`'s 4 failures confirmed via `git stash` to be pre-existing, identical with or without this change.

## Out of Scope

- Feeding the as-built snapshot into `/definition` or any other skill besides `/design` — the operator's question and `SKILL.md`'s own stated intent were specifically about `/design`'s diagram-drawing step.
- A UI affordance showing the operator which as-built content was fed into context (currently invisible, system-prompt-only) — could be a future enhancement if operators want to see/verify what grounding the model received.

## Traceability Linkage

**DoR artefact:** not written — retrospective story, same convention as this session's other same-day fixes
**Test plan:** `tests/check-alrf-s9-design-as-built-context.js` (8 ACs, all passing)
**DoD artefact:** not yet written
