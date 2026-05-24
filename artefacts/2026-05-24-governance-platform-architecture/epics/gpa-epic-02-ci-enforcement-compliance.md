## Epic: CI Enforcement, Security Hardening, and ADR-013 Compliance

**Discovery reference:** `artefacts/2026-05-24-governance-platform-architecture/discovery.md`
**Benefit-metric reference:** `artefacts/2026-05-24-governance-platform-architecture/benefit-metric.md`
**Slicing strategy:** Risk-first

## Goal

When this epic is complete, H1-H9 DoR gate checks are re-evaluated by CI on every PR push to master — not just at web UI gate-confirm time. The inline workflow JS in assurance-gate.yml is extracted to a tested module and covered by the test suite. The manifest-supplied sourcePath in the CI audit comment is guarded against path traversal per OWASP A01. `run-assurance-gate.js` calls `governance-package.evaluateGate` for all gate evaluation, fulfilling ADR-013.

This is the governance close. Epic 1 builds the foundation. This epic delivers the M2 and M4 outcomes that are the actual point of the feature.

## Out of Scope

- H1-H9 wiring for stories already DoD-complete (historical merged PRs) — CI H-check wiring applies to unsigned stories on open PRs only.
- Changes to the assurance-gate.yml YAML trigger structure, permission grants, or workflow trigger events — only the Node.js invocation logic changes.
- Adding new gate types beyond `structural` via governance-package.evaluateGate — separate stories if warranted.
- Making H-gate failures merge-blocking — that is a post-Wave-3 governance decision outside this feature's scope.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|------------------------|
| M2: CI H-gate enforcement coverage | 0 of 9 H-checks wired to CI | 9 of 9 | SC-03 wires `skills validate --ci` to assurance-gate.yml — H1-H9 become a CI gate on every PR push |
| M3: Architecture blind-spot recurrence rate | 3 documented pattern categories | 0 new entries (6 months) | SC-07 extracts inline JS — closes the most prolific blind-spot category (4 asd.1 bugs from a single untested inline block) |
| M4: ADR-013 compliance — shared gate authority | Non-compliant | Compliant | SC-02 replaces independent `checkResults` with `governance-package.evaluateGate` call |
| M5: Path traversal attack surface — CI comment | 1 confirmed unguarded readFileSync | 0 | SC-07 extracts `sourceIntegrity`; SC-06 adds the OWASP A01 traversal guard |

## Stories in This Epic

- [ ] SC-07: Extract inline workflow JS to tested modules — `gpa-sc-07-inline-js-extraction.md`
- [ ] SC-03: Wire CLI validate to CI assurance gate — `gpa-sc-03-cli-validate-ci.md`
- [ ] SC-06: Add path traversal guard to manifest sourcePath reads — `gpa-sc-06-source-path-guard.md`
- [ ] SC-02: Promote governance-package as single gate evaluator (ADR-013 compliance) — `gpa-sc-02-unified-gate-evaluator.md`

## Human Oversight Level

**Oversight:** Medium
**Rationale:** SC-07 and SC-06 touch assurance-gate.yml and scripts/ci-audit-comment.js. SC-03 changes what CI evaluates on every PR push — a false-positive rate above 1 in 20 PRs would block delivery. SC-02 touches run-assurance-gate.js and governance-package.js — both high-churn files with integration risk. Human review at PR is appropriate for all stories in this epic.

## Complexity Rating

**Rating:** 2–3
**Scope stability:** Stable (SC-02 dependency on Wave 2 stable is the only instability risk; once Wave 2 is DoD-complete, scope is fixed)
