# Discovery: Journey CX/UX redesign — journey map + placeholder-feature trigger

**Status:** Clarified
**Created:** 2026-10-11
**Approved by:** Hamish King — Platform Owner — 2026-10-11
**Author:** Claude (session), confirmed section-by-section with Hamish King (Platform Owner)

---

## Problem Statement

The Customer experience tab — which already holds the right data per journey stage (emotion, pain points, opportunities, touchpoints) and the right shape (swimlane-style) — currently renders that data as plain text with no visual treatment: no emotion curve, no persona framing, nothing that makes it read as a journey map. Separately, the free-form canvas (`ic-s1`–`ic-s4`) was built to let operators lay out and connect journey stages spatially, but it was never meant to carry the empathy/stakeholder-communication job a journey map does — and per the CX spike (`spikes/cjm-best-practice-outcome.md`), trying to make it do that job by restyling it fights its own structural category (a flow/process diagram, not a journey map). The result: when the operator compares what they have to real journey-map references (Spotify flow, supermarket shopping map, Hustle Badger template), neither view matches — not because the data or the canvas work is wrong, but because the presentation job (a standards-compliant journey map) was never actually built yet.

## Who It Affects

The outer loop practitioner (PO / SME / discovery lead) — the same persona `ic-s1`–`ic-s4` were built for. They use the journey feature to build shared understanding of a customer's experience with stakeholders (reviewing with a team, presenting in a discovery session, aligning on where pain points and opportunities sit). Today, when they reach for the Customer experience tab to do that — the part of the tool actually meant to carry that stakeholder-communication job — it reads as a data dump, not something they'd put in front of a room or point a new team member to for a quick, intuitive read of "where does this journey hurt, and for whom."

## Why Now

The `canvas-replacement-for-journey-stages` epic (`ic-s1`–`ic-s4`, plus the `ic-hotfix1` production fix) just shipped in full. The operator flagged this exact gap mid-epic — sharing the 3 reference examples as a quality bar — and deliberately chose not to fold it into `ic-s3`/`ic-s4`'s scope at the time, logging it instead as "revisit once the epic ships" (`workspace/capture-log.md`, 2026-10-11). The epic shipping is the trigger: it's the natural checkpoint to evaluate the delivered CX/UX against that already-set bar, before the team moves on to other work and the gap becomes harder to justify revisiting.

## MVP Scope

Redesign the Customer experience tab to render as an actual journey map: a connected emotion curve across stages (using the already-captured `emotion` field) and a persona card (single-persona scope). Primary new capability: each journey stage can have one or more **features mapped to it** — reusing `ep2-s3`'s existing `feature_customer_journey_stage_mappings` data model, which today only supports mapping *already-built* features. This MVP extends it so a stage can also hold a **placeholder feature** — a named-but-not-yet-built feature slot — that, when triggered, kicks off a new outer-loop run (`/discovery`) for that feature, seeded with the journey-stage context it came from. This ties the journey map directly to the pipeline: the primary expected use case is a **new** journey map where no features exist yet (the map itself becomes the source of new feature ideas, one placeholder per stage), with mapping to pre-existing features as a secondary, occasional case.

MVP must include an explicit "no emotion data yet" empty state for the emotion curve — per `/clarify`, existing journeys' `emotion` field is mostly empty today, so most journeys will render with no real curve on day one unless this is designed for explicitly.

MVP must also include an explicit authorization/tenant-scoping verification pass across the new placeholder-trigger and mapping-conversion routes (added at `/definition`, 2026-10-11) — a direct, necessary consequence of introducing a genuinely new mutating surface under ADR-025's existing multi-tenancy constraint, not an optional hardening nicety. This mirrors the real gap `ic-s2`'s own DoD found and fixed for its position route.

Deferred from MVP: per-stage illustration/storyboard (supplementary, not core per the spike), and the Hustle-Badger-style build-order callouts.

## Out of Scope

- **Per-stage illustration/storyboard** — supplementary per the CX spike, not core; can be layered in later without disrupting this MVP's structure.
- **Hustle-Badger-style build-order callouts** — a deliberate departure from generic best practice, not decided in scope for this MVP (can revisit as a follow-up once the core journey map + placeholder-feature mechanism ships).
- **Restyling or rebuilding the free-form canvas itself** — its purpose is reframed (documentation/framing only), not its implementation; `ic-s1`–`ic-s4`'s shipped code is untouched.
- **Multi-persona support per journey map** — single-persona scope for MVP, per journey-mapping best practice; multi-persona is a named extension pattern in some tools but not the default, and not needed for the primary new-journey-map use case.
- **Downstream lifecycle once a placeholder feature's triggered `/discovery` completes** (e.g., automatic bidirectional linking back to the journey stage, re-scoping if the resulting feature doesn't match the stage anymore) — the MVP scope is triggering the new outer-loop run with seeded context; deeper lifecycle/sync behavior between the journey stage and the resulting feature is a follow-up question, not resolved here.

## Assumptions and Risks

**Confirmed (was [ASSUMPTION], resolved via `/clarify` 2026-10-11):** A triggered placeholder feature creates a new `artefacts/[feature-slug]/` folder and seeds `/discovery`'s Section 1 (problem statement) with the journey stage's own context (name, description, emotion, pain points, opportunities, touchpoints). The operator still walks through the rest of discovery normally — only Section 1 is pre-populated, not the full artefact.

**Confirmed (was [ASSUMPTION], resolved via `/clarify` 2026-10-11):** The journey-stage-to-feature mapping persists and converts automatically from "placeholder" to "linked real feature" once the triggered `/discovery` is approved — the journey map always reflects real pipeline state, not a one-shot disconnected trigger. This means `ep2-s3`'s existing mapping data model needs a new state field distinguishing placeholder from linked.

**Confirmed (was [ASSUMPTION], resolved via `/clarify` 2026-10-11):** Triggering a new outer-loop run from a placeholder feature uses the same authorization as any other mutating action in this app — any non-viewer tenant member can trigger it, matching the uniform convention across every existing mutating route (creating journeys/stages, position updates, feature mappings). No new, finer-grained permission tier is introduced. Rationale: triggering only creates a draft discovery artefact, which still passes through this pipeline's own human-approval gates (discovery approval, DoR sign-off, etc.) before anything real happens — those gates are the structural safeguard against low-quality triggers, not a special access check. If usage data later shows this needs tightening (e.g. admin-only), that is a natural follow-up, not pre-built now.

**Confirmed (was [ASSUMPTION], resolved via `/clarify` 2026-10-11):** Existing journeys' `emotion` field is mostly empty — this is genuinely new behaviour operators haven't used yet via the current plain-text Customer experience tab. MVP scope must therefore include an explicit "no emotion data yet" empty state for the emotion curve (not an assumption of pre-populated real curves from day one) — this is now a required MVP element, not a deferred nicety.

**Risk:** rendering a real emotion curve likely needs either a charting approach or custom SVG — the same "no new npm dependency unless justified" tension `ic-s1`'s own `decisions.md` spike already resolved once for the canvas library; this may need its own small spike rather than being assumed trivial.

**Risk:** the placeholder-feature → triggered-outer-loop-run mechanism is a new category of thing in this app (UI action kicking off a backend pipeline run, not a human typing a skill invocation) — real engineering risk in *where* that trigger lives and how it's wired, not just a UI design question.

**What could make this not worth building:** if the emotion-curve + persona-card redesign alone doesn't meaningfully close the operator's own gap vs. the reference examples (i.e., presentation wasn't actually the whole problem), or if the placeholder-feature trigger mechanism turns out to need disproportionate engineering effort relative to how often operators actually start from a journey map rather than directly in `/discovery`.

## Directional Success Indicators

**Operator CX judgment vs. the reference bar:** Baseline: today, the Customer experience tab does not read as a journey map (operator's own direct feedback this session, and the trigger for this entire initiative). Target: operator judges the redesigned tab as genuinely matching or approaching the quality of the 3 reference examples, not just "different." Measured via: direct operator review once shipped — same mechanism as the prior epic's own M2 ("Operator CX judgment vs. the list view it replaced").

**Placeholder-feature trigger actually used:** Baseline: 0 (mechanism doesn't exist yet). Target: ≥1 placeholder feature triggered from a journey stage and reaching `/discovery` approval within a defined window post-release (exact window TBD at `/benefit-metric`). Measured via: `pipeline-state.json` — new feature entries carrying a "triggered-from-journey-stage" provenance marker.

**Emotion/persona data actually populated:** Baseline: `[UNKNOWN BASELINE]` — current `emotion` field population rate across existing journey stages hasn't been checked. Target: TBD once baseline is known. Measured via: a direct database query count once this ships (and worth running now, pre-build, to establish the real baseline).

## Constraints

**Accessibility (WCAG 2.1 AA, hard floor, not a performance NFR)** — `product/constraints.md` #9. The emotion curve, persona card, and placeholder-feature trigger must all be keyboard-accessible and screen-reader-friendly from the start, not retrofitted later — the same discipline `ic-s4` already established for the canvas.

**No new npm dependency unless justified by direct comparison** — matches `ic-s1`'s own precedent (the `drawflow.js` vs. Cytoscape spike); an emotion-curve charting approach would need the same justification if a library is proposed.

**Design artefacts are referenced, not generated by this platform** (`product/constraints.md` #10) — once this reaches `/design`, expect wireframes/visual specs to be produced and referenced, not fabricated inline.

**Multi-tenancy / data isolation** — the placeholder-feature trigger mechanism must follow the same tenant-scoping and ownership-check-before-mutation pattern already established across this app (D13).

## Contributors

- Hamish King — Platform Owner

---

## /clarify recommendation

This discovery contains 4 unconfirmed assumptions that affect scope and benefit measurement. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- A triggered placeholder feature creates a new feature-slug folder under `artefacts/` and seeds `/discovery`'s Section 1 with the journey stage's own context
- The journey-stage-to-feature mapping should persist and convert from "placeholder" to "linked real feature" once the triggered `/discovery` is approved
- Triggering a new outer-loop run from a placeholder feature uses the same authorization as a normal manual `/discovery` invocation
- Existing journeys' `emotion` field data is populated with enough coverage/granularity to render a meaningful emotion curve

These assumptions must be confirmed or refuted before scope can be locked. Running `/benefit-metric` with unresolved assumptions produces metrics that will require revision after clarification.

---

## Clarification log

[2026-10-11] Clarified via /clarify:
- Q: What exactly does triggering a placeholder feature do?  A: Creates a new `artefacts/[feature-slug]/` folder and seeds `/discovery`'s Section 1 only with journey-stage context; operator still walks through the rest of discovery normally.
- Q: Should the journey-stage mapping persist and convert from "placeholder" to "linked real feature" once the triggered discovery is approved?  A: Yes — persists and auto-converts; requires a new state field on `ep2-s3`'s existing mapping model.
- Q: Does triggering a new outer-loop run use the same authorization as a normal manual `/discovery` invocation?  A: Yes — same as any other mutating action (non-viewer tenant member); no new permission tier. The pipeline's own human-approval gates are the structural safeguard, not a special access check.
- Q: Is the existing `emotion` field populated widely enough to render a meaningful emotion curve?  A: Mostly empty today — MVP must include an explicit "no emotion data yet" empty state, now a required MVP element (added to MVP Scope).
