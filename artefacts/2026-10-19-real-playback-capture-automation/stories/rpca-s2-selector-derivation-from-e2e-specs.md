## Story: Selector derivation generalises beyond one AC, with a manual fallback for ACs with no E2E coverage

**Epic reference:** artefacts/2026-10-19-real-playback-capture-automation/epics/real-playback-capture-cli.md
**Discovery reference:** artefacts/2026-10-19-real-playback-capture-automation/discovery.md
**Benefit-metric reference:** artefacts/2026-10-19-real-playback-capture-automation/benefit-metric.md
**Domain:** [none identified — reuses rpca-s1's own auth/CLI plumbing, no new domain surface]

## User Story

As an **operator / engineer**,
I want **the capture CLI to automatically work out which UI element to screenshot for every AC in a story, not just the one I hand-picked to prove the mechanism**,
So that **a real feature's own playback package can be captured without me hand-authoring a selector for every single AC first**.

## Benefit Linkage

**Metric moved:** M1 — Real capture coverage on new DoD-complete features; M2 — Manual capture time per feature
**How:** `rpca-s1` proved the mechanism works for one AC; without generalisation, every feature would still need a human to hand-pick and wire one AC at a time — which doesn't meaningfully move either metric at the scale ~270 features implies.

## Architecture Constraints

- **Reuses existing `tests/e2e/*.spec.js` selectors (ADR-026)** — confirmed at `/clarify` by sampling 3 spec files: every selector is a stable CSS class or `id`/`data-*` attribute, not fragile. This story parses those files rather than inventing a new selector-authoring format.
- **Manual fallback is a fallback, not the primary mechanism** — per the discovery's own Out of Scope, a new mandatory manual-authoring step is explicitly excluded; the fallback file is optional and only consulted when no E2E spec match exists.

## Dependencies

- **Upstream:** `rpca-s1` — this story extends its CLI and auth mechanism, does not duplicate them.
- **Downstream:** `rpca-s4`'s own skill-documentation update describes this generalised behaviour, not `rpca-s1`'s single-AC proof.

## Acceptance Criteria

**AC1:** Given a story whose `tests/e2e/*.spec.js` file names an AC explicitly in a comment (e.g. `// fpd-s4-caption-sync.spec.js -- ... (fpd-s4 AC3)`) and contains a `page.locator(...)` call, When the CLI builds its own capture list for that story, Then it derives `{acId, selector}` automatically from that spec file — no manual authoring required for that AC.

**AC2:** Given an AC with no matching E2E spec file, When the CLI builds its own capture list, Then it checks a manually-authored fallback file (`artefacts/[feature-slug]/playback/[story-slug]/selectors-manual.json`) for that AC's own `{url, selector}`, and uses it if present.

**AC3:** Given an AC with neither an E2E spec match nor a manual fallback entry, When the CLI runs, Then it skips that AC with a clear, named warning in its own output identifying the specific AC — not a silent omission, and not a crash that blocks capturing every other AC in the same run.

**AC4:** Given the CLI runs against a real multi-AC, multi-story feature, When it completes, Then every AC that had either an E2E-derived or manually-authored selector produces its own real screenshot file, and the run's own summary output states how many ACs were captured versus skipped.

## Out of Scope

- **Making the manual fallback file format itself a new governed artefact type** (e.g. requiring its own template, DoR check) — it's a plain JSON sidecar file, not a new pipeline artefact category.
- **Automatically generating E2E spec files for ACs that lack them** — out of this epic entirely; this story only consumes specs that already exist.
- **Retrying or healing a selector that no longer matches the live page** (e.g. after a later UI change) — if a derived selector breaks, that surfaces as a normal capture failure for that AC, not a new self-healing mechanism.

## NFRs

- **Performance:** Parsing `tests/e2e/*.spec.js` files for selector derivation must not meaningfully slow a capture run — these are small text files, read once per run, not per AC.
- **Security:** None new — no new input surface beyond what `rpca-s1` already established; the manual fallback file is operator-authored, not externally supplied.
- **Accessibility:** Not applicable — CLI tool, no new UI surface.
- **Audit:** None — read-only.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
