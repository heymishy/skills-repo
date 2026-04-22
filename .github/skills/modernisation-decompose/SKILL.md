---
name: modernisation-decompose
description: >
  Bridges the /reverse-engineer corpus output to /discovery feature input for
  enterprise modernisation programmes. Reads the reverse-engineering report for
  a target system and decomposes it into candidate feature boundaries using Java
  boundary signals (Maven module, Spring @Service, JPA aggregate root,
  @Transactional span). Produces a candidate-features.md file suitable for
  direct use in /discovery without manual augmentation.
triggers:
  - "decompose the reverse engineering report"
  - "modernisation decompose"
  - "candidate features from corpus"
  - "feature boundaries from reverse engineer"
  - "run modernisation-decompose"
---

# /modernisation-decompose

## Entry condition

Before proceeding, verify the following input is present:

1. `artefacts/[system-slug]/reverse-engineering-report.md` — the corpus analysis report produced by `/reverse-engineer`

If the reverse-engineering report is not found:

> ❌ Entry condition not met.
> `artefacts/[system-slug]/reverse-engineering-report.md` not found.
> Run `/reverse-engineer` first to produce the corpus analysis report.
> Do not proceed until the report exists.

---

## Step 1 — Read the reverse-engineering report

Read `artefacts/[system-slug]/reverse-engineering-report.md` in full.

Identify all candidate boundary signals present in the corpus:

- **Maven module boundaries** — each Maven module is a candidate feature boundary
- **Spring `@Service` boundaries** — each `@Service` class that orchestrates business logic
- **JPA aggregate root boundaries** — each JPA entity acting as an aggregate root
- **`@Transactional` span boundaries** — each distinct `@Transactional` call chain

**Signal priority order (deterministic — apply top-down, first match wins):**

1. Maven module (highest confidence — explicit architectural decision)
2. Spring `@Service` (high confidence — intent-declared service boundary)
3. JPA aggregate root (medium confidence — data ownership boundary)
4. `@Transactional` span (lower confidence — inferred from transaction scope)

**Tie-breaking rule:** When two signals of equal priority describe the same code region, prefer the signal with the larger scope (module > service > aggregate > span). If scope is equal, prefer the signal that appears earliest in the report's VERIFIED section.

Use each boundary signal as the **stated rationale** for the feature boundary it produces. Record the signal type and source class/module in the `rationale` field of every candidate-features.md entry.

---

## Step 2 — Low-signal escalation

If fewer than 3 distinct boundary signals are identified — for example, no Maven modules declared, no `@Service` annotations found, or circular package dependencies obscure aggregate boundaries — escalate before proceeding:

> ⚠️ Low-signal corpus detected.
> Identified signals: [list what was found]
> Missing signals: [e.g. Maven module structure absent, no `@Service` annotations, circular dependencies prevent aggregate resolution]
>
> Choose one of the following options:
>
> **Option 1 — Package-level fallback:** Use top-level Java package structure as a proxy for module boundaries. Accept reduced confidence in boundary accuracy. Record `signalConfidence: low` in each affected candidate entry.
>
> **Option 2 — Manual boundary input:** Provide a boundary specification file listing the intended feature boundaries. This replaces automated signal detection for this run.
>
> **Option 3 — Abort and record as low-signal:** Record `corpusState: low-signal` in `artefacts/[system-slug]/corpus-state.md` and stop. Return to `/reverse-engineer` for a deeper analysis pass before proceeding.
>
> Reply: 1, 2, or 3

---

## Step 3 — Produce candidate-features.md

Write `artefacts/[system-slug]/candidate-features.md`.

Each feature boundary identified in Step 1 becomes one entry. Every entry must include all five required fields:

| Field | Description |
|-------|-------------|
| `feature-slug` | Kebab-case slug derived from the boundary name (e.g. `payment-processing`) |
| `problem-statement` | One-paragraph description of the business problem this feature boundary addresses |
| `rule-ids` | Rule ID(s) from the reverse-engineering report that drove this boundary (e.g. `RULE-003, RULE-007`) |
| `persona` | Named persona from the reverse-engineering report or inferred from the system domain |
| `mvp-scope` | One-paragraph MVP scope — what the minimum deliverable for this feature boundary looks like |

Additionally, every entry must include the following field in YAML frontmatter format at the top of the entry block:

```yaml
umbrellaMetric: true
```

The `umbrellaMetric: true` field indicates this candidate feature was produced as part of a coordinated decomposition effort. Include the following traceability note directly below the `umbrellaMetric` field:

> _This feature was produced by /modernisation-decompose from `artefacts/[system-slug]/reverse-engineering-report.md`. It can be used directly as input to /discovery without manual augmentation._

The entries in `candidate-features.md` are written to be sufficient for direct use in `/discovery` without further manual augmentation.

<!-- Extension point: non-Java heuristics
     Future versions may add support for:
     - COBOL: program boundary signals (PROGRAM-ID, COPY book boundaries)
     - PL/SQL: package boundary signals (CREATE PACKAGE boundaries)
     - .NET: assembly and namespace boundary signals
     These are not implemented in the current version. -->

---

## Completion output

> ✅ **Decomposition complete**
>
> System: `[system-slug]`
> Candidate features: [N]
> Boundary signals used: [list signal types and counts]
> Low-signal escalation triggered: [Yes / No]
>
> `artefacts/[system-slug]/candidate-features.md` written.
>
> **Next step:** Run `/discovery` for each candidate feature in `candidate-features.md`.

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without completing this write. Confirm the write in your closing message: "Pipeline state updated ✅ — corpus-state.md written."

Write `artefacts/[system-slug]/corpus-state.md` with the following fields. Record metrics only (counts, ratios, timestamps) — do not write business rule text, customer identifiers, or regulatory clause text.

| Field | Value |
|-------|-------|
| `moduleCoveragePercent` | Percentage of identified modules that produced at least one candidate feature boundary (integer, 0–100) |
| `verifiedUncertainRatio` | Ratio of VERIFIED to UNCERTAIN boundary signals from the report (e.g. `"4:1"`) |
| `lastRunAt` | ISO 8601 timestamp of this decomposition run |

Example write:

```yaml
moduleCoveragePercent: 87
verifiedUncertainRatio: "4:1"
lastRunAt: "2026-04-22T14:30:00Z"
```

---

## Integration

**Reads:** `artefacts/[system-slug]/reverse-engineering-report.md`
**Produces:** `artefacts/[system-slug]/candidate-features.md`, `artefacts/[system-slug]/corpus-state.md`
**Follows:** `/reverse-engineer`
**Precedes:** `/discovery` (one invocation per candidate feature)
