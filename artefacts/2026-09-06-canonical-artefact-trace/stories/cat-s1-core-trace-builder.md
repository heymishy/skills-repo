## Story: Build the canonical artefact trace from real disk structure for any feature

**Epic reference:** artefacts/2026-09-06-canonical-artefact-trace/epics/canonical-artefact-trace.md
**Discovery reference:** artefacts/2026-09-06-canonical-artefact-trace/discovery.md
**Benefit-metric reference:** artefacts/2026-09-06-canonical-artefact-trace/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **Platform maintainer**,
I want **one function that walks a feature's real disk directory and cross-references `pipeline-state.json` for known epic/story names**,
So that **every future consumer reads the same, correct structure instead of independently re-deriving it — directly moving the "bugs of this class per session" metric toward zero**.

## Benefit Linkage

**Metric moved:** Bugs of this class per session
**How:** A single, tested builder function replaces the independent derivation logic in `feature-story-structure.js`'s `getFeatureStoryStructure` — the specific function `bsgm-s1` and `sri-s1` each had to fix separately — so a future gap in this logic is fixed once, not rediscovered per consumer.

## Architecture Constraints

- ADR-023: "disk is canonical" — this builder walks disk first, treating `pipeline-state.json` as enrichment, not the source of truth.
- ADR-004: no persistent agent runtime — the builder is a request-time computation, never cached or materialized.
- ADR-028: one canonical builder per derived structure — this story is the ADR's first concrete implementation.

## Dependencies

- **Upstream:** None — foundation story for this epic.
- **Downstream:** cat-s2 (label table), cat-s3 (divergence classification), cat-s4 (features.js integration), cat-s5 (artefact.js integration) all consume this builder's output.

## Acceptance Criteria

**AC1:** Given a feature with full `pipeline-state.json` registration (e.g. `2026-09-06-feature-artefact-document-matrix`, this repo's own recently-shipped feature), when `buildArtefactTrace(repoRoot, featureSlug)` is called, then it returns a structure with every epic, story, and artefact correctly attributed, matching what `getFeatureStoryStructure`/`groupArtefactsByStory` already produce for that feature today.

**AC2:** Given a feature with zero `pipeline-state.json` registration (`2026-04-19-skills-platform-phase4`, 205 real files), when `buildArtefactTrace` is called, then it returns every one of those 205 files in its output — none silently dropped — with no crash and no reliance on any `pipeline-state.json` entry existing.

**AC3:** Given a feature directory that exists under `artefacts/archived/<slug>/` but not `artefacts/<slug>/`, when `buildArtefactTrace` is called, then it resolves the archived path automatically, with exactly one fallback implementation (not the three separate ones found in the audit across `artefact-list.js`, `artefact-fetcher.js`, and `validate-trace.ps1`).

**AC4:** Given a feature directory that exists under neither `artefacts/<slug>/` nor `artefacts/archived/<slug>/` (a genuinely nonexistent feature slug), when `buildArtefactTrace` is called, then it returns a clearly-typed "not found" result — not `null`, not an empty structure indistinguishable from "found but empty," and not a thrown exception.

**AC5:** Given the multi-tenant `WUCE_TENANT_ROOT_BASE` path where a tenant's disk checkout has not yet been populated, when `buildArtefactTrace` is called, then it returns a distinct "not yet synced" result, never conflated with AC4's "not found" result or with a genuinely empty/unregistered feature.

## Out of Scope

- The shared label/subdirectory table consolidation — separate story (cat-s2); this story's builder returns raw file paths and whatever type information is cheaply available, not final display labels.
- The "Unregistered" visual flag itself — separate story (cat-s3/cat-s4); this story only needs to make unregistered documents structurally present in its output, not decide how they're displayed.
- Any change to `pipeline-state.json`'s own schema or write path — this story only reads it.

## NFRs

- **Performance:** A single feature's directory walk completes within 50ms for a feature up to 300 files (empirically, `phase4`'s 205 files walked in 6ms this session — this target keeps meaningful headroom, not a tight ceiling requiring optimization work).
- **Security:** None identified — no new input surface; `featureSlug` is already validated elsewhere in the existing route handlers before reaching this function.
- **Accessibility:** Not applicable — this is a data-layer function with no rendering.
- **Audit:** Not applicable — read-only, no state-changing action.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
