## Story: Self-registration at the moment of deferral

**Epic reference:** artefacts/2026-11-08-deferred-decision-follow-through/epics/ddft-e1-follow-through-mechanism.md
**Discovery reference:** artefacts/2026-11-08-deferred-decision-follow-through/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-deferred-decision-follow-through/benefit-metric.md

## User Story

As a **delivery engineer / platform owner reviewing what's been deferred**,
I want to **have `/discovery`, `/decisions`, and `/definition-of-done` automatically register a deferred-item record the moment they defer something**,
So that **this mechanism's own future scope — and every other feature's — feeds itself without anyone needing to remember a manual follow-up step that, per this whole initiative's premise, usually never happens**.

## Benefit Linkage

**Metric moved:** Self-registration coverage
**How:** This story is the only mechanism that can deliver "100% of deferrals from all hooked skills register automatically, zero manual steps" — ddft-s1's schema and ddft-s2's scan both depend on records actually existing, and without this story, every record still requires someone to remember to create one manually.

## Architecture Constraints

- **`[CORRECTED 2026-11-09 at /review, see decisions.md]` Three separate governed-file PRs — the third skill changed, the count didn't.** `skills/discovery/SKILL.md`, `skills/decisions/SKILL.md`, and `skills/definition-of-done/SKILL.md` (swapped in for the originally-named `skills/benefit-metric/SKILL.md`) are three independent files with independent review surfaces; per CLAUDE.md's Platform change policy, each gets its own branch + PR. `/review` found AC3 (below) described a condition (`not-yet-measured` *at DoD time*) that `/benefit-metric`'s own hook point cannot observe, since that section runs once at authoring time when every metric is unmeasured by construction. The real hook for that condition is `/definition-of-done`'s own Step 6 ("Metric signal") / State-update section, confirmed by reading `skills/definition-of-done/SKILL.md:184-288`: Step 6 is exactly where, at DoD time, a metric's signal is determined and recorded as `not-yet-measured` (with an operator-supplied evidence note) when measurement isn't yet possible — this already-standardized flow is the real, correct trigger point this AC needs. `/benefit-metric` is dropped from this story's hook set entirely, not added to it.
- **Hook points already verified real** (not assumed): `skills/discovery/SKILL.md:519`, `skills/decisions/SKILL.md:264`, and `skills/definition-of-done/SKILL.md:274` each already contain a standardized `## State update — mandatory final step` section. This story adds "also write a deferred-item record (if applicable)" as a sub-step within each existing section — it does not restructure or redesign any of the three skills' existing conversational flow.
- `product/constraints.md` #13: a test must verify a record was actually created after a real `/decisions` `RISK-ACCEPT` entry, `/discovery` Out-of-Scope write, or `/definition-of-done` `not-yet-measured` signal — not just that the SKILL.md instruction text was added.
- Per the benefit-metric's own graduated minimum validation signal (updated — see `decisions.md`): at least 1 of the 3 hooked skills correctly self-registering in its next real run is the accepted rollout floor, given this is the most structurally invasive story in the tranche — this is not a reason to under-scope the AC set below, but it is the honest bar this story's DoR should hold itself to if full 3-skill coverage doesn't land in a single pass.

## Dependencies

- **Upstream:** ddft-s1 (the schema each hook writes into).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `/discovery`'s "State update — mandatory final step" section runs and the discovery artefact's Out of Scope section names something deferred, When the skill completes, Then a deferred-item record is automatically created (`source: "discovery-out-of-scope"`) with no manual follow-up step required from the operator.

**AC2:** Given `/decisions`' "State update — mandatory final step" section runs after a `RISK-ACCEPT` entry is logged, When the skill completes, Then a deferred-item record is automatically created (`source: "risk-accept"`) linking to that decision entry.

**AC3:** Given `/definition-of-done`'s Step 6 ("Metric signal") records a metric's signal as `not-yet-measured` (with its required operator-supplied evidence note) for a story reaching DoD, When that section's own State-update write happens, Then a deferred-item record is automatically created (`source: "unmeasured-benefit-metric"`) carrying the metric name and the evidence note as the record's `revisitCondition` — this is the real DoD-time trigger point `/definition-of-done`'s own Step 6 already provides, corrected from the original (incorrect) `/benefit-metric`-hook design. `/benefit-metric`'s own hook is dropped from this story entirely — its State-update section runs at authoring time, when every metric is unmeasured by construction, so it has no condition of its own this story's intent needs it to detect.

**AC4:** Given any of the three hooks fires, When the record is created, Then it is written via the same `workspace/incidents.json` mechanism ddft-s1 established — no skill invents its own separate storage path.

**AC5:** Given the three hooks are implemented as three separate PRs, When each is tested independently, Then each hook's own test plan asserts record creation for that specific skill's trigger condition — a passing test for one hook must never be assumed to imply the other two also work.

## Out of Scope

- Any change to the three skills' existing conversational flow, question ordering, or operator-facing prompts — purely additive within the existing final-step section.
- Retroactively registering any past deferral from before this story ships — new deferrals going forward only, per this epic's Out of Scope.

## NFRs

- **Performance:** Not applicable — a single additional write at the end of an already-running skill session, not a new standing process.
- **Security:** None beyond ddft-s1's existing data handling.
- **Accessibility:** Not applicable — no UI in this story.
- **Audit:** Each auto-created record's `source` field is itself the audit trail for which hook created it and why.

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
