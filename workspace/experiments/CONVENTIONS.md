# Experiment naming conventions

**Purpose:** Canonical naming rules for experiment directories, manifests, and run identifiers. Apply to all new experiments and when retrospectively referencing existing ones.

---

## Directory naming

```
workspace/experiments/EXP-NNN-[skill-abbrev]-[type]/
```

| Segment | Rule | Example |
|---------|------|---------|
| `EXP-NNN` | Zero-padded three-digit sequential number | `EXP-007` |
| `[skill-abbrev]` | Lowercase skill name or descriptor, hyphen-separated | `discovery`, `dor-rubric`, `pipeline-eval` |
| `[type]` | Optional — omit for primary sweeps; use for subtypes | see suffix table below |

**Examples:**
- `EXP-001-discovery-phase4-5/` — original sweep, no suffix needed
- `EXP-002a-cross-provider-discovery/` — extension of EXP-002 with different scope (letter suffix)
- `EXP-007R-testplan-nfr/` — fix-validation run against EXP-007 finding (R suffix)

---

## Suffix rules

| Suffix | When to use | Meaning |
|--------|-------------|---------|
| *(none)* | Primary sweep or experiment | Original run; no prior version |
| `a`, `b`, `c` | Incremental scope extension of the same experiment type | EXP-002a = cross-provider; EXP-002b = context-loaded (same skill, different scenarios) |
| `R` | Fix-validation confirmatory run | Re-run specifically to confirm that a SKILL.md or rubric fix resolves a finding from the parent experiment. Inherits parent experiment number. |
| `v2` | Full replacement of a prior experiment (same scope, new design) | Use only when the prior experiment is invalidated at the design level, not just a finding correction |

**Disambiguation rule:** Prefer `R` over a new full experiment number when the scope is narrow and the purpose is confirmatory (N ≤ 2 trials per case, single finding under test). Use a new full number when a fix requires evaluating multiple findings across ≥ 3 cases.

---

## Run identifier naming within a manifest

Within the manifest `## Runs log`, individual run rows use:

```
[Config]-[run_number]
```

| Pattern | Meaning | Example |
|---------|---------|---------|
| `A-1`, `A-2` | Config A, run 1 and run 2 | Standard trial notation |
| `C-1 (invalid)` | Annotate invalid runs inline | Run executed with wrong conditions |
| `[skill]-f[finding]-r[attempt]` | Fix-validation sub-run within an experiment | `definition-f6f7-r1` = definition stage, findings F6 and F7, first fix-validation attempt |

**Invalid runs:** Always label invalid runs explicitly in the runs log header cell. Move invalid rows to a separate `## Invalid runs` subsection. Do not delete them — they are the audit trail.

---

## Manifest status values

| Value | Meaning |
|-------|---------|
| `planned` | Experiment designed but not started |
| `in-progress` | At least one run started; not all runs complete |
| `complete` | All planned runs executed; findings written; routing implication section populated |
| `cancelled` | Experiment formally cancelled with reason documented (e.g. `Config D: cancelled — H5 disproved by EXP-002a`) |

Update the manifest status field before committing any run results. A manifest with `status: planned` and a populated results table is a data integrity error (see EXP-002a — corrected 2026-05-16).

---

## Retroactive reference note

The experiments in this repository that pre-date this conventions file (EXP-001 through EXP-007R, created before 2026-05-16) follow these conventions except where noted below. They are not retroactively renamed.

| Experiment | Convention note |
|------------|----------------|
| `EXP-002a` | Follows the `a`-suffix extension rule |
| `EXP-002b` | Follows the `b`-suffix extension rule; not yet created |
| `EXP-007R` | Introduced the `R`-suffix pattern documented here |
| `EXP-001` sub-runs (`run-3`, `run-3b`) | Pre-convention; these are sub-runs within a single manifest, not separate directories |

---

## Context injection file design

**Rule:** Injection files may signal regulatory obligation frameworks and known system risk indicators, but must not name the specific compliance gap or its enforcement consequence. Hidden constraints (C5) must be surfaced through model reasoning, not document reading.

**Permitted signal level:**
- Regulatory obligation frameworks that apply to the domain (e.g. "FMA expects independent validation for models used in automated credit decisions")
- Known system risk indicators such as unvalidated models, missing sign-offs, or incomplete data agreements
- Organisational facts that a model would need to connect to a constraint (e.g. EA registry entry noting a demographic disparity finding with no remediation record)

**Prohibited signal level:**
- Direct naming of the specific compliance gap the hidden constraint represents (e.g. "the FMA disclosure obligation is triggered")
- Stating the enforcement consequence of the gap (e.g. "proceeding without disclosure creates regulatory enforcement risk")
- Quantified thresholds tied directly to a disclosure or enforcement trigger (e.g. "disparity ≥5% is presumptively material and disclosure is expected")

**Design test:** For each hidden constraint in a story, ask: can the injection file content alone answer the judge's `c5_surfaced` question without any reasoning from the model? If yes, the signal level is too high — soften it.

**Reference:** First applied to S2 injection files for EXP-008 (2026-05-17). CDM-RISK-004 and Principle 3 disclosure language removed from S2 files on this basis.
