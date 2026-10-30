## Epic: Test fixture divergence risk closed across journey.js, skills.js, and the E2E layer

**Discovery reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/discovery.md
**Benefit-metric reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/benefit-metric.md
**Slicing strategy:** Vertical slice

<!-- ---CANVAS-JSON: {"type":"program-design","title":"As designed: Program design","content":{"mermaid":"flowchart LR\n    EFIX[tests/e2e/fixtures/seed-journey.js]\n    ESPEC[ep3-s1-regression.spec.js + 2 others]\n    JFIX[tests/helpers/journey-fixture.js]\n    JCONS[3-5 journey.js consumer files]\n    SFIX[tests/helpers/skills-fixture.js]\n    SSELFTEST[tests/check-skills-fixture-self-test.js]\n    SCHECK[scripts/check-skills-fixture-usage.js]\n    SREVIEW[skills/review/SKILL.md]\n    SCONS[1 skills.js consumer proof-of-pattern]\n    CLASSIFY[classification report: 5 seed endpoints]\n    SPIKE1[spike: products.js/journeys.js duplication]\n    SPIKE2[spike: parallelization git-commit-collision risk]\n    ESPEC --> EFIX\n    JCONS --> JFIX\n    SCONS --> SFIX\n    SSELFTEST --> SFIX\n    SCHECK --> SCONS\n    SREVIEW --> SCHECK"}}--->
---CANVAS-JSON: {"type":"program-design","title":"As designed: Program design","content":{"mermaid":"flowchart LR\n    EFIX[tests/e2e/fixtures/seed-journey.js]\n    ESPEC[ep3-s1-regression.spec.js + 2 others]\n    JFIX[tests/helpers/journey-fixture.js]\n    JCONS[3-5 journey.js consumer files]\n    SFIX[tests/helpers/skills-fixture.js]\n    SSELFTEST[tests/check-skills-fixture-self-test.js]\n    SCHECK[scripts/check-skills-fixture-usage.js]\n    SREVIEW[skills/review/SKILL.md]\n    SCONS[1 skills.js consumer proof-of-pattern]\n    CLASSIFY[classification report: 5 seed endpoints]\n    SPIKE1[spike: products.js/journeys.js duplication]\n    SPIKE2[spike: parallelization git-commit-collision risk]\n    ESPEC --> EFIX\n    JCONS --> JFIX\n    SCONS --> SFIX\n    SSELFTEST --> SFIX\n    SCHECK --> SCONS\n    SREVIEW --> SCHECK"}}---

## Goal

A developer or AI coding agent touching `journey.js`, `skills.js`, or an E2E spec that seeds an approval journey has a canonical shared fixture to import at every one of those three surfaces, not just `journey.js`'s unit-test layer. Two inherited unknowns from the original `test-suite-infra-refactor` discovery — whether `products.js`/`journeys.js` share the same duplication problem, and how much of the runner-parallelization git-commit-collision risk remains — are resolved with a recorded verdict, not carried forward indefinitely. One smaller unknown (whether the repo's journey-related E2E seed endpoints are genuinely redundant) is classified and closed within this same cycle.

## Out of Scope

- Full retrofit of all remaining hand-rolled files beyond each story's bounded proof-of-pattern batch — explicitly deferred as a fast-follow (see discovery.md Out of Scope item 1).
- `products.js` implementation — a separately-confirmed, lower-priority fast-follow per `tfhc-s5`'s spike (`journeys.js` is the implementation target unlocked within this MVP's own cycle; `products.js` is not, per discovery.md Out of Scope item 2).
- `scripts/run-all-tests.js` parallelization implementation itself — gated on `tfhc-s8` landing first, not bundled with it (per discovery.md Out of Scope item 3 and `tfhc-s6`'s own outcome artefact).
- The 4 functional E2E coverage gaps (side-trip, spike, recommit, estimate flows) found in the 2026-10-30 E2E audit — intentionally a separate discovery, not this epic's concern.
- Promoting any new structural check to a `/definition-of-ready` hard block — trigger-based on adoption data, not in scope here (discovery.md Out of Scope item 5).

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| E2E seed-fixture duplication (m1) | 0/4 real callers use a shared fixture | 2-3/4 migrated | Story 1 extracts the shared fixture and migrates the proof-of-pattern batch |
| `journey.js` fixture duplication, continued (m2) | 16/41 hand-rolled | 11-13/41 | Story 2 migrates a bounded batch |
| `skills.js` fixture duplication (m3) | 12/45 hand-rolled | 11/45 | Story 3 delivers the full walking skeleton + 1 proof-of-pattern migration |
| Journey-seed-endpoint classification (m4) | 0/5 classified | 5/5 classified with a verdict | Story 4 performs the bounded audit |
| `products.js`/`journeys.js` duplication (m5) | UNKNOWN BASELINE | Confirmed count + verdict | Story 5's spike resolves the unknown; PROCEED unlocks implementation within this epic |
| Parallelization risk resolution (m6) | UNKNOWN BASELINE | Precise remaining-risk list + verdict | Story 6's spike resolves the unknown; PROCEED unlocks implementation within this epic |
| Divergence-bug incidence, extended (m7) | 1 occurrence (`ctpl-s1`) | 0 new across all 3 surfaces | Stories 1-3 close the mechanism gap that let `ctpl-s1`-class bugs happen |
| `journeys.js` fixture duplication (m8) | 30/31 hand-rolled, 0 using even a local factory | 1 migrated as proof-of-pattern | Story 7 delivers the full walking skeleton + 1 proof-of-pattern migration, unlocked by Story 5's PROCEED verdict |
| Parallelization risk resolution, implementation half (m9) | 14/41 calling files unstubbed (precise, from Story 6's spike) | 0/41 unstubbed | Story 8 stubs all 14 named files, unlocked by Story 6's PROCEED-conditional verdict; closes the standing junk-commit-contamination bug and is the precondition for a future, separate parallelization-implementation story |

## Stories in This Epic

- [ ] E2E seed-journey fixture — `tfhc-s1`
- [ ] journey.js hand-rolled fixture retrofit, bounded batch — `tfhc-s2`
- [ ] skills.js shared fixture walking skeleton — `tfhc-s3`
- [ ] Journey-seed-endpoint classification — `tfhc-s4`
- [ ] Spike: products.js/journeys.js fixture duplication — `tfhc-s5`
- [ ] Spike: runner parallelization git-commit-collision risk — `tfhc-s6`
- [ ] journeys.js shared fixture walking skeleton — `tfhc-s7`
- [ ] Stub the 14 remaining skill-turn git-commit test files — `tfhc-s8`

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Same rationale as the original `test-suite-infra-refactor` epic — low technical risk (test-only tooling, no production code path for stories 1-4; stories 5-6 are pure investigation with no production code path either), but this epic exists specifically because unmitigated fixture-divergence risk has already caused one real security-relevant incident (`ctpl-s1`). A PR-stage human checkpoint is proportionate for the implementation stories (1-4); the spikes (5-6) themselves carry no implementation risk until their own verdict unlocks a follow-on task.

## Complexity Rating

**Rating:** 2

<!-- Some ambiguity relative to the original tsir epic's Rating 1 -- two of the six items here are spikes with an open verdict, and skills.js's larger handler surface (45 consumers vs journey.js's 41) carries slightly more risk of an uneven session shape across handlers, even though this session's own /clarify investigation found the 5-field shape transfers cleanly. -->

## Scope Stability

**Stability:** Stable

<!-- All 3 open assumptions from discovery.md were resolved by investigation at /clarify before this epic was written -- no open unknowns remain that would destabilise story scope, aside from the 2 spikes' own deliberately-open verdicts, which are the point of those 2 stories, not a risk to them. -->
