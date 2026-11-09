# Discovery: Unified Reactive + Proactive Visibility

**Status:** Approved
**Created:** 2026-11-08
**Approved by:** Hamish King — Platform Owner — 2026-11-08
**Author:** Claude Sonnet 5 (conversational discovery session with operator)

---

## EA Registry Check

`architecture.ea_registry_authoritative: true` in `.github/context.yml`. No EA registry entry exists for `src/web-ui/routes/products.js` (specifically `_renderConsolidatedFeaturesSection`/`_renderProductView`, the real target surface — see Problem Statement correction below, logged 2026-11-09 via `/definition`) or the broader `src/web-ui/` surface this initiative extends — proceeding without blast-radius data. This does not block discovery.

**[CORRECTED 2026-11-09 at /definition — see decisions.md]** An earlier draft of this discovery (and this EA Registry Check) named `src/web-ui/views/kanban-view.js` as the target surface. A code-level audit at /definition found this was wrong: `kanban-view.js` is fed exclusively by a Postgres `journeys` table (in-flight skill sessions), with no path to `.github/pipeline-state.json` data at all. The real, correct target is `_renderConsolidatedFeaturesSection` (`src/web-ui/routes/products.js:496`), rendered inside `_renderProductView` (`:1122`) via `handleGetProductView` (`:2877`) — the per-product detail page. This page already merges a connected repo's GitHub-synced `pipeline-state.json` taxonomy (via `product-rollup.js`'s `computeTaxonomyRollup`/`mergeFeatureSources` — covers every feature regardless of `track`, including short-track entries) with in-flight journeys, rendering health/coverage/stage/module grouping per item. Every mention of `kanban-view.js` below is corrected accordingly.

---

## Problem Statement

Engineers' daily reality is a mix of forward-looking story work (planned features, in the governed pipeline) and reactive operational work (incidents, patches, hotfixes) — but only the first half has a visibility surface. The product detail page's consolidated features section (`_renderConsolidatedFeaturesSection`, `src/web-ui/routes/products.js:496`, inside `_renderProductView`/`handleGetProductView` — the real surface for a product whose GitHub repo is connected, e.g. this very repo via `platform-self-registration.js`'s dogfooded product row) is effectively forward-looking in practice today: it already walks every `pipeline-state.json` feature (via `computeTaxonomyRollup`), including short-track ones, but never carries `feature.track` through to the rendered item, so a short-track (reactive) entry and a standard-track (planned) one are visually indistinguishable — the gap is a dropped field, not a missing data path. Reactive work's *second* source — `decisions.md` RISK-ACCEPT/SCOPE entries — has no path into this surface at all yet. Both still either live nowhere governed (a Slack thread, a verbal handoff, tribal memory) or in a separate, disconnected tool (Jira or equivalent), split from the same pipeline-state/DoD evidence model story work already has.

This costs three things, continuously, not as an edge case:

1. **Invisible capacity drain** — reactive work silently eats engineering time that planning never sees, so forward-looking commitments slip for reasons that never show up anywhere.
2. **No governed trail for reactive work** — unlike a story (discovery → DoR → DoD artefacts), an incident or hotfix leaves no equivalent record, so there's nothing for `/trace` or `/improve` to learn from on that side of the work.
3. **This repo is also a reference/test bed for an enterprise fork running in parallel on a separate codebase** (the `skills_upstream:`/fork relationship scaffolded in `bootstrap/SKILL.md` Option C, and referenced in `docs/HANDOFF.md`'s design-port package). Whoever maintains that relationship needs this repo's own reactive-vs-proactive practice to be legible and portable as a reference pattern, not just locally convenient — since the fork relationship works by referencing this repo's outer-loop artefacts and running the outer loop independently against the fork's own, already-diverged codebase (not by inheriting code directly), the clarity of this practice as a *reference* matters more than its literal portability as code.

Who experiences it, daily: engineers switching between planned and reactive work with no single place reflecting both; team leads/EMs trying to assess real team load with only half the picture; and, less frequently but materially, whoever stewards the enterprise-fork relationship, who needs this repo's own practice to be legible and reference-worthy.

## Who It Affects

1. **The delivery engineer** (e.g. a squad member working in this repo day-to-day) — runs both planned story work (through the governed inner loop) and reactive operational work (patches, hotfixes, incident response) in the same day, with no single place that reflects the mix. Trying to accomplish: know what's actually on their plate right now, across both kinds of work, without manually reconciling two separate systems.
2. **The team lead / EM** — needs a true read on team capacity and status for planning and reporting, but today can only see the forward-looking half (via the product detail page's consolidated features section); reactive load is invisible to them unless someone mentions it. Trying to accomplish: accurate team-load visibility and status reporting that doesn't silently under-count reactive work.
3. **The platform maintainer stewarding the enterprise-fork relationship** (the operator, in this repo's actual case) — needs this repo's own reactive-vs-proactive practice to be a legible, portable reference pattern for a fork that re-derives its own equivalent from referenced artefacts, not just an internal convenience. Trying to accomplish: a visibility model mature and general enough to be worth referencing, not something so bespoke to this repo's quirks that it doesn't transfer.

## Why Now

Three things converge right now, not before:

1. **Platform readiness, just reached.** The inner-loop-cycle-efficiency work (`ilce-s1`–`s4`, `bcfx-s1`) just completed (2026-11-06/07), hardening the pipeline's own CI and inner-loop reliability. That hardening is what makes the platform ready to take on a new external-facing surface — it's precondition, not evidence this was already planned.
2. **The other three initiatives in this tranche would have nowhere to land.** The CI/CD patch/deploy/monitor automation and incident-triage-and-respond initiatives (both going into their own discovery) will start generating exactly the kind of reactive-work data this surface needs to show. Building the visibility surface after those ship means retrofitting; building it in parallel, informed by their scope, means the data model is right from the start. (Note: `/programme` revival is not a reactive-work data source the way the other two are — it's cross-workstream coordination, parallel rather than upstream to this initiative.)
3. **The enterprise-fork relationship is active, not hypothetical.** The fork mechanism already exists (`bootstrap/SKILL.md` Option C, the `skills_upstream:` sync config) — so whether this repo's reactive-work practice is a legible, reference-worthy pattern is a live question now, not a someday one.

This is accumulated-pain-reaching-a-decision-point more than a single external trigger: reactive work has had zero governed visibility for this platform's entire life; today is when capacity, adjacent initiatives, and the fork relationship all point the same direction at once.

## MVP Scope

A richer first slice, still built entirely on artefacts that already exist and are already governed (no dependency on the CI/CD-automation or incident-response initiatives, which don't exist yet):

1. **Automatic sync on repo connection** — `[ADDED 2026-11-09 at /definition, see decisions.md]` connecting a product to a GitHub repo (`product-repo.js`'s `_applyRepoChange`) today only backfills local journey data *out* to the repo; it never triggers `product-rollup.js`'s `triggerProductSync`, which is the only thing that pulls the repo's `pipeline-state.json` *in*. No scheduled resync exists either — the only trigger is a manual "Refresh" click (`POST /products/:id/sync`). Every other item below sits on top of this data, so a newly-connected product shows nothing real until someone happens to click Refresh. Wire an automatic sync kick-off into `_applyRepoChange` immediately after a successful repo connection.
2. **Reactive-work rendering** — carry `feature.track` through `computeTaxonomyRollup`/`mergeFeatureSources` (currently dropped) so short-track items (`bcfx-s1`-shaped, already in `pipeline-state.json`) are visually tagged reactive vs. planned inside `_renderConsolidatedFeaturesSection`.
3. **Reactive-work source widened to `decisions.md`** — RISK-ACCEPT and SCOPE entries logged during delivery (e.g. the `ilce-s3` CI-runner-pin deviation) are also real, already-governed signals of reactive judgment calls that happened outside a formal story. Surface these as a second reactive-work source, read via the existing `fetchRepoPath` GitHub-contents adapter (`artefact-fetcher.js`) already proven by `decisions-log-writer.js`, not new GitHub API code.
4. **A basic load rollup** — per squad/engineer, a count of active reactive vs. planned items, extending the health-filter-chip/tab mechanics (By Module / By Phase / All) already shipped inside `_renderConsolidatedFeaturesSection` rather than building new filter mechanics. `org-kanban-filter-ui-gap`'s `kb-filter-form` (a server-side GET-query-param filter) was the originally-cited precedent, but that lives in `kanban-view.js` and is journeys-only (org-scope kanban) — the real, applicable precedent is this page's own already-shipped client-side filter/tab pattern. This is the piece that actually serves the EM persona's stated need (team-load visibility) — card-rendering alone doesn't.

Still explicitly deferred: incident records, patch/deploy events, and fork-sync status — none of these artefact types exist yet; they land when their own initiatives ship and can then feed this same surface without a redesign, since the rendering and rollup mechanics built here are artefact-source-agnostic.

This is 3-4 real stories rather than one, which justifies the fixed overhead of one full outer-loop pass rather than a one-card MVP that would reopen discovery almost immediately for the rollup.

## Out of Scope

- **Incident records and patch/deploy events as data sources** — these artefact types don't exist yet; they're scope for the incident-triage-and-respond and CI/CD-automation initiatives. This surface's rendering/rollup is built artefact-source-agnostic so it can pick them up later without a redesign, but it renders nothing from them now.
- **Live enterprise-fork sync/drift status** — the fork-relationship persona need is real (see Problem Statement), but showing live sync health would require querying the fork's own repo state, a distinct capability. Deferred past this MVP.
- **Freeform ticket creation or arbitrary ad-hoc task entry** — by `product/mission.md`'s own boundary (revised 2026-11-08), everything shown must trace back to a real governed artefact (`pipeline-state.json`, `decisions.md`). No new freeform ticket field, no manual task creation UI.
- **Sprint velocity tracking or stakeholder-report generation** — explicitly excluded by the `product/mission.md` boundary this initiative operates under; not revisited here.
- **The post-DoD deferred-scope/delayed-metric follow-through mechanism** — raised during this discovery and split out as its own, separate 5th discovery (queued after the original four); this surface doesn't attempt to solve it, even though the two are related.
- **Changes to `_renderConsolidatedFeaturesSection`'s existing forward-looking rendering** (features/stories/phases/health) — this work is strictly additive; existing behaviour isn't touched. `kanban-view.js` itself is untouched — it isn't the target surface and has no bearing on this initiative.

## Assumptions and Risks

[ASSUMPTION — RESOLVED 2026-11-08 via /clarify] Build now rather than waiting for the CI/CD-automation and incident-triage-and-respond initiatives to reach `/definition`. This MVP's actual data dependencies (short-track stories, `decisions.md` entries) are already stable and don't require those initiatives' artefact shapes. Residual risk — a future incompatible shape — is bounded to "add a rendering adapter," not "redesign this MVP," so it doesn't justify delay.

[ASSUMPTION — RESOLVED 2026-11-08 via /clarify] The short-track-stories + `decisions.md` proxy is accepted as-is for MVP; no manual capture mechanism is added now. The undercount risk is deliberately deferred to measurement (success indicator #4) rather than solved speculatively — a capture mechanism would reopen the "no freeform ticket entry" out-of-scope boundary, which should only happen with real evidence of a large gap, not a guess.

[ASSUMPTION — RESOLVED 2026-11-08 via /clarify, see Directional Success Indicators] The enterprise-fork relationship maintainer persona's actual consumption path is the discovery/definition text artefacts, not the live UI (confirmed by the operator). The "fork-worthy" success indicator was dropped accordingly — see below.

[ASSUMPTION — RESOLVED 2026-11-08 via /clarify; CORRECTED 2026-11-09 at /definition, see decisions.md] Extending the filter mechanics for a reactive/planned toggle is confirmed straightforward — but the originally-cited precedent was wrong. `products.js:3460` and `kanban-view.js`'s `kb-filter-form` (lines 265–286) are the org-scope kanban's server-side GET-query-param filter, which only ever filters journeys-sourced items — not applicable here. The real, correct precedent is `_renderConsolidatedFeaturesSection`'s own already-shipped client-side tab/filter mechanics (By Module / By Phase / All, plus health-filter chips) inside `_renderProductView` (`products.js:1122`). A `workType` (reactive/planned) filter follows that pattern instead — still no new filtering mechanism needed, just the right existing one.

**Known constraint, not an assumption:** this touches `src/web-ui/`, so per `product/constraints.md` #9, design-system compliance is a DoR hard block (`H-DESIGN`) once `hasDesignSystemTrack: true` is set on the story.

**What could make this not worth building:** if reactive work mostly stays informal (Slack threads, verbal handoffs) rather than getting captured as short-track stories or `decisions.md` entries, the rollup will look complete while quietly missing most of the real signal — the worse failure mode here isn't "nobody uses it," it's "people trust an incomplete number."

## Directional Success Indicators

1. **Reactive-work coverage on the surface.** Baseline: 0% — confirmed today, `_renderConsolidatedFeaturesSection` renders zero short-track stories visually tagged as reactive (the data flows through but `track` is dropped) and zero `decisions.md` reactive entries (no path in at all). Target: 100% of existing short-track stories and `decisions.md` RISK-ACCEPT/SCOPE entries rendered on the surface (full coverage of what already exists, not a sample). Measured via: a count-comparison script — reactive entries in `pipeline-state.json`/`decisions.md` vs. entries actually rendered.
2. **EM/team-lead real usage for load visibility.** Baseline: `[UNKNOWN BASELINE]` — no usage metric can exist before the surface ships. Target: at least one observed instance of a team lead using the reactive/planned rollup to inform a real planning or reporting decision, within the first month post-ship. Measured via: direct follow-up/observation, not a synthetic usage count.
3. ~~Fork-relationship reference value~~ — **REMOVED 2026-11-08 via /clarify.** The fork-steward persona's actual consumption path is the discovery/definition text artefacts, not the live UI, so artefact clarity is a cross-cutting documentation-quality bar rather than evidence this specific feature succeeded. The "legible reference" concern is carried forward as writing guidance for `/definition` instead (see Constraints) — not as a measured post-ship indicator.
4. **Rollup completeness (the undercount risk named in Assumptions and Risks).** Baseline: `[UNKNOWN BASELINE]` — we don't currently know what fraction of real reactive work gets captured in short-track stories or `decisions.md` versus staying informal (Slack, verbal). Target: establish a real baseline for the undercount rate within the first month via a spot-check (compare a sample week of informal reactive work against what the surface shows), rather than assuming completeness. This indicator's purpose is to surface the risk honestly, not to claim a clean number early.

## Constraints

**Confirmed, not assumed — the enterprise-fork maintenance model:** the enterprise fork does not consume this repo's code via the `skills_upstream:` sync path (that path covers `skills/`, `templates/`, `scripts/`, `docs/skill-pipeline-instructions.md` only, and never `src/`, regardless of divergence). Instead, the fork maintenance model is: reference this repo's outer-loop artefacts (discovery, benefit-metric, definition documents — the artefacts this very skill produces) and then run the outer loop independently against the fork's own, already-substantially-diverged codebase. The fork doesn't inherit `_renderConsolidatedFeaturesSection` (or any other web-ui code) directly; it re-derives its own equivalent from the referenced artefacts. This changes what persona 3's "fork-worthy" need actually means: it isn't about this code being sync-portable — it's about this discovery (and its downstream definition) being clear and general enough to serve as a legible starting reference for whoever re-scopes the equivalent capability against the fork's own diverged codebase. The deliverable that matters to that persona is the quality of this artefact chain itself, not a file path. (CLAUDE.md and `skills/bootstrap/SKILL.md` were corrected 2026-11-08 to reflect this model accurately — see PR #1057 and commit `7edff486`.)

Also applicable (confirmed from `product/constraints.md`): #9, design-system compliance is a DoR hard block once `hasDesignSystemTrack: true` is set, since this touches `src/web-ui/`. #6, surface type will be auto-injected via the EA registry at `/definition` since `architecture.ea_registry_authoritative: true` — though no EA registry entry currently exists for this system (see EA Registry Check above), so Path B (`context.yml` explicit declaration) will likely apply instead.

No time/budget/team-capability constraints identified beyond these.

## Contributors

- Hamish King — Platform Owner — 2026-11-08

## Reviewers

- [None yet]

## Approved By

Hamish King — Platform Owner — 2026-11-08

---

## Clarification log

[2026-11-08] Clarified via /clarify:
- Q: Should this MVP be built now, or wait for the CI/CD-automation and incident-response initiatives to lock their artefact shapes first? A: Build now — this MVP's actual dependencies (short-track stories, `decisions.md`) are already stable; future shape mismatches cost an adapter, not a redesign.
- Q: Is the short-track-stories + `decisions.md` proxy good enough for MVP, or should a manual capture mechanism be added now to reduce undercount risk? A: Accept the proxy as-is; defer the capture-mechanism question to real measurement (indicator #4) rather than building against an unmeasured risk.
- Q: Would the fork-steward persona actually consult this surface, or is their need already served by the artefact-reference mechanism alone? A: Served by artefacts alone — dropped the "fork-worthy" success indicator; kept persona 3 as context, moved the "legible reference" concern into writing guidance for `/definition`.
- Q: Is extending `org-kanban-filter-ui-gap`'s filter mechanics for a reactive/planned toggle straightforward? A: Confirmed in code — `products.js:3460` and `kanban-view.js`'s `kb-filter-form` show an established GET-query-param + server-side-filter pattern; a `workType` filter follows it directly.

---

**Next step:** Human review and approval → /benefit-metric
