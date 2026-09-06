## Epic: Every operator sees a feature's real artefact structure, even when registration is incomplete

**Discovery reference:** artefacts/2026-09-06-canonical-artefact-trace/discovery.md
**Benefit-metric reference:** artefacts/2026-09-06-canonical-artefact-trace/benefit-metric.md
**Slicing strategy:** Risk-first

## Goal

An operator browsing any feature's artefact index sees every real document that exists on disk, correctly attributed to its story where a story is registered or can be confidently inferred, and visibly flagged as "Unregistered" where it cannot — never silently dropped, never mis-grouped, never rendered from stale or divergent data. Every consumer of this structure (`/features/:slug`, `/artefact/:slug/:type`, the gate-confirm flow, the SaaS export path) reads from one canonical builder instead of five independent, occasionally-disagreeing derivations.

## Out of Scope

- The CLI/gate side (`bin/skills`, `check-pipeline-state-integrity.js`, `validate-trace.ps1`/`.sh`) — a separate consumer surface with its own test suite, deferred to a named Phase 2 epic.
- Backfilling registration for the ~90 already-divergent features found in the audit — this epic ships the mechanism; using it to fix the existing backlog is separate follow-on work.
- Auto-registering an unregistered document into `pipeline-state.json` — registration remains a deliberate, reviewed action, never an automatic side effect of viewing a page.
- Postgres artefact-row reconciliation — confirmed in the audit as not itself a divergent structural source; untouched by this epic.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| Registered-vs-disk divergence rate | ~90 of 260 features (~35%) | 0% net-new divergence for any feature touched by the canonical builder | The builder itself cannot introduce new divergence, since it derives structure directly from disk rather than trusting a possibly-stale registration |
| Bugs of this class per session | 5 in one session, each fixed in a different file | 0 future instances touching more than one file | A future fix in this area edits exactly one builder, not N independent derivations |
| Unregistered documents visible without a bug report | 0% | 100% of unregistered documents visually flagged | Stories 3 and 4 implement detection and the visible flag directly |

## Stories in This Epic

- [ ] Core trace builder resolves real disk structure for any feature, registered or not
- [ ] One shared label table replaces five independent, disagreeing tables
- [ ] The trace classifies every divergence case named in discovery, not just the common one
- [ ] The feature artefact-index page shows every document with its real status, using the trace
- [ ] Opening any single document resolves through the trace, not independent logic
- [ ] The two existing non-trace consumers of artefact fetching keep working unchanged

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Touches shared adapter modules consumed by 5 different route handlers across the live product; a regression here is wide-reaching (confirmed by this session's own experience — the last 5 bugs in this exact area). Not High, since no security/auth/payment surface is involved and the design was fully validated (discovery, clarify, design) before any code was written.

## Complexity Rating

**Rating:** 2

## Scope Stability

**Stability:** Stable
