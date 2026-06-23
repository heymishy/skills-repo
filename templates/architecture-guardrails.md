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

  Project-level ADRs that span multiple features live in this file (## Active ADRs).
  Per-feature decisions live in artefacts/[feature]/decisions.md

  To evolve: update this file, open a PR, tag engineering lead + architecture lead.
  Adding a guardrail here automatically propagates it into all downstream pipeline checks.
-->

**Last updated:** [YYYY-MM-DD]
**Maintained by:** [Name / role]

---

## Pattern Library

**URL:** [FILL IN — e.g. https://design.yourorg.com/components]
**Version / tag in use:** [FILL IN — e.g. v3.2.1]
**Package name:** [FILL IN — e.g. @yourorg/ui-components]

<!--
  Agents should check: does this story's implementation require a UI component
  that exists in the pattern library? If so, the story's Architecture Constraints
  field and the coding agent instructions should reference the specific component.
-->

---

## Style Guide

**URL:** [FILL IN — e.g. https://design.yourorg.com/guidelines]
**Key constraints:**
- [e.g. All form elements must use the standard form wrapper]
- [e.g. Icon library: use @yourorg/icons — no custom SVG unless approved]
- [e.g. Typography: never set font-family directly — use design token classes]

---

## Reference Implementations

<!--
  Canonical examples of correctly-implemented patterns in this repository.
  Link to file path + line range where possible.
  Agents must follow these patterns for the relevant capability.
-->

| Capability | Reference path | Notes |
|-----------|---------------|-------|
| [e.g. API service layer] | [e.g. src/services/userService.ts] | [Pattern to follow] |
| [e.g. Data table component] | [e.g. src/components/DataTable/] | [Pattern to follow] |
| [e.g. Error handling] | [e.g. src/utils/errorHandler.ts] | [Pattern to follow] |

---

## Approved Patterns

<!--
  What to use — specific, not generic.
  If a story's implementation path uses something other than these, flag it in /review.
-->

- **State management:** [e.g. Zustand for global state — no Redux, no Context API for app state]
- **Data fetching:** [e.g. React Query with the shared queryClient — no raw fetch calls]
- **Authentication:** [e.g. Use the shared AuthService — no local session management]
- **Logging:** [e.g. Use the structured logger from @yourorg/logging — no console.log in production code]
- **Routing:** [e.g. React Router v6 — no custom routing]

<!--
  [FILL IN] — replace examples above with your actual approved patterns.
  Each line should be: capability: what to use — what NOT to use (and why if non-obvious).
-->

---

## Anti-Patterns

<!--
  Explicitly forbidden approaches. Finding one of these in a story's ACs or
  implementation plan is a HIGH finding in /review Category E.
-->

| Anti-pattern | Reason | Approved alternative |
|-------------|--------|---------------------|
| [e.g. Direct DOM manipulation] | [Bypasses React reconciler, causes test failures] | [Refs or state] |
| [e.g. Storing PII in localStorage] | [Data residency risk, no encryption] | [Session-scoped server-side storage] |
| [e.g. Synchronous file I/O in request path] | [Blocks event loop under load] | [Async I/O with proper error handling] |

<!--
  [FILL IN] — replace examples with your actual anti-patterns.
-->

---

## Mandatory Constraints

<!--
  Non-negotiable requirements that apply to every story in this repository.
  These become the baseline NFR checklist in /review Category E.
  Stories that do not address applicable mandatory constraints are blocked.
-->

### Security
- [e.g. All user inputs must be validated server-side — never trust client-only validation]
- [e.g. No secrets in source code — use environment variables or secrets manager]
- [e.g. All data-modifying operations require authentication and authorisation checks]

### Data and privacy
- [e.g. PII must not be logged — mask before writing to any log system]
- [e.g. Data residency: all storage must use [region] region — no cross-region replication without approval]
- [e.g. Exports containing user data require audit log entries]

### Accessibility
- [e.g. All interactive elements must meet WCAG 2.1 AA]
- [e.g. Run axe-core automated scan as part of every PR — zero critical violations]

### Observability
- [e.g. All new API endpoints must emit structured logs with correlation ID]
- [e.g. Key user-facing transactions must have a named APM trace]

### Testing
- [e.g. Unit test coverage must not decrease below the current baseline]
- [e.g. Integration tests must use the shared test database — no in-memory DB substitutes for integration tests]

<!--
  [FILL IN] — replace examples with your actual mandatory constraints.
  These are the guardrails /review Category E and /definition-of-ready H9 enforce.
-->

---

## Active Repo-Level ADRs

<!--
  Architectural decisions that affect all features in this repository.
  Per-feature decisions live in artefacts/[feature]/decisions.md

  Format: ADR-[N] | Status | Title | What it constrains
  Status: Active | Superseded by ADR-[N] | Deprecated

  Stories in /review Category E are checked against all Active ADRs.
  Superseded ADRs are kept for historical reference — do not delete.
-->

| # | Status | Title | Constrains |
|---|--------|-------|-----------|
| [ADR-001] | [Active] | [e.g. Use React Query for all server state] | [Data fetching in all components] |
| [ADR-002] | [Active] | [e.g. No direct database access from UI layer] | [All components, API design] |

<!--
  Full ADR text for each entry lives below. Use the format from decision-log.md.
-->

---

### ADR-001: [Title]

**Status:** [Active / Superseded by ADR-XXX / Deprecated]
**Date:** [YYYY-MM-DD]
**Decided by:** [Name / role]

#### Context
[Why this decision was needed]

#### Decision
[What was decided and primary reason]

#### Consequences
**Easier:** [What becomes easier]
**Harder / constrained:** [What becomes harder]
**Off the table:** [What is now excluded]

#### Revisit trigger
[What would cause reconsideration]

---
<!-- Add further ADRs as ADR-002, ADR-003 etc. -->

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
  
  [FILL IN] — add entries matching your mandatory constraints, ADRs, patterns,
  and anti-patterns above. Use consistent IDs (MC-SEC-01, ADR-001, PAT-01, AP-01).
-->

```yaml guardrails-registry
# Example entries — replace with your actual guardrails:
- id: MC-SEC-01
  category: mandatory-constraint
  label: "Server-side input validation on all user inputs"
  section: Security

- id: MC-SEC-02
  category: mandatory-constraint
  label: "No secrets in source code"
  section: Security

- id: ADR-001
  category: adr
  label: "[Your first ADR title]"
  section: Active ADRs

- id: PAT-01
  category: pattern
  label: "[Your first approved pattern]"
  section: Approved Patterns

- id: AP-01
  category: anti-pattern
  label: "[Your first anti-pattern]"
  section: Anti-Patterns
```
