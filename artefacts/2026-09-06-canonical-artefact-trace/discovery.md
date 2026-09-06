# Discovery: Canonical Artefact Trace

**Status:** Approved
**Created:** 2026-09-06
**Approved by:** Hamish King — Platform Owner — 2026-09-06
**Author:** Claude Code (agent, operator-directed — Hamish King)

---

## Problem Statement

There is no single canonical source of truth for "what artefacts exist for a feature, and which epic/story does each belong to." Ten independent code paths (`pipeline-state.json`'s two schema shapes, `feature-story-structure.js`, `artefact-list.js`'s disk walk, `artefact-fetcher.js`'s GitHub-API resolution, `features.js`'s matrix/table rendering, plus 5 different label/subdirectory tables and 3 separate `archived/`-prefix fallback implementations across those files) each independently derive this structure. When they disagree — or when a feature simply has no `pipeline-state.json` registration at all — the page silently degrades to a generic, undifferentiated listing with no visible indication anything is wrong. This has produced 5 distinct, separately-reported bugs in a single session (`bsgm-s1`, `sri-s1`, `adlr-s1`, `fadm-s1`, and an unfixed `2026-04-19-skills-platform-phase4` case), each fixed in a different file, none addressing the shared root cause. Quantified: ~90 of 260 features in this repo (~35%) currently have some divergence between what `pipeline-state.json` believes exists and what's actually on disk.

## Who It Affects

**Primary: Developer/engineer and Tech lead** (platform maintainer role, per `product/mission.md`). Anyone browsing `/features/:slug` or opening an individual artefact link hits degraded or broken pages whenever a feature's registration is incomplete or absent — silently, with no indication anything is wrong. This has cost real session time this whole engagement: 5 separate investigation-and-fix cycles for what is one underlying gap, each requiring a fresh audit to even locate the actual bug.

**Secondary: Platform maintainer** as the person who must review yet another one-off fix each time a new instance surfaces, rather than a single change closing the whole class.

## Why Now

This has crossed from "occasional annoyance" to "recurring, quantified pattern" within a single session: 5 separate bug reports traced to the same root cause, with a direct audit confirming ~35% of features in this repo currently have some live divergence between registered and actual structure. Critically, the platform is in beta now — a potential customer hitting a silently-broken artefact page (missing documents, no visible error, "far too many stories" jumbled together) reads as the platform itself being unreliable, not a cosmetic bug. In beta, trust is the product; a visibly broken governance-artefact view is a direct hit to the thing beta customers are evaluating. ADR-028 (`.github/architecture-guardrails.md`, added 2026-09-06 as part of this same discovery) commits the platform to a general principle — one canonical builder per derived structure, every consumer reads from it — going forward; this feature is the first real application of it, closing the concrete gap that motivated the ADR.

## MVP Scope

A single canonical `buildArtefactTrace(repoRoot, featureSlug)` builder, disk-first (walks the real directory once, tries `artefacts/<slug>` then `artefacts/archived/<slug>` — one fallback implementation, not three), cross-referencing `pipeline-state.json` for epic/story names where a registration exists. One shared label/subdirectory table, replacing the current five. Every real file on disk gets a home in the rendered output — including a document with no `pipeline-state.json` registration at all, shown with an explicit "unregistered" visual marker rather than silently vanishing into a generic bucket or a degraded flat listing. This becomes the single source both `/features/:slug` (the table + matrix) and `/artefact/:slug/:type` (the fetch/resolve route) read from, replacing today's independent derivations in `feature-story-structure.js`, `artefact-list.js`, and `artefact-fetcher.js`.

What "done" looks like for the smallest useful slice: an operator opening `2026-04-19-skills-platform-phase4` (the just-found 205-file, zero-registration case) sees every one of its real documents, correctly grouped where a story boundary is knowable from disk structure even without a `pipeline-state.json` entry, with unregistered ones visibly flagged — not the current 73-card undifferentiated dump.

## Out of Scope

- **CLI/gate side** (`bin/skills`, `check-pipeline-state-integrity.js`, `validate-trace.ps1`/`.sh`) — a separate consumer surface with its own test suite and risk profile. Wiring these onto the same canonical builder would close the loop entirely (making `/trace` itself catch a `phase4`-class gap automatically), but is a named Phase 2 follow-up, not this feature's scope.
- **Auto-registering an unregistered document into `pipeline-state.json`** — the canonical trace surfaces an unregistered document visibly; it does not write anything back to `pipeline-state.json` on the operator's behalf. Registration remains a deliberate, reviewed action (matching how `sri-s1`'s own fixes were applied), not an automatic side effect of viewing a page.
- **Backfilling registration for the ~90 already-divergent features found in the audit** — this feature builds and ships the canonical mechanism; using it to actually re-register `phase4`, `ougl`, `wuce`, and the ~87 other affected features is separate follow-on work, prioritized after the mechanism exists.
- **Postgres artefact-row reconciliation** (`journey-store`'s merge-by-path logic) — confirmed in the audit to not itself be a divergent *structural* source (it's a content store merged into the same array), so no change needed here, but explicitly not touched by this feature either.

## Assumptions and Risks

**Disk availability (resolved via /clarify):** Confirmed safe for this deployment's own dogfooding case — `getRepoRoot()` falls through to the container's own checkout (`path.resolve('.')`), baked in at deploy time, always present. For the multi-tenant SaaS case (`WUCE_TENANT_ROOT_BASE` + per-tenant directory), direct code inspection found only consumers of this path (`as-built-diagrams.js`, `as-built-system-architecture.js`) — no populator (clone/sync job) in `src/` or `scripts/`. [ASSUMPTION] The exact guarantee that a tenant's disk checkout exists before an artefact page is requested is unconfirmed for the multi-tenant case — the canonical builder must therefore support a distinct "not yet synced" state, separate from "genuinely unregistered," rather than assuming disk is always ready.

**Story-boundary inference (resolved via /clarify):** The canonical builder will attempt to infer story grouping from disk structure (filename/directory patterns) where possible, but will always show the "unregistered" flag on a document with no `pipeline-state.json` registration regardless of whether inference succeeded — never implying false confidence the data doesn't support.

**Directory-walk performance (resolved via /clarify):** Empirically measured directly against this repo: walking `phase4`'s full 205-file directory takes 6ms; walking the *entire* `artefacts/` tree (4,955 files, every feature combined) takes 229ms, and the canonical builder only ever walks one feature's subtree. No performance safeguard needed for MVP.

**Risk:** the exact visual treatment for "unregistered document" is a genuine design decision, not yet made — get it wrong (too alarming, too easy to ignore) and it either scares operators away from otherwise-fine legacy features or gets silently ignored, defeating the point. This needs `/design`, not just implementation judgment.

**Risk:** collapsing 5 existing label/subdirectory tables into 1 shared one risks a labeling regression for any consumer relying on a specific existing table's exact wording (e.g. a test asserting a specific label string) — needs a careful audit of existing consumers before consolidation, not just a clean replacement.

## Directional Success Indicators

**Divergent features:** Baseline: ~90 of 260 features (~35%) have some registered-vs-disk divergence (measured this session via direct audit script). Target: 0 for any feature touched by the canonical builder going forward — no new divergence introduced once the builder ships (existing divergence backfill is out of scope, per Out of Scope). Measured via: re-running the same audit script post-ship.

**Bugs of this class per session:** Baseline: 5 in this single session (`bsgm-s1`, `sri-s1`, `adlr-s1`, `fadm-s1`, `phase4`). Target: 0 net-new instances of "a consumer independently re-derives this structure and disagrees with another consumer" after this ships — any future divergence should be a canonical-builder bug (fixed once, everywhere), not a new independent derivation. Measured via: whether any future fix in this area touches more than one of the previously-5-separate files, or exactly one (the canonical builder).

**Unregistered documents visible without a bug report:** Baseline: 0% — every one of the 5 bugs this session required a human to notice and report a specific broken page. Target: 100% of unregistered documents are visually flagged on their own feature's page, discoverable by any operator browsing normally. Measured via: manual check against `phase4` and a sample of the other 49 zero-registration features post-ship.

## Constraints

- ADR-004 (no persistent agent runtime / no hosted service) — the canonical builder must remain request-time computation, not a cached/materialized background process.
- ADR-023 ("disk is canonical") — already establishes the precedent this feature relies on; the canonical builder should be consistent with, not contradict, this existing decision.
- Node.js CommonJS only, no new npm dependencies (from `product/tech-stack.md`'s standing platform constraint).
- The update channel must never be severed (`product/constraints.md` #1) — not directly implicated, but worth naming since any change to shared adapter modules touches the distribution surface.
- No breaking change to the existing `/artefact/:slug/:type` URL shape — `adlr-s1`'s link-encoding convention (already shipped, already load-bearing for every currently-generated link) must remain compatible.

## Contributors

- Hamish King — Platform Owner

## Reviewers

- [None yet]

## Approved By

Hamish King — Platform Owner — 2026-09-06

---

## Clarification log

[2026-09-06] Clarified via /clarify:

- Q: Is the local `artefacts/` filesystem checkout reliably available in production for every deployment shape this platform runs?  A: Uncertain — investigated directly. Confirmed safe for this deployment's own dogfooding case (container's own checkout, always present); unconfirmed for the multi-tenant `WUCE_TENANT_ROOT_BASE` case (no populator/sync job found in `src/` or `scripts/`) — canonical builder must support a distinct "not yet synced" state for that case.
- Q: Can story boundaries be inferred from disk structure alone for a zero-registration feature?  A: Attempt inference where possible, but always show the "unregistered" flag regardless of whether inference succeeded — never imply false confidence.
- Q: Is a full directory walk per page request within acceptable latency at this repo's real scale?  A: Empirically measured — `phase4` (205 files): 6ms. Entire `artefacts/` tree (4,955 files): 229ms. No safeguard needed for MVP.

---

**Next step:** Human review and approval → /benefit-metric
