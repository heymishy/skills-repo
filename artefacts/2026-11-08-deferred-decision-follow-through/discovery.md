# Discovery: Deferred Decision Follow-Through

**Status:** Approved
**Created:** 2026-11-08
**Approved by:** Hamish King — Platform Owner — 2026-11-08
**Author:** Claude Sonnet 5 (conversational discovery session with operator)

---

## EA Registry Check

`architecture.ea_registry_authoritative: true` in `.github/context.yml`. No EA registry entry exists for `workspace/state.json`'s backlog surface, `decisions.md`'s `RISK-ACCEPT` mechanism, or the broader follow-through surface this initiative builds — proceeding without blast-radius data. This does not block discovery.

---

## Problem Statement

Once a decision is made to defer something — scope cut at discovery, a metric left `not-yet-measured`, a known gap accepted via `RISK-ACCEPT`, a backlog item parked in `workspace/state.json`, a finding logged to `capture-log.md` for "later" — nothing in this pipeline ever resurfaces it. The clearest structural instance is post-DoD: a story can be "done" by every pipeline gate while its own stated success metrics remain permanently unverified (confirmed: all 3 metrics on the fully-delivered `tenant-admin-bootstrap` feature still show `signal: "not-yet-measured"`). The same gap recurs elsewhere in this session: the `tfhc-s1` pipeline-integrity failure left unfixed as "out of scope," the C1-vs-Option-C contradiction deferred to "a future `/product/` refresh," and several stale `workspace/state.json` backlog threads. `decisions.md`'s `RISK-ACCEPT` category already has a `Revisit trigger` field, but verified during this discovery that every real example across this repo's history is free-form prose describing a judgment call, never a parseable condition — so the right mechanism is a periodic, bounded review that surfaces unresolved items for a human to judge, not automated trigger-detection. Real signal exists to inform that review: PostHog's `stage_completed`/`stage_started` events carry `featureSlug`, `skillName`, `costUsd`, and token counts, and `artefact_commit_failed`/`succeeded` give real commit-reliability data — genuine telemetry for pipeline/tooling health, though not for the business-level metrics named in actual benefit-metric artefacts, which still need separate instrumentation this MVP doesn't build. Finally, this initiative must apply to itself: its own deferred items (the business-metric instrumentation gap, any scope cut from its own MVP) need to become structured records the moment they're deferred, not forgotten discovery prose — otherwise the mechanism that fixes this gap everywhere else would still have the gap for itself.

## Who It Affects

**The delivery engineer / platform owner reviewing what's been deferred** — the same single persona established across initiatives 2 and 4 (`context.yml`'s `meta.scope: personal`), now in the role of periodically reviewing what's been deferred across the whole pipeline rather than rediscovering it by accident, the way `tenant_admin_bootstrap_failed` and the `tfhc-s1` gap were both found this session.

## Why Now

Three things converge:

1. **Platform readiness, just reached** — same precondition as the other four initiatives in this tranche: `inner-loop-cycle-efficiency` just completed, hardening CI/pipeline reliability.
2. **Four of the five initiatives in this very tranche have already deferred real things during their own discovery** — initiative 2's unaddressed `dompurify` finding, initiative 4's business-metric instrumentation gap, initiative 3's open "if the dry-run finds something structurally broken" assumption. This gives initiative 5 immediate, real backlog to prove itself against the moment it ships, not a hypothetical future case.
3. **Without this, every other initiative in the tranche inherits the same undetected-drift risk this session found in `/programme`** — a capability or decision that sits unexercised/unrevisited, with nobody noticing it's drifted or been forgotten, until someone goes looking specifically.

## MVP Scope

A 5-story MVP, consistent with the widened-slice pattern used throughout this tranche:

1. **Deferred-item record mechanism** — generalizes initiative 4's incident-record schema (its story 1) with a `type` field (`incident` | `deferred-item`), capturing source (discovery Out-of-Scope, `RISK-ACCEPT`, unmeasured benefit-metric, capture-log entry, backlog thread), the human-readable revisit condition, and linked feature/story. Validated against 2 real cases from this session: the `tfhc-s1` pipeline-integrity failure (still unfixed, deliberately deferred) and the C1-vs-Option-C fork-distribution contradiction (deferred to a future `/product/` refresh), registered as real records rather than synthetic test data. Fixing `tfhc-s1` itself stays out of scope — only correctly registering and surfacing it is in scope.
2. **Periodic review scan** — bounded, triggered script (same pattern as initiative 3's story 3) that surfaces unresolved deferred-item records for human judgment — not automated trigger-detection, which this discovery confirmed isn't feasible against today's free-text data. Confirmed to correctly surface both seeded real records on its first run.
3. **Real telemetry signal feed** — pulls PostHog `stage_completed`/`stage_started` (cost, tokens, `featureSlug`) and `artefact_commit_failed`/`succeeded` data into the review as supporting evidence, not as an auto-decision. Verified real volume during /clarify: this telemetry is sparse today (`stage_completed` fired once in 60 days; `artefact_commit_succeeded`/`failed` once each in 3 months; `kanban_viewed` and `stage_started` had more signal, 55 and 25 events respectively over 3 months, but still thin) — so this story treats PostHog data as supplementary context when present, never a primary or guaranteed source.
4. **Self-registration at the moment of deferral** — `/discovery`'s Out of Scope, `/decisions`' `RISK-ACCEPT`, and `/benefit-metric`'s still-unmeasured metrics at DoD each write a story-1 record automatically, so this initiative's own future scope (and every other feature's) feeds the same mechanism without anyone needing to remember.
5. **Web UI rendering** — extends the same surface initiative 4's story 3 builds, rendering deferred-item records alongside incident records as a second record type, not a separate view.

**Delivery surface:** stories 1–4 are harness/Claude Code-only. Story 5 is the one web UI story — it pulls in design-system compliance (constraint #9, `hasDesignSystemTrack: true`), consistent with initiative 4's story 3.

## Out of Scope

1. **Automated trigger-condition detection** — confirmed infeasible given free-text `Revisit trigger` fields across this repo's real history. This builds periodic human-review surfacing only, never auto-detection of whether a condition has actually been met.
2. **Building new business-level product instrumentation** — the `tenant-admin-bootstrap`-style metric gap is surfaced as a deferred-item record, not closed. Wiring real events for business metrics is its own future effort, not this initiative's job.
3. **Backfilling historical `decisions.md`/`capture-log.md` entries into the new structured format** — story 4 registers new deferrals going forward only, plus the 2 real cases seeded for story 1/2 validation. Retroactively migrating this repo's entire history of past `RISK-ACCEPT`s and out-of-scope items is a one-time task for later, not part of this MVP.
4. **Auto-resolving or auto-closing deferred items** — the mechanism surfaces items for a human to judge; it never marks anything resolved on its own.
5. **Adding new product/SDK telemetry beyond what PostHog already captures** — story 3 consumes existing `stage_completed`/`artefact_commit_*` events; it doesn't instrument anything new.
6. **Cross-feature strategic prioritization or ranking of deferred items** — this surfaces everything in scope from its scan; deciding what matters most is a downstream human call, not built here.
7. **Generalizing the record schema beyond `incident` | `deferred-item`** — keep it narrowly typed for this MVP rather than building toward a universal event-record system.

## Assumptions and Risks

[ASSUMPTION — RESOLVED 2026-11-08 via /clarify, by decision] Generalizing initiative 4's incident-record schema (adding a `type` field) is additive and won't require reopening initiative 4's already-approved artefact. Resolved: since neither feature has any implementation yet, doing this now — before either schema is actually built — is additive by construction. There is nothing existing to break.

[ASSUMPTION — RESOLVED 2026-11-08 via /clarify, verified in code — CONFIRMED] Story 4's self-registration hooks into `/discovery`, `/decisions`, and `/benefit-metric` without changing those skills' existing conversational behavior for the operator. Verified: all three skill files already contain a standardized `## State update — mandatory final step` section (`skills/discovery/SKILL.md:519`, `skills/decisions/SKILL.md:264`, `skills/benefit-metric/SKILL.md:295`). Story 4 adds "also write a deferred-item record" as a sub-step within that existing, already-standardized section — genuinely additive, not a redesign.

[ASSUMPTION — RESOLVED 2026-11-08 via /clarify, verified with real data — CORRECTED, not confirmed] PostHog's `stage_completed`/`artefact_commit_*` telemetry has enough real volume/history to be a useful signal, not just a schema that technically exists. Queried real volume: `stage_completed` fired exactly once in the last 60 days; `artefact_commit_succeeded`/`artefact_commit_failed` each fired once in 3 months; `stage_started` had 25 events and `kanban_viewed` 55 events over 3 months — the healthiest of the group, but still thin. The schema and events are real, but this looks like early or partially-wired instrumentation, not mature telemetry. Corrected: story 3 treats PostHog data as supplementary context when present, never a primary or guaranteed source. The sparse firing rate itself is a real candidate for this mechanism's own first deferred-item record once it ships (worth investigating whether the tracking calls are actually wired into real skill execution).

**Known constraint, not an assumption:** story 4 touches three existing governed `SKILL.md` files — each needs its own PR under `CLAUDE.md`'s Platform change policy. Already flagged in the MVP self-check; restated here as locked, not open.

**What could make this not worth building:** if nobody actually reads the periodic review report once it exists, the mechanism adds process overhead without closing the loop it's meant to close — same risk already named for initiative 2's notifications. The fix has to be the same: ship with low enough volume and real signal (not noise) that reviewing it stays worth the time.

## Directional Success Indicators

1. **Deferred-item record mechanism (story 1).** Baseline: 0 structured deferred-item records exist today — `tfhc-s1` and the C1-vs-Option-C contradiction are both known but unstructured (a flagged note, not a record). Target: both real cases exist as structured records. Measured via: confirming both seeded cases are present and correctly typed.
2. **Periodic review scan (story 2).** Baseline: 0% of deferred items have ever been resurfaced for review — `tfhc-s1` has sat unfixed across multiple sessions without once reaching a decision point. Target: 100% of registered records surfaced at least once per scan cycle. Measured via: first scan run includes both seeded real records.
3. **Real telemetry signal feed (story 3).** Baseline: 0% of any review today includes real cost/commit-reliability data — none exists anywhere in the pipeline. Confirmed during /clarify that real volume is currently sparse (`stage_completed` once in 60 days). Target: scan output cites real `featureSlug`-keyed telemetry when it exists for a given feature, and degrades gracefully (no false "no signal" conclusion) when it doesn't. Measured via: a direct check that the report contains real PostHog-sourced figures when available, not static placeholder text, and doesn't silently fail when volume is zero.
4. **Self-registration (story 4).** Baseline: 0% of new deferrals automatically become structured records today — every one requires a manual follow-up step that, per this whole initiative's premise, usually never happens. Target: 100% of deferrals created by `/discovery`, `/decisions`, or `/benefit-metric` after this ships register a record with zero manual steps. Measured via: the next real discovery/decisions/DoD cycle after this ships, confirming record creation happened automatically.
5. **Web UI rendering (story 5).** Baseline: 0 deferred-item records visible anywhere today. Target: deferred-item records render in the shared surface alongside incident records. Measured via: a direct check that the surface renders ≥1 seeded real record without error.

## Constraints

**Governed-file PR requirement, multiplied** — story 4 touches three existing `SKILL.md` files (`/discovery`, `/decisions`, `/benefit-metric`), each needing its own PR under `CLAUDE.md`'s Platform change policy.

**"Not a persistent agent runtime"** (#11) — stories 2 and 3 must be triggered/bounded (a CI job or on-demand script), never a standing watcher — same basis applied across every initiative in this tranche.

**Design-system compliance applies** (constraint #9) — story 5 touches `src/web-ui/`, same as initiative 4's story 3; needs `hasDesignSystemTrack: true` and `H-DESIGN` gate compliance.

**Cross-initiative sequencing constraint:** stories 1 and 5 depend on initiative 4 shipping its story 1 (record schema) and story 3 (UI surface) first — not a blocker for discovery/benefit-metric approval, but binding at `/definition`'s story ordering.

**Credentials are structural** (#12) — if story 3's PostHog data pull runs outside this interactive session (e.g. as a CI-scheduled script), any API key lives in a secrets store, never the agent's own environment — same rule as initiative 2.

**Structural governance preferred over instructional** (#13) — `/definition` should design story 4's hooks so a test can verify a record was actually created after a real `/decisions` `RISK-ACCEPT` or `/discovery` Out-of-Scope write, not just trust that the instruction fired.

**EA registry Path B**, same as initiatives 1–4 — no existing entry for this repo's pipeline tooling.

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
- Q: Is generalizing initiative 4's incident-record schema additive, without reopening its already-approved artefact? A: Resolved by decision — neither feature has any implementation yet, so doing this now is additive by construction.
- Q: Does story 4's self-registration hook into `/discovery`, `/decisions`, and `/benefit-metric` without changing their existing conversational behavior? A: Confirmed in code — all three already have a standardized `## State update — mandatory final step` section to hook into.
- Q: Does PostHog's pipeline telemetry have enough real volume to be a useful signal? A: Corrected, not confirmed — queried real event counts and found the telemetry sparse today (e.g. `stage_completed` fired once in 60 days). Story 3 now treats it as supplementary context, not a primary source, and the sparsity itself becomes a candidate first record for this mechanism.

---

**Next step:** Human review and approval → /benefit-metric
