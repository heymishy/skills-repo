## Story: Promote governance-package as single gate evaluator (ADR-013 compliance)

**Epic reference:** `artefacts/2026-05-24-governance-platform-architecture/epics/gpa-epic-02-ci-enforcement-compliance.md`
**Discovery reference:** `artefacts/2026-05-24-governance-platform-architecture/discovery.md`
**Benefit-metric reference:** `artefacts/2026-05-24-governance-platform-architecture/benefit-metric.md`

## User Story

As a **second-line risk/compliance reviewer** auditing the assurance gate,
I want `run-assurance-gate.js` to call `governance-package.evaluateGate` for all gate type evaluation rather than maintaining an independent `checkResults` function,
So that M4 (ADR-013 compliance — shared gate authority) moves from non-compliant to compliant, and any reviewer can trace a CI gate verdict to the same canonical evaluation code path as the web UI gate-confirm — a single, auditable source of truth.

## Benefit Linkage

**Metric moved:** M4 — ADR-013 compliance — shared gate authority.
**How:** ADR-013 states "No surface adapter reimplements governance logic independently." Currently, `run-assurance-gate.js` has an independent `checkResults` function not routed through `governance-package.evaluateGate`. This story replaces that with a `governance-package.evaluateGate({ type: 'structural', ... })` call, making the CI gate path and the web UI gate-confirm path use the same evaluation logic. Non-compliance becomes compliance.

## Architecture Constraints

- **ADR-013 (Active — direct closure):** "All surface adapters call the shared governance package for resolveSkill, verifyHash, evaluateGate, advanceState, and writeTrace. No surface adapter reimplements governance logic independently." SC-02 directly closes this non-compliance.
- ADR-009: no changes to workflow trigger separation, permission grants, or trigger events.
- ADR-011: changes to `run-assurance-gate.js` (existing governance check script) — this story artefact satisfies artefact-first.
- **`evaluateGate` interface extension — specified here (not deferred to DoR):**
  - Input: `evaluateGate({ gate: 'structural', context: { checks: Array<{ name: string, passed: boolean, reason?: string }> } })` — adds a `'structural'` case to the existing `gate` switch; `checks` is the verbatim output of `runChecks(root)` (the 4 file-existence checks already in `run-assurance-gate.js`).
  - Return: `{ passed: boolean, findings: string[] }` — same shape as all existing gate cases. `passed` is `checks.every(c => c.passed)`. `findings` is failed-check `reason` strings.
  - Error contract: unknown `gate` value falls through to the existing `default` branch, returning `{ passed: false, findings: ['Unknown gate: "<name>"'] }` — no change to existing behaviour.
  - No breaking change: all existing callers using `gate: 'dor'|'review'|'test-plan'|'definition-of-done'` are unaffected.
- **Functional equivalence mandatory:** All existing CI gate pass/fail behaviours must be preserved post-SC-02; functional equivalence must be demonstrated by the test suite.
- Plain Node.js, CommonJS, no external npm dependencies.
- Checked against `.github/architecture-guardrails.md`.

## Dependencies

- **Upstream (Wave 3 gate — hard block):** SC-07, SC-03, and SC-06 must all be DoD-complete before SC-02 is dispatched. Rationale: `governance-package.js` and `run-assurance-gate.js` are high-churn files; attempting SC-02 while Wave 2 PRs are open creates rebase conflict risk that can corrupt both lines of work.
- **Upstream (A2 gate — hard block):** The execution-boundary discovery scoping must explicitly exclude `run-assurance-gate.js` and `governance-package.js` from its scope before SC-02 dispatches. If that scoping is ambiguous, raise it as a blocker at SC-02 DoR — do not proceed.
- **Downstream:** M4 signal produced at SC-02 DoD.

## Acceptance Criteria

**AC1:** Given `run-assurance-gate.js` is the CI enforcement adapter, when it evaluates the structural gate (the 4 file-existence checks: workspace-state-valid, pipeline-state-valid, artefacts-dir-exists, governance-gates-exists), then it calls `governance-package.evaluateGate({ gate: 'structural', context: { checks: runChecks(root) } })` — the inline verdict derivation logic that currently follows `runChecks(root)` is replaced by delegating to `evaluateGate`, with `runChecks` remaining as the check collector.

**AC2:** Given `governance-package.evaluateGate` is now called from `run-assurance-gate.js` for the structural gate, when a CI run processes a PR that previously passed the gate, then the gate verdict (pass/fail), the check names, and the failed-check `reason` strings in `findings` are identical to what the previous inline implementation produced — functional equivalence verified by running the full test suite. Specifically: all 4 check names (`workspace-state-valid`, `pipeline-state-valid`, `artefacts-dir-exists`, `governance-gates-exists`) and their pass/fail outcomes must be preserved.

**AC3:** Given a test imports both `run-assurance-gate.js` and `governance-package`, when the test calls the structural gate evaluation path, then it can assert: (a) `governance-package` is imported as a dependency of `run-assurance-gate.js`, and (b) `governance-package.evaluateGate({ gate: 'structural', context: { checks: [{ name: 'workspace-state-valid', passed: true }, ...] } })` returns `{ passed: true, findings: [] }` and `evaluateGate({ gate: 'structural', context: { checks: [{ name: 'workspace-state-valid', passed: false, reason: 'not found' }] } })` returns `{ passed: false, findings: ['not found'] }`.

**AC4:** Given SC-02 is merged and a future contributor adds a new surface adapter, when they read `run-assurance-gate.js`, then they find no independent gate evaluation logic — all gate verdicts trace through `governance-package.evaluateGate`, making it the unambiguous ADR-013-compliant reference pattern.

**AC5:** Given `npm test` runs after SC-02 is merged, then all existing tests pass — no regression.

## Out of Scope

- Wiring H1-H9 checks through `governance-package.evaluateGate` — that is SC-03's scope; SC-02 addresses the `structural` gate type only.
- Adding new gate types beyond `structural` — separate stories.
- Changing the assurance-gate.yml YAML structure, trigger events, or permission scopes — only the Node.js evaluation logic changes.
- Making H-gate failures merge-blocking — post-Wave-3 governance decision.

## NFRs

- **Functional equivalence:** All existing CI gate pass/fail behaviours preserved post-merge.
- **No external npm dependencies.**
- **Graceful degradation:** If `governance-package` is not installed (e.g. development environment without `npm install`), `run-assurance-gate.js` must fall back to a printed warning rather than a hard crash that blocks all CI runs.

## Complexity Rating

**Rating:** 3
**Scope stability:** Stable (low scope instability; Wave 3 gate and A2 gate conditions are the only instability risks — once both are confirmed, scope is fixed)

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] Wave 2 stable confirmed (SC-07, SC-03, SC-06 all DoD-complete)
- [ ] A2 gate confirmed (execution-boundary scope excludes run-assurance-gate.js and governance-package.js)
- [ ] evaluateGate interface extension confirmed as specified in Architecture Constraints (no interface review required — contract is fully specified in this story)
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
