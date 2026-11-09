## Story: Self-registration at the moment of deferral

**Epic reference:** artefacts/2026-11-08-deferred-decision-follow-through/epics/ddft-e1-follow-through-mechanism.md
**Discovery reference:** artefacts/2026-11-08-deferred-decision-follow-through/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-deferred-decision-follow-through/benefit-metric.md

## User Story

As a **delivery engineer / platform owner reviewing what's been deferred**,
I want to **have `/discovery`, `/decisions`, and `/benefit-metric` automatically register a deferred-item record the moment they defer something**,
So that **this mechanism's own future scope — and every other feature's — feeds itself without anyone needing to remember a manual follow-up step that, per this whole initiative's premise, usually never happens**.

## Benefit Linkage

**Metric moved:** Self-registration coverage
**How:** This story is the only mechanism that can deliver "100% of deferrals from all 3 hooked skills register automatically, zero manual steps" — ddft-s1's schema and ddft-s2's scan both depend on records actually existing, and without this story, every record still requires someone to remember to create one manually.

## Architecture Constraints

- **Three separate governed-file PRs, not one** — `skills/discovery/SKILL.md`, `skills/decisions/SKILL.md`, and `skills/benefit-metric/SKILL.md` are three independent files with independent review surfaces; per CLAUDE.md's Platform change policy, each gets its own branch + PR, even though the implementation plan may group the underlying work.
- **Hook points already verified real** (not assumed): `skills/discovery/SKILL.md:519`, `skills/decisions/SKILL.md:264`, `skills/benefit-metric/SKILL.md:295` each already contain a standardized `## State update — mandatory final step` section. This story adds "also write a deferred-item record (if applicable)" as a sub-step within that existing section — it does not restructure or redesign any of the three skills' existing conversational flow.
- `product/constraints.md` #13: a test must verify a record was actually created after a real `/decisions` `RISK-ACCEPT` entry or `/discovery` Out-of-Scope write — not just that the SKILL.md instruction text was added.
- Per the benefit-metric's own graduated minimum validation signal: at least 1 of 3 hooked skills correctly self-registering in its next real run is the accepted rollout floor, given this is the most structurally invasive story in the tranche — this is not a reason to under-scope the AC set below, but it is the honest bar this story's DoR should hold itself to if full 3-skill coverage doesn't land in a single pass.

## Dependencies

- **Upstream:** ddft-s1 (the schema each hook writes into).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `/discovery`'s "State update — mandatory final step" section runs and the discovery artefact's Out of Scope section names something deferred, When the skill completes, Then a deferred-item record is automatically created (`source: "discovery-out-of-scope"`) with no manual follow-up step required from the operator.

**AC2:** Given `/decisions`' "State update — mandatory final step" section runs after a `RISK-ACCEPT` entry is logged, When the skill completes, Then a deferred-item record is automatically created (`source: "risk-accept"`) linking to that decision entry.

**AC3:** Given `/benefit-metric`'s "State update — mandatory final step" section runs and a Tier 1 or Tier 2 metric is left with `signal: "not-yet-measured"` at the point the feature later reaches DoD, When this condition is detected, Then a deferred-item record is automatically created (`source: "unmeasured-benefit-metric"`) — this AC's trigger point is DoD-time measurement status, not benefit-metric authoring time, since a metric is expected to be unmeasured when first defined.

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
