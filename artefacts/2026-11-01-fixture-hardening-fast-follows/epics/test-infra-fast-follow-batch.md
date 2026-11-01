## Epic: The test suite runs faster and more reliably, and the remaining fixture-divergence risk is closed

**Discovery reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/discovery.md
**Benefit-metric reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/benefit-metric.md
**Slicing strategy:** Risk-first

<!-- ---CANVAS-JSON: {"type":"program-design","title":"As designed: Program design","content":{"mermaid":"flowchart LR\n    RBS3[check-rb-s3-harness-agnostic-instructions.js]\n    CATS4[check-cat-s4-features-page-integration.js]\n    CATS1[check-cat-s1-core-trace-builder.js]\n    RUNNER[scripts/run-all-tests.js]\n    WORKFLOW[e2e.yml + staging-deploy.yml]\n    RERUN[auto-rerun-on-cancellation mechanism]\n    JSFIX[tests/helpers/journeys-fixture.js]\n    JCONS[3-5 more journeys.js consumers]\n    PFIX[tests/helpers/products-fixture.js]\n    PSELFTEST[check-products-fixture-self-test.js]\n    PCHECK[check-products-fixture-usage.js]\n    PCONS[1 products.js consumer proof-of-pattern]\n    FACTORY[scripts/lib/make-fixture-usage-check.js]\n    JCHECK[check-journey-fixture-usage.js]\n    SCHECK[check-skills-fixture-usage.js]\n    JSCHECK[check-journeys-fixture-usage.js]\n    RBS3 --> RUNNER\n    CATS4 --> RUNNER\n    CATS1 --> RUNNER\n    WORKFLOW --> RERUN\n    JCONS --> JSFIX\n    PCONS --> PFIX\n    PSELFTEST --> PFIX\n    PCHECK --> PCONS\n    JCHECK --> FACTORY\n    SCHECK --> FACTORY\n    JSCHECK --> FACTORY"}}--->
---CANVAS-JSON: {"type":"program-design","title":"As designed: Program design","content":{"mermaid":"flowchart LR\n    RBS3[check-rb-s3-harness-agnostic-instructions.js]\n    CATS4[check-cat-s4-features-page-integration.js]\n    CATS1[check-cat-s1-core-trace-builder.js]\n    RUNNER[scripts/run-all-tests.js]\n    WORKFLOW[e2e.yml + staging-deploy.yml]\n    RERUN[auto-rerun-on-cancellation mechanism]\n    JSFIX[tests/helpers/journeys-fixture.js]\n    JCONS[3-5 more journeys.js consumers]\n    PFIX[tests/helpers/products-fixture.js]\n    PSELFTEST[check-products-fixture-self-test.js]\n    PCHECK[check-products-fixture-usage.js]\n    PCONS[1 products.js consumer proof-of-pattern]\n    FACTORY[scripts/lib/make-fixture-usage-check.js]\n    JCHECK[check-journey-fixture-usage.js]\n    SCHECK[check-skills-fixture-usage.js]\n    JSCHECK[check-journeys-fixture-usage.js]\n    RBS3 --> RUNNER\n    CATS4 --> RUNNER\n    CATS1 --> RUNNER\n    WORKFLOW --> RERUN\n    JCONS --> JSFIX\n    PCONS --> PFIX\n    PSELFTEST --> PFIX\n    PCHECK --> PCONS\n    JCHECK --> FACTORY\n    SCHECK --> FACTORY\n    JSCHECK --> FACTORY"}}---

## Goal

A developer or AI coding agent running the inner loop gets a faster, more reliable feedback loop on every PR: `run-all-tests.js`'s concurrency cap is pushed as high as the suite's own wall-clock NFR budgets genuinely allow, the `deploy-group` CI concurrency pattern no longer silently skips E2E coverage, and the remaining `journeys.js`/`products.js` fixture-divergence risk and fixture-usage-check script duplication — both named as fast-follows when `fixture-divergence-closure` closed — are measurably reduced.

## Out of Scope

- Full completion of the `journeys.js` retrofit beyond this epic's own bounded batch — the remaining files after this batch stay hand-rolled, deferred again as a further fast-follow (per discovery.md).
- Any new parallelization mechanism (sharding across CI runners, a different test framework) — this epic only re-tunes the concurrency cap `tfhc-s9` already built.
- Per-PR ephemeral staging environments — the bigger structural alternative to the `deploy-group` fix; this epic's own fix is the narrower, bounded one.
- Promoting any fixture-usage-check script to a `/definition-of-ready` hard block — still trigger-based on adoption data.
- The `getAllTestFiles`/`GRANDFATHER_LIST` existence-check gap found during `tfhc-s9` — no concrete consumer need driving it yet.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| `run-all-tests.js` concurrency cap (m1) | 3 on the 8-core reference machine | As high as the NFR sweep allows | Story 1's own sweep + re-tune |
| Real CI `Unit test chain` step duration (m2) | 124s (PR #1048) | Further reduction proportional to m1's own gain | Story 1's own re-verification in real CI |
| `journeys.js` shared-fixture adoption (m3) | 1 of 31 | 6-9 of 31 | Story 3's own bounded retrofit batch |
| `products.js` shared-fixture adoption (m4) | 0 of N | 1 migrated as proof-of-pattern | Story 3's own walking skeleton |
| Fixture-usage-check script count (m5) | 3 near-duplicate scripts | 1 shared factory + 3 thin call sites | Story 3's own DRY extraction |
| CI `deploy-group` cancellation incidence (m6) | Observed 3+ times (`tfhc-s7`/`s8`/`s9`) | 0, or auto-recovered | Story 2's own fix |

## Stories in This Epic

- [ ] NFR-budget sweep + concurrency re-tune — `fhff-s1`
- [ ] CI `deploy-group` concurrency-cancellation fix — `fhff-s2`
- [ ] Mechanical fixture/DRY batch (journeys.js retrofit + products.js walking skeleton + fixture-check DRY extraction) — `fhff-s3`

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Same rationale as the parent `fixture-divergence-closure` epic — low technical risk (test-tooling/CI-workflow-only, no production code path), but this epic's own Story 1 and Story 2 both carry genuine implementation uncertainty (per `/clarify`'s own findings), so a PR-stage human checkpoint is proportionate.

## Complexity Rating

**Rating:** 2

<!-- Story 1 (NFR-budget sweep) and Story 2 (CI concurrency fix) both carry real, evidenced uncertainty -- not well-understood, bounded work like the parent epic's own walking-skeleton stories. Story 3 (the mechanical batch) is Rating 1 on its own, but the epic as a whole reflects its riskiest members. -->

## Scope Stability

**Stability:** Stable

<!-- All 3 assumptions from discovery.md were addressed at /clarify before this epic was written -- 2 resolved, 1 explicitly carried forward as an accepted, named risk (not an open unknown that would destabilise scope), consistent with how the parent epic's own spikes were handled. -->
