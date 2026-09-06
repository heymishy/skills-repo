# Design: Canonical Artefact Trace

**Status:** Draft
**Feature:** 2026-09-06-canonical-artefact-trace
**Contributors:** Hamish King — Platform Owner
**Date:** 2026-09-06
**Prior artefacts:** discovery.md, benefit-metric.md

---

## Summary

A single canonical builder, `buildArtefactTrace()`, replaces 10 independent places in the codebase that each derive "what artefacts exist for a feature, and which epic/story does each belong to." It walks the feature's real files on disk first, cross-references `pipeline-state.json` for known epic/story names, and produces one complete structure that every consumer reads from. A document with no registration no longer vanishes silently — it appears with a visible "Unregistered" flag, so gaps are discoverable by any operator browsing normally, not just by a bug report.

---

## Solution Architecture

### Overview

`buildArtefactTrace(repoRoot, featureSlug)` sits between the existing disk/Postgres/pipeline-state data sources and the existing rendering/fetch consumers, replacing the independent derivation logic currently duplicated across `feature-story-structure.js`, `artefact-list.js`, and `artefact-fetcher.js`'s own resolution tables — without replacing those files' unrelated responsibilities (e.g. `artefact-fetcher.js`'s GitHub Contents API calls, `artefact-list.js`'s Postgres-merge logic).

```
                     ┌─────────────────────────┐
                     │   buildArtefactTrace()   │  ← ONE canonical builder (new)
                     └────────────┬────────────┘
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                     ▼
   disk (artefacts/<slug>   pipeline-state.json   Postgres artefact rows
   or archived/<slug>,       epics[]/stories[]      (journey-store, content
   or WUCE_TENANT_ROOT_BASE  (both schema shapes)    fallback only, unchanged)
   per-tenant path)
              │                    │                     │
              └────────────────────┴─────────┬───────────┘
                                              ▼
                          { featureSlug, epics, stories, artefacts,
                            unregistered: [...] }
                                              │
        ┌─────────────────────┬──────────────┼──────────────┬─────────────────┐
        ▼                     ▼              ▼               ▼                 ▼
  features.js         artefact.js      journey.js     export-data-source.js  (future:
  (table + matrix,    (fetch/resolve   (gate-confirm   (SaaS export fetch)    CLI/gate
  fadm-s1's own        one document)    fetch)                                side —
  rendering, now                                                              Phase 2)
  reads unregistered
  flag)
```

### Integration points

| System | Interaction type | Direction | Notes |
|--------|-----------------|-----------|-------|
| Local filesystem (`artefacts/<slug>`, `artefacts/archived/<slug>`) | File read | In | Primary source, per ADR-023 ("disk is canonical") |
| `WUCE_TENANT_ROOT_BASE` per-tenant disk checkout | File read | In | Multi-tenant SaaS case; needs the new "not yet synced" state (no populator/sync job found in `src/` or `scripts/` — confirmed via `/clarify`) |
| `pipeline-state.json` (`features[].epics[].stories[]`, `features[].stories[]`) | File read | In | Both schema shapes (bare-string epic reference + full flat object — ADR-017) |
| Postgres artefact rows (`journey-store.getArtefactsForJourney`) | DB read | In | Existing content-fallback merge, unchanged — confirmed in the audit as not a divergent structural source |
| `features.js` (`/features/:slug` route) | Function call | Out | Consumes the trace for the table + matrix rendering (`fadm-s1`) |
| `artefact.js` (`/artefact/:slug/:type` route) | Function call | Out | Consumes the trace to resolve a single document's real path |
| `journey.js` (gate-confirm flow, line 921) | Function call | Out | Existing `fetchArtefact(featureSlug, stageName, ...)` call — must keep working unchanged (regression surface, not a new trace consumer) |
| `export-data-source.js` (SaaS export) | Function call | Out | Existing `fetchArtefact` call, per-tenant repo override — same regression-surface treatment |

### Data and state

No new tables, columns, or persistent state. The trace is computed fresh, request-time, from existing data sources — never cached or materialized (per ADR-004, no persistent runtime). No lifecycle beyond "computed, used, discarded" within a single request.

### Hosting and runtime

Runs entirely within the existing `src/web-ui/` Node.js server process. No new service, no edge function, no client-side component — the canonical builder is an ordinary module function called from existing route handlers, same execution model as everything it replaces.

### Key technical decisions

| Decision | Choice made | Rationale |
|----------|-------------|-----------|
| Resolution order | Disk-first, `pipeline-state.json`-enriching | Makes gaps visible (per ADR-023) instead of silently degrading when registration is missing — the core problem this feature exists to fix |
| Caching | None — request-time computation | Empirically measured: `phase4` (205 files) walks in 6ms, the entire `artefacts/` tree (4,955 files) in 229ms; caching would add invalidation complexity for no measurable benefit |
| Label/subdirectory tables | Collapse 5 existing tables into 1 shared module | Sourced from and reconciled against `CLAUDE.md`'s own directory-tree convention — itself found incomplete (missing `review/`, `decisions/`, unaware of `spikes/`) and corrected as part of this consolidation |
| Unregistered-document treatment | Always shown, always flagged — inference attempted but never implies false confidence | Resolved via `/clarify` Q2; conflating "inferred" with "confirmed registered" would recreate a milder version of the same problem |
| Orphaned registration (registered story, no file) | Distinct empty/gap state, not the same "Unregistered" flag | Different root cause (registration exists, file doesn't — e.g. `ougl`'s dot/dash mismatch) needs a different operator action than "unregistered document" (file exists, no registration) |
| CLI/gate side | Explicitly out of scope, named Phase 2 follow-up | Separate consumer surface, own test suite and risk profile — bundling risks the same scope-creep this session's other stories (`bsgm-s1`/`sri-s1`/`adlr-s1`/`fadm-s1`) deliberately avoided |

### Non-functional requirements

| Requirement | Target | Source |
|-------------|--------|--------|
| Performance | No regression vs. today; empirically bounded (6ms/205 files, 229ms/whole-repo worst case) | Discovery Assumption 3, resolved via `/clarify` with a direct measurement |
| Security | No new input surface; existing tenant-scoping (`tenant_id`/`org_id`) and `adlr-s1`'s link-encoding reused unchanged | Design Step 2, Q5 |
| Availability | Graceful degradation for the multi-tenant "not yet synced" case — never throw or 500 | Discovery Assumption 1, resolved via `/clarify` |
| Accessibility | WCAG 2.1 AA; "Unregistered" indicator never relies on color alone (per `architecture-guardrails.md`'s MC-A11Y-02 guardrail) | Design Step 3, Q5 |

---

## UX / Interaction Design

### Entry point

Unchanged from today — an operator arrives via a feature card or a direct link to `/features/:slug` or `/artefact/:slug/:type`. No new navigation entry point; the only visible change is what renders once there.

### Primary flow

1. Operator opens `/features/:slug`.
2. `buildArtefactTrace()` walks the feature's disk directory once, cross-references `pipeline-state.json` for known epic/story names.
3. For a registered feature (the ~65% with no divergence): renders exactly as `fadm-s1` already established (feature-level table + document matrix) — unchanged.
4. For a document the builder can't match to any registered story: still appears, grouped by inferred story where disk patterns support it, otherwise in a clearly-labeled "Unregistered" section — with the visible flag shown either way.
5. Operator clicks any document, registered or not — opens via the existing `/artefact/:slug/:type` route, unchanged.

### Edge cases and error states

| Scenario | User-facing behaviour |
|----------|-----------------------|
| Zero-registration feature (`phase4`-class) | Every document appears; inference attempted; "Unregistered" flag shown regardless of inference success |
| Partial registration (`sri-s1`-class) | Registered documents render normally; only the unmatched ones get the flag |
| Orphaned registration (registered story, no file — e.g. `ougl`) | Story row/entry still appears, but with zero documents and its own distinct empty/gap state — not the same flag as "unregistered document" |
| Multi-tenant disk not yet synced | Distinct "not yet synced" state — never conflated with "genuinely unregistered" |
| Empty feature (no documents at all) | Unchanged from today's existing empty-state handling |

### Design system

Reuses `fadm-s1`'s exact table/matrix primitives and design tokens (`--surface`, `--line`, `--ink`, `--muted`, `--accent`; `.doc-table`, `.doc-matrix`) — no new visual language. One new component: an "Unregistered" indicator, styled as a `.sw-pill` variant (amber/neutral, not red — a data-completeness note, not an error), consistent with `fadm-s1`'s existing Status column pattern.

### Accessibility

WCAG 2.1 AA. The "Unregistered" pill uses a text label plus icon, never color alone (per `architecture-guardrails.md`'s MC-A11Y-02 guardrail). Fully keyboard-operable via existing native `<table>`/`<a>` markup — no new custom interactive elements.

---

## Constraints

- ADR-004 (no persistent agent runtime) — request-time computation only.
- ADR-023 ("disk is canonical") — the resolution-order decision directly implements this existing precedent.
- ADR-028 (one canonical builder per derived structure) — this feature is the first real application of the ADR it motivated.
- Node.js CommonJS only, no new npm dependencies (`product/tech-stack.md`).
- No breaking change to the existing `/artefact/:slug/:type` URL shape (`adlr-s1`'s link-encoding convention).

---

## Open questions

| # | Question | Owner | Blocking definition? |
|---|----------|-------|----------------------|
| 1 | Does `CLAUDE.md`'s own directory-tree convention get corrected (missing `review/`, `decisions/`, `spikes/`) in the same PR as the label-table consolidation, or as a fast-follow? | Hamish King | No — bounded either way, doesn't change story scope |

---

## Deferred decisions

- CLI/gate side wiring (`bin/skills`, `check-pipeline-state-integrity.js`, `validate-trace.ps1`/`.sh`) onto the same canonical builder — deferred to a named Phase 2 story, per discovery's own Out of Scope section.
- Backfilling registration for the ~90 already-divergent features found in the audit — deferred; this feature builds the mechanism, using it to fix the backlog is separate follow-on work.
