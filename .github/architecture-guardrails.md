# Architecture Guardrails

<!--
  PURPOSE: Single source of truth for architectural standards, design constraints,
  and active repo-level ADRs that apply across all features in this repository.

  This file is READ by:
  - /definition skill (Step 1.5 — Architecture constraints scan before story decomposition)
  - /review skill (Category E — Architecture compliance check)
  - /definition-of-ready skill (H9 — Guardrail compliance hard block)
  - /trace skill (Architecture compliance check in chain validation)
  - Coding agent (Constraints block in DoR artefact — agent must not violate these)

  Per-feature decisions live in artefacts/[feature]/decisions.md
  Structural decisions that constrain future features are promoted to Active ADRs here.

  To evolve: update this file, open a PR, tag tech lead for review.
-->

**Last updated:** 2026-04-12
**Maintained by:** Repo owner (solo)

---

## What This Repo Is

This repository is a **skills-based SDLC pipeline library** — not an application.
It contains:
- `pipeline-viz.html` — single-file HTML/CSS/JS pipeline visualisation tool
- `.github/skills/*/SKILL.md` — agent skill instruction files (Markdown)
- `.github/templates/*.md` — artefact templates (Markdown)
- `.github/pipeline-state.json` + `pipeline-state.schema.json` — live + schema state files
- `.github/scripts/` — Node.js pre-commit hooks and validators
- `artefacts/` — per-feature pipeline artefacts produced during delivery

Architecture guardrails apply to changes to the viz (`pipeline-viz.html`), the schema (`pipeline-state.schema.json`), and any new scripts added under `.github/scripts/`.

Skill files and templates are content, not code — they are governed by pipeline process, not these guardrails.

---

## Pattern Library

**N/A** — no external component library. The viz is intentionally self-contained (no npm dependencies at runtime).

---

## Style Guide

**Viz (`pipeline-viz.html`):**
- All styles live in the inline `<style>` block — no external CSS files
- CSS custom properties (`--var-name`) for all colours and spacing values
- No CSS frameworks (Bootstrap, Tailwind, etc.) — keep the file self-contained
- Class names use kebab-case (`.feature-card`, `.governance-gate`)

**Scripts (`.github/scripts/`):**
- Plain Node.js — no TypeScript, no transpilation
- No external npm dependencies in pre-commit hooks (must run with only `node` available)
- CommonJS modules (`require`) unless the whole repo adopts ESM (see ADR-001)

**Skill and template files (`.github/skills/`, `.github/templates/`):**
- Markdown only — no embedded HTML except HTML comments for instructions
- Follow the established section headings used in existing files
- No trailing whitespace; Unix line endings

---

## Reference Implementations

| Capability | Reference path | Notes |
|---|---|---|
| Feature card rendering | `.github/pipeline-viz.html` — `featureCardHTML()` | Pattern for how state fields map to UI elements |
| Governance gate evaluation | `.github/pipeline-viz.html` — `evaluateGate()` | Pattern for reading state fields and producing pass/warn/fail |
| JSON schema definition | `.github/pipeline-state.schema.json` | All new state fields must be added here before being used |
| Pre-commit validation | `.github/scripts/check-viz-syntax.js` | Pattern for adding new validators |
| Skill structural contracts | `.github/scripts/check-skill-contracts.js` | Defines required markers per skill; extend when adding structural invariants |
| Pipeline artefact path consistency | `.github/scripts/check-pipeline-artefact-paths.js` | Validates writer/reader path links across all skills; update PIPELINE_PATHS when a skill changes its output path |

---

## Approved Patterns

- **Viz architecture:** Single-file HTML — all JS, CSS, and markup inline in `pipeline-viz.html`. No build step. No external runtime dependencies.
- **State access in viz:** Read from the parsed `pipelineState` global — never fetch or import. State is loaded via `<script>` tag injection or `fetch('./pipeline-state.json')`.
- **Gate logic:** Gate pass/fail is determined by reading specific evidence fields from `pipeline-state.json` stories — not by checking `feature.stage` alone (see ADR-002).
- **Schema evolution:** Add new fields to `pipeline-state.schema.json` at the same time as adding them to any skill or viz code that reads or writes them. Schema and implementation stay in sync.
- **Config reading in skills:** Skills read `.github/context.yml` for org/tooling config. Never hardcode tool names, branch names, or org labels in skill instruction text — use `context.yml` fields.

---

## Anti-Patterns

| Anti-pattern | Reason | Approved alternative |
|---|---|---|
| Gate logic that only checks `feature.stage` | Stage can be manually set — produces false passes | Read specific evidence fields (`reviewStatus`, `dorStatus`, `dodStatus`, etc.) |
| Hardcoding org/tool names in skill files | Breaks when context changes; violates configurability | Use `context.yml` fields via the skill's config-reading step |
| External CDN dependencies in viz at runtime | Breaks offline use; supply chain risk | Bundle or inline, or omit |
| Adding fields used by viz/skills but not in schema | Schema becomes stale; validators miss them | Add to `pipeline-state.schema.json` simultaneously |
| Committing changes to `pipeline-viz.html` without passing `check-viz-syntax.js` | Breaks the pre-commit gate silently | Run `node .github/scripts/check-viz-syntax.js` locally before committing |
| Deleting or mutating pipeline artefacts in `pipeline-state.json` directly | Can corrupt feature history | Use skills to write state; manual edits only for scaffolding |

---

## Mandatory Constraints

### Correctness
- All new governance gate logic in the viz must read at least one evidence field from `pipeline-state.json` (not stage alone)
- Any field written to `pipeline-state.json` by a skill must exist in `pipeline-state.schema.json`
- Any field read by the viz from `pipeline-state.json` must exist in `pipeline-state.schema.json`

### Self-containment
- `pipeline-viz.html` must open and render correctly without any build step, server, or network access
- No npm `devDependencies` may be added to `pipeline-viz.html` at runtime; pre-commit scripts may use Node.js built-ins only

### Security
- No user-supplied content is ever injected into innerHTML without sanitisation
- No credentials, tokens, or personal data in `pipeline-state.json` or any committed artefact
- The viz reads local JSON only — no external fetch calls

### Consistency
- When a skill adds or removes a pipeline stage, the `stage` enum in `pipeline-state.schema.json` is updated in the same commit
- When a governance gate is added or removed from `GOVERNANCE_GATES` in the viz, the corresponding skill's SKILL.md is reviewed to confirm the gate criteria matches the skill's actual checks

### Accessibility
- All interactive elements in the viz must be keyboard-accessible
- Colour alone must not be the only indicator of gate pass/fail/warn status (icons or labels must also be present)

---

## Active Repo-Level ADRs

| # | Status | Title | Constrains |
|---|---|---|---|
| ADR-001 | Active | Single-file viz, no build step | `pipeline-viz.html` architecture |
| ADR-002 | Active | Gates must use evidence fields, not stage-proxy | All `evaluateGate()` implementations |
| ADR-003 | Active | Schema-first: fields defined before use | `pipeline-state.schema.json` evolution |
| ADR-004 | Active | `context.yml` is the single config source of truth | Skill files, viz config reading |
| ADR-005 | Active | Agent instructions format is a surface adapter concern driven by `vcs.type` | Assembly script, skill distribution |
| ADR-006 | Active | Approval-channel adapter pattern for non-engineer DoR sign-off | DoR routing workflows, state write path |

---

### ADR-001: Single-file viz, no build step

**Status:** Active
**Date:** 2026-03-22
**Decided by:** Repo owner

#### Context
The viz tool needs to be usable by anyone with a browser and a local clone — no Node, no npm install, no build step. It is a supporting tool for the pipeline, not a product.

#### Decision
`pipeline-viz.html` is a single self-contained file. All JS, CSS, and markup are inline. No external runtime npm dependencies. No bundler (webpack, vite, esbuild).

#### Consequences
**Easier:** Zero setup to open and use. No dependency drift. No build pipeline to maintain.
**Harder / constrained:** No TypeScript, no CSS modules, no component framework. File will be long — acceptable for a tool, not a product.
**Off the table:** React, Vue, Angular. Any approach that requires `npm install` to render.

#### Revisit trigger
If the viz grows beyond ~3000 lines and maintainability is significantly impacted, introduce a simple build step that still produces a single deployable `.html` output.

---

### ADR-002: Governance gates must use evidence fields, not stage-proxy

**Status:** Active
**Date:** 2026-03-22
**Decided by:** Repo owner

#### Context
Early gate implementations checked only `feature.stage >= X` to infer a gate was passed. This allows false passes when a stage is manually set without running the corresponding skill.

#### Decision
Each governance gate's `evaluateGate()` function must read at least one evidence field from the story or feature in `pipeline-state.json` (e.g. `reviewStatus`, `dorStatus`, `dodStatus`). Stage-only checks are permitted as a fallback for gates where no evidence field exists yet, but must be marked with a `// TODO: replace with evidence field` comment.

#### Consequences
**Easier:** Gates accurately reflect skill execution, not just stage progression.
**Harder / constrained:** Skills must write evidence fields. Schema must define them.
**Off the table:** Pure stage-proxy gate logic for any gate that has a corresponding evidence field in the schema.

#### Revisit trigger
If the evidence field approach creates too much write overhead for skills, re-evaluate a hybrid model.

---

### ADR-003: Schema-first — fields defined before use

**Status:** Active
**Date:** 2026-03-22
**Decided by:** Repo owner

#### Context
Audit found multiple fields used by the viz and skills that are absent from `pipeline-state.schema.json`, making them invisible to validators and IDE tooling.

#### Decision
Any new field written to `pipeline-state.json` by a skill, or read by the viz, must be added to `pipeline-state.schema.json` in the same commit. Schema is the contract between skills and viz.

#### Consequences
**Easier:** IDE autocomplete, JSON validation, and audit tooling all work correctly.
**Harder / constrained:** Small additional overhead when adding new state fields.
**Off the table:** Fields used in production code (skills, viz) that are not in the schema.

#### Revisit trigger
If the schema validation tooling is replaced with something not relying on JSON Schema, re-evaluate the schema-first constraint.

---

### ADR-004: `context.yml` is the single config source of truth

**Status:** Active
**Date:** 2026-03-22
**Decided by:** Repo owner

#### Context
Governance audit found org/tool names hardcoded in skill files and the viz having its own governance config disconnected from `context.yml`. Multiple "regulated" signals existed with no bridge.

#### Decision
`.github/context.yml` is the canonical config file. Skills read it for all org-specific labels, tool integrations, compliance frameworks, and regulated-flag status. The viz reads `pipeline-state.json` for feature-level state but must not hardcode values that belong in `context.yml`. Bridges between `context.yml` and the viz state (e.g. regulated default) should be implemented via the pipeline-state write path, not by the viz fetching `context.yml` directly.

#### Consequences
**Easier:** Switching from personal to work context requires one file copy. All downstream config flows from one place.
**Harder / constrained:** Skills need a config-reading step. Viz cannot directly read `context.yml` (browser YAML parsing adds complexity).
**Off the table:** Hardcoded org names, tool URLs, or compliance framework names in skill instruction text or viz JS constants.

#### Revisit trigger
If the viz gains a server-side rendering layer, direct `context.yml` reading becomes feasible and should be adopted.

---

### ADR-005: Agent instructions format is a surface adapter concern

**Status:** Active
**Date:** 2026-04-11
**Source decision:** `artefacts/2026-04-09-skills-platform-phase1/decisions.md` — 2026-04-11 ARCH entry (Phase 1 /levelup promotion)
**Decided by:** Hamish

#### Context
The skills platform assembly script must emit agent instruction files that work across GitHub-hosted environments (GitHub Copilot, Codex) and non-GitHub environments (Bitbucket, Jenkins, Cursor, Claude Code). Two competing formats exist: `.github/copilot-instructions.md` (GitHub-specific) and `AGENTS.md` (vendor-neutral, Linux Foundation AAIF standard). A hardcoded output path breaks distribution to non-GitHub inner loop tooling.

#### Decision
Agent instructions file format is an adapter concern resolved by `context.yml`, not a fixed platform output. The assembly script emits `.github/copilot-instructions.md` when `vcs.type` is `github`, and `AGENTS.md` otherwise. Content is identical across formats. `AGENTS.md` is the vendor-neutral standard and any compliant inner loop tooling can consume it.

#### Consequences
**Easier:** Enterprise fleet distribution works without per-platform forks. Inner loop tooling can be swapped without changing skill content.
**Harder / constrained:** Assembly script must branch on `vcs.type`. The `context.yml` schema must expose an `agent_instructions.format` field (or derive it from `vcs.type`).
**Off the table:** Hardcoding `.github/copilot-instructions.md` as the sole assembly output path.

#### Revisit trigger
At Phase 2 p1.1-equivalent story (distribution mechanism) — implement the `agent_instructions.format` adapter in `context.yml` and update the assembly script to branch on `vcs.type`.

---

### ADR-006: Approval-channel adapter pattern for DoR sign-off

**Status:** Active
**Date:** 2026-04-12
**Source decision:** `artefacts/2026-04-11-skills-platform-phase2/decisions.md` — W3-p2.8 resolution entry
**Decided by:** Hamish

#### Context
DoR sign-off must work for non-engineer approvers outside the IDE. Channel-specific implementations (GitHub issue comments, Jira approvals, Confluence workflows, chat commands) should not require rewriting the core DoR state contract.

#### Decision
Adopt an approval-channel adapter pattern. Channel wiring is selected from `.github/context.yml` and implemented in channel-specific adapters. The core write contract remains channel-agnostic and updates `pipeline-state.json` evidence fields (`dorStatus`, `dorApprover`, `dorChannel`). Phase 2 reference path is `approval_channel: github-issue` with `/approve-dor` event handling.

#### Consequences
**Easier:** Add or swap approval channels without changing skill logic or state schema shape.
**Harder / constrained:** Adapter implementations must preserve the same state contract and audit fields across channels.
**Off the table:** Hardcoding one approval channel into DoR skills or workflow logic.

#### Revisit trigger
When adding a new approval surface, verify the adapter preserves the same evidence fields and audit semantics before enabling it in `context.yml`.

---

## Guardrails Registry

<!--
  GUARDRAILS_REGISTRY — Machine-parseable guardrail index.
  
  This block is read by:
  - pipeline-viz.html (Guardrails Compliance sub-panel in governance view)
  - /review skill (Category E checklist)
  - /definition-of-ready (H9 guardrail compliance check)
  - /trace (architecture compliance check)
  
  Each guardrail has a unique ID, category, and short label.
  Skills evaluate each applicable guardrail and write the result to
  feature.guardrails[] in pipeline-state.json.
  
  Categories:
    mandatory-constraint  — from Mandatory Constraints section above
    adr                   — from Active Repo-Level ADRs above
    pattern               — from Approved Patterns above
    anti-pattern          — from Anti-Patterns above
  
  NFR and compliance-framework items are NOT listed here — they come from
  artefacts/[feature]/nfr-profile.md and config.governance.complianceFrameworks
  respectively, and are added dynamically per feature.
  
  Format: YAML block fenced with ```yaml guardrails-registry / ```.
  The viz parses this block from the fetched .md file at runtime.
  
  IMPORTANT: Keep this registry in sync with the prose sections above.
  When you add a new mandatory constraint, ADR, pattern, or anti-pattern
  to the prose sections, add a matching entry here. When you remove or
  supersede one, remove or update the entry here. If this block is stale,
  the Guardrails Compliance Matrix in the pipeline visualiser will not
  reflect the actual guardrails in effect.
  
  The /trace skill can flag mismatches as LOW findings (e.g. an ADR-NNN
  in the ADR table with no matching id: ADR-NNN in this block).
-->

```yaml guardrails-registry
- id: MC-SEC-01
  category: mandatory-constraint
  label: "No user-supplied content in innerHTML without sanitisation"
  section: Security

- id: MC-SEC-02
  category: mandatory-constraint
  label: "No credentials, tokens, or personal data in committed files"
  section: Security

- id: MC-SEC-03
  category: mandatory-constraint
  label: "Viz reads local JSON only — no external fetch calls"
  section: Security

- id: MC-CORRECT-01
  category: mandatory-constraint
  label: "Gate logic reads evidence fields from pipeline-state.json (not stage alone)"
  section: Correctness

- id: MC-CORRECT-02
  category: mandatory-constraint
  label: "Fields written to pipeline-state.json must exist in schema"
  section: Correctness

- id: MC-CORRECT-03
  category: mandatory-constraint
  label: "Fields read by viz from pipeline-state.json must exist in schema"
  section: Correctness

- id: MC-SELF-01
  category: mandatory-constraint
  label: "pipeline-viz.html renders without build step, server, or network"
  section: Self-containment

- id: MC-SELF-02
  category: mandatory-constraint
  label: "No npm devDependencies in pipeline-viz.html runtime"
  section: Self-containment

- id: MC-CONSIST-01
  category: mandatory-constraint
  label: "Stage enum in schema updated when skill adds/removes stage"
  section: Consistency

- id: MC-CONSIST-02
  category: mandatory-constraint
  label: "Gate add/remove synced with SKILL.md criteria"
  section: Consistency

- id: MC-A11Y-01
  category: mandatory-constraint
  label: "Interactive elements keyboard-accessible"
  section: Accessibility

- id: MC-A11Y-02
  category: mandatory-constraint
  label: "Colour not sole indicator of gate status (icons/labels present)"
  section: Accessibility

- id: ADR-001
  category: adr
  label: "Single-file viz, no build step"
  section: Active ADRs

- id: ADR-002
  category: adr
  label: "Gates must use evidence fields, not stage-proxy"
  section: Active ADRs

- id: ADR-003
  category: adr
  label: "Schema-first: fields defined before use"
  section: Active ADRs

- id: ADR-004
  category: adr
  label: "context.yml is the single config source of truth"
  section: Active ADRs

- id: ADR-005
  category: adr
  label: "Agent instructions format driven by vcs.type (surface adapter concern)"
  section: Active ADRs

- id: ADR-006
  category: adr
  label: "Approval-channel adapter pattern for DoR sign-off"
  section: Active ADRs

- id: PAT-01
  category: pattern
  label: "Single-file HTML viz architecture"
  section: Approved Patterns

- id: PAT-02
  category: pattern
  label: "State access via parsed pipelineState global"
  section: Approved Patterns

- id: PAT-03
  category: pattern
  label: "Gate pass/fail by evidence fields"
  section: Approved Patterns

- id: PAT-04
  category: pattern
  label: "Schema evolution: add fields simultaneously"
  section: Approved Patterns

- id: PAT-05
  category: pattern
  label: "Config reading via context.yml"
  section: Approved Patterns

- id: AP-01
  category: anti-pattern
  label: "Gate logic checking feature.stage only"
  section: Anti-Patterns

- id: AP-02
  category: anti-pattern
  label: "Hardcoded org/tool names in skill files"
  section: Anti-Patterns

- id: AP-03
  category: anti-pattern
  label: "External CDN dependencies in viz at runtime"
  section: Anti-Patterns

- id: AP-04
  category: anti-pattern
  label: "Fields used by viz/skills but not in schema"
  section: Anti-Patterns

- id: AP-05
  category: anti-pattern
  label: "Committing viz changes without passing check-viz-syntax.js"
  section: Anti-Patterns

- id: AP-06
  category: anti-pattern
  label: "Directly mutating pipeline-state.json outside skills"
  section: Anti-Patterns
```
