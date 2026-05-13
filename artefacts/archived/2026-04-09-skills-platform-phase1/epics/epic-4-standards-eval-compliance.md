# Epic: Standards, Eval Suite, and Compliance Documentation

**Discovery reference:** artefacts/2026-04-09-skills-platform-phase1/discovery.md
**Benefit-metric reference:** artefacts/2026-04-09-skills-platform-phase1/benefit-metric.md
**Slicing strategy:** Risk-first

## Goal

The platform has a living regression suite that grows from real failure patterns and blocks score regressions automatically before human review. Three anchor discipline standards — software engineering, security engineering, and quality assurance — exist as composable, hash-verifiable files injected into inner loop traces by the assurance agent. `MODEL-RISK.md` is present, authored, and reviewed, satisfying the pre-adoption compliance requirement. The improvement loop can operate against a stable standard: harness quality is measured, not asserted.

## Out of Scope

- The eight remaining discipline standards beyond the three anchor disciplines (Design/UX, Data, Platform/Infra, Performance, Technical Writing, Product Management, Business Analysis, Regulatory/Compliance) — Phase 2
- Domain-tier and squad-tier standards layers — Phase 1 establishes the core tier only; domain extension and squad specification are Phase 2
- Automated POLICY.md floor validation (enforcement that a domain or squad cannot weaken the core floor) — the composition model is defined but enforcement tooling is Phase 2
- The improvement agent (P2.2) that reads eval suite results and proposes skill updates — this epic creates the eval infrastructure that improvement agent will read; it does not build the agent
- EA registry integration into the standards routing table — Phase A path in `standards/index.yml` is declared but not connected (Path B only, consistent with Epic 3)
- Full cryptographic agent identity in traces — Phase 4. The skill-set hash is recorded; full identity attestation is not

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M3 — Standards injection in trace | Zero — no `standardsInjected` array exists in any trace; standards files do not exist | A real inner loop trace after P1.7 delivery shows all three anchor discipline IDs with hashes matching the PR commit SHA | P1.7 delivers the standards files and `standards/index.yml` routing table; P1.3 (Epic 2) stores the hash in the trace — this epic delivers the content half of the injection pair |
| M4 — Watermark gate blocks regression | Zero — no watermark gate | Controlled synthetic regression blocked, both sub-conditions met | P1.6 delivers the eval suite that the watermark gate (P1.4, Epic 2) scores; without a populated suite, the gate has no score to compare |
| MM1 — Solo operator outer loop | Baseline being established by this dogfood run | All outer loop stages complete, zero blocking lookups | P1.7 standards content and P1.8 MODEL-RISK documentation reduce the probability of a blocking external lookup during any story's DoR gate |
| T3M1 — Trace readability for risk review | Zero — no trace exists | All eight audit questions answerable from the trace alone | P1.8 `MODEL-RISK.md` documents the eight audit questions the trace must answer; without it, T3M1 cannot be validated even if the trace is complete |

## Stories in This Epic

- [ ] Implement `workspace/suite.json` living eval regression suite — `stories/p1.6-living-eval-regression-suite.md`
- [ ] Implement standards model Phase 1 — three anchor disciplines, `standards/index.yml`, POLICY.md floors — `stories/p1.7-standards-model-phase1.md`
- [ ] Author and review `MODEL-RISK.md` before non-dogfood adoption — `stories/p1.8-model-risk-documentation.md`

## Human Oversight Level

**Oversight:** High
**Rationale:** P1.7 introduces standards files that constrain every future inner loop story — an incorrect standard is worse than no standard because it enforces the wrong behaviour at machine speed. Each standards file requires human review of content (not just structure) before it is used in a real inner loop run. P1.8 requires human sign-off — `MODEL-RISK.md` is not DoD-complete until reviewed by a human applying the eight-question audit test. P1.6 requires human confirmation of each scenario before it enters the regression suite, as a wrongly specified scenario that always passes would corrupt the regression guarantee.

## Complexity Rating

**Rating:** 2 (P1.6 is 2; P1.7 is 2; P1.8 is 1 — highest rating governs the epic)

## Scope Stability

**Stability:** Stable
