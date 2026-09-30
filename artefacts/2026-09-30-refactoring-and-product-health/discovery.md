# Discovery: Refactoring as a First-Class Inner Loop Practice

**Feature slug:** 2026-10-01-inner-loop-refactoring
**Status:** Draft — pending approval
**Discovery date:** 1 October 2026
**Approved by:** Pending

---

## Problem statement

The skills framework enforces the red and green steps of TDD with hash-verified instruction sets, evidence gates, and mandatory state writes. The refactor step is a short self-reported afterthought: eight instructional lines in `/tdd`, a `tddState: "refactor"` field that records nothing, no required evidence, and no review lens that checks whether a refactor happened or what it produced. A skipped refactor and a completed one are indistinguishable in pipeline state.

The consequence is structural. Merciless, continuous refactoring — the mechanism by which a simple design evolves over months — depends entirely on agent goodwill and operator attention. Nothing in the framework triggers it, nothing accumulates the growing test baseline that makes it safe, and nothing produces a design-health signal that would tell an operator or a tech lead whether the codebase is improving or eroding. The health model (green / amber / red) covers delivery flow, traceability, verification, and outcome. Design is absent.

There are two distinct refactor moments the framework cannot account for today: the in-loop moment (per task or per batch, before the PR merges) and the continuous post-DoD moment (on already-merged features, using their accumulated ACs and tests as a behaviour-preserving baseline). Neither has a protocol, evidence requirement, or health signal.

The trigger for this discovery is Joshua Kerievsky's argument, surfaced via a LinkedIn post, that write-a-failing-test, make-it-pass, move-on is not TDD — refactoring is part of TDD. The post also raises a design question the framework cannot yet answer: does fine-grained per-task red-green-refactor produce better systems than batch or feature-close refactoring, and at what token and orchestration cost? Months of real delivery data are needed to answer it. The framework cannot currently produce that data.

---

## Who it affects

**Developer / engineer (primary):** Runs the inner loop daily. Currently has no signal when a task batch leaves duplication or a missed abstraction behind. Has no safe, protocol-governed path to refactor a merged feature without risking behaviour change.

**Tech lead / squad lead (primary):** Signs off on DoR and DoD. Currently receives no design-health signal alongside the delivery-flow and traceability signals. Cannot tell from pipeline state whether a feature's design is improving or eroding across its stories.

**Platform maintainer (primary):** Owns the skill library. Cannot show, from real delivery data, whether stricter per-task refactor discipline produces better outcomes than cheaper batch or feature-close modes. Cannot currently run a fair granularity experiment.

**UX designer / product manager (secondary):** Participate in the outer loop. Affected indirectly when design erosion produces slower iteration and higher rework — neither of which is currently visible to them as a design-health signal.

---

## Why now

Three forces have converged:

1. **The framework has reached a maturity threshold.** Red and green are well-governed. The next quality gap is refactor evidence and design continuity. Addressing it now, before the framework is adopted at scale, avoids encoding the gap as a convention.

2. **The Kerievsky argument names a specific failure mode.** The LinkedIn post is not a general observation — it identifies that agents can do TDD given semantic guidance and deterministic tooling, and that the missing ingredient is the refactor discipline that evolves a simple design. The framework has the semantic guidance machinery. The deterministic tooling question is open. This is the moment to test the hypothesis on real features.

3. **The health model has a visible gap.** The delivery-flow, traceability, and verification dimensions are live. Design is absent. Adding a design signal as part of this work — advisory at first, calibrated against rework and defect data before it can turn a feature amber — is cheaper now than retrofitting it after the health model is in wider use.

---

## MVP scope

The smallest deliverable that validates the core hypothesis — that refactor evidence is producible, checkable, and useful — consists of three bounded changes:

1. **Refactor receipts in `/tdd`.** Require a structural-change note plus confirmation that the full suite is still green after the refactor step. Allow an explicit "skipped, because [reason]" entry. Record both in pipeline state. This makes a skipped refactor visible for the first time.

2. **Design lens in `/implementation-review`.** Add a third review stage over each task batch: cross-task duplication, emerging abstractions, and whether refactor receipts exist and are coherent. This gives the tech lead a review signal without requiring a new skill.

3. **Health model v0 design dimension.** Add design as a fifth dimension to the existing health roll-up, using receipt rate and refactor-caused failures as the initial signals. Advisory only (amber at most) until calibrated. Snapshot at each DoD and `/improve` run to produce a time series.

These three changes are deliverable via the artefact-first rule and the platform change policy without introducing a new skill. They produce the data needed to decide whether a `/refactor` skill and a granularity experiment are warranted.

**Explicitly deferred to later epics:**
- `/refactor` skill for post-DoD merged features
- Behaviour baseline manifest and versioning
- Refactor backlog (queue, priority, ownership)
- Granularity experiment comparing per-task vs batch vs feature-close modes
- Full product-health dashboard (already named as a later epic in the brief)
- `/product-sync` and `/context-graph` (named non-goals)
- Deterministic tooling integration (LSP, codemods, static-analysis metrics beyond receipt rate)
- Retrofitting past features

---

## Out of scope

1. **Replacing or weakening `/tdd`.** The iron law — no production code without a failing test first — is unchanged. The refactor step follows green; it does not precede or replace it.

2. **Agent-driven refactoring without a gate and receipts.** An agent may not refactor without producing a receipt that the suite is still green and the diff is structural-only. Ungated refactoring is the failure mode this work exists to prevent.

3. **Building the full product-health dashboard.** The health model v0 design dimension is a signal added to the existing roll-up. A dedicated product-health dashboard is a later epic.

4. **Retrofitting every past feature.** The behaviour baseline and the refactor backlog apply to features from this work forward. Retroactive baseline registration for all prior features is not in scope.

5. **Owning the granularity experiment end-to-end in this epic.** The MVP produces the data. The experiment — months-long comparison of modes across real features — is a separate, longer-horizon activity that `/improve` and `/estimate` actuals will support.

6. **Static-analysis and codemod tool selection.** Which tools fit the stacks the framework serves, and who owns their configuration, is an open question for `/clarify`. This epic does not select or integrate specific tools.

---

## Assumptions and risks

[ASSUMPTION] Structural-change notes plus unchanged test-file hashes are sufficient evidence for a v0 receipt — unconfirmed, requires `/clarify` before scope is locked.

[ASSUMPTION] The `/verify-completion` scope-creep check does not need modification to pass a structural-only diff — untested, requires `/clarify` before the `/tdd` receipt change is specified.

[ASSUMPTION] The design dimension can be computed from receipt rate and refactor-caused failures alone for v0, without requiring static-analysis metrics on specific stacks — unconfirmed, requires `/clarify` before the health model dimension is specified.

[ASSUMPTION] A refactor story uses the short-track path (`/test-plan → /definition-of-ready → coding agent`) rather than requiring a new track or template — unconfirmed, requires `/clarify` before `/definition`.

[ASSUMPTION] The behaviour baseline manifest can live in `pipeline-state.json` or a sidecar file without a new storage mechanism — unconfirmed, scope is deferred but the assumption affects the MVP design.

**Risks:**

- **Receipt gaming.** A structural-change note is self-reported. If agents learn to produce plausible notes without actually refactoring, the signal is worthless. Mitigation: the design lens in `/implementation-review` is a second-pass check; measuring receipt rate against rework over time exposes gaming patterns.

- **Design dimension advisory becoming treated as normative prematurely.** If amber-at-most is not enforced, a noisy design signal could block delivery. Mitigation: the advisory constraint is built into the health model spec and config; it requires an explicit decision to escalate.

- **Scope creep toward the `/refactor` skill.** The MVP deliberately stops at receipts, design lens, and health signal. Pressure to add the full `/refactor` skill in the same epic is a real risk given how the brief frames it. Mitigation: the deferred list is explicit; `/definition` must reject stories that belong to the later epic.

- **Open question overload at `/clarify`.** Eleven open questions is a lot. If `/clarify` resolves only half of them before `/benefit-metric`, the scope may need to shrink further. The most critical three are: receipt format, scope-creep check compatibility, and refactor story track.

---

## Directional success indicators

**Receipt coverage rate:** Baseline: 0% (no receipts exist today). Target: ≥80% of tasks in a given feature end with either a receipt or an explicit skip reason. Measured via: pipeline state field added to each task's `tddState` record; reported in `/improve` summary.

**Skipped-without-reason rate:** Baseline: 100% (all refactors are effectively skipped without record). Target: 0% of tasks end with a silent skip. Measured via: same pipeline state field; a silent skip is a missing field, detectable in `/workflow`.

**Design lens findings per batch:** Baseline: [UNKNOWN BASELINE] — `/implementation-review` has no Stage 3 today; no historical data exists. Target: at least one design-lens finding per feature across the first five features run under the new review stage. Measured via: `/implementation-review` Stage 3 output captured in the review artefact.

**Refactor-caused test failures:** Baseline: [UNKNOWN BASELINE] — no current tracking. Target: 0 refactor-caused baseline failures per merged feature (a failure means the baseline was broken; the refactor must be reverted). Measured via: CI suite result after each refactor step; any failure flagged in pipeline state.

**Health model design dimension coverage:** Baseline: design dimension absent from all features today. Target: design dimension present and computing a status for every feature run under the new protocol. Measured via: health roll-up in pipeline state; confirmed at each DoD.

---

## Constraints

**From CLAUDE.md and the platform:**
- Artefact-first rule applies. Any new or behaviourally modified SKILL.md, `src/` module, or governance check script needs a story chain (discovery through DoR) before or alongside the implementation.
- Platform change policy applies. SKILL.md, templates, standards, and script changes merge via PR with tech lead review — not direct commits.
- Hash-verified skills. Edited skills must preserve hash verification and audit signal integrity.
- State writes go through `bin/skills advance` and `gate-advance`. No direct JSON edits.
- The iron law of `/tdd` is inviolable. No production code without a failing test first. A refactor step must not add behaviour.
- Short-track refactor stories still require DoD after merge.
- Epic-nested state bookkeeping: apply state advances on master after PR merge.

**From the brief:**
- No static-analysis or codemod tool is selected or integrated in this epic. That question goes to `/clarify`.
- The design dimension is advisory (amber at most) until calibrated against rework and defect data.
- The credit rule: a refactor counts toward health only if the baseline stays green and unchanged.
- A needed test change is a behaviour change, not a refactor — it returns to the outer loop via `/test-plan`.

---

## /clarify recommendation

This discovery contains six unconfirmed assumptions that affect scope and how `/benefit-metric` can define measurable targets. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- [ASSUMPTION] Structural-change notes plus unchanged test-file hashes are sufficient evidence for a v0 receipt — unconfirmed, requires `/clarify` before scope is locked.
- [ASSUMPTION] The `/verify-completion` scope-creep check does not need modification to pass a structural-only diff — untested, requires `/clarify` before the `/tdd` receipt change is specified.
- [ASSUMPTION] The design dimension can be computed from receipt rate and refactor-caused failures alone for v0, without requiring static-analysis metrics on specific stacks — unconfirmed, requires `/clarify` before the health model dimension is specified.
- [ASSUMPTION] A refactor story uses the short-track path rather than requiring a new track or template — unconfirmed, requires `/clarify` before `/definition`.
- [ASSUMPTION] The behaviour baseline manifest can live in `pipeline-state.json` or a sidecar file without a new storage mechanism — unconfirmed, scope is deferred but the assumption affects the MVP design.
- [UNKNOWN BASELINE] for design lens findings per batch — no Stage 3 exists today; the target direction is directional until at least one feature has been run under the new review stage.

---

## Attribution

**Contributors:**
- Hamish King — operator / platform maintainer — 1 October 2026

**Reviewers:**
- Pending

**Approved by:**
- Pending

---

*Instrumentation block (EXP-010)*

```yaml
experiment_id: EXP-010-fable5-model-sweep
model_label: claude-sonnet-4-6
cost_tier: fast
skill_name: discovery
artefact_path: artefacts/2026-10-01-inner-loop-refactoring/discovery.md
run_timestamp: 2026-10-01T00:00:00Z
fidelity_self_report: "Rich structured input; all seven sections used directly. Six assumptions surfaced as [ASSUMPTION] lines. Three [UNKNOWN BASELINE] markers placed where no historical data exists. /clarify recommendation block produced. Artefact-first and platform change policy constraints pre-populated from CLAUDE.md. MVP scope held to three bounded changes; /refactor skill and experiment explicitly deferred."
```

<!-- eval-mode: false -->