# Discovery: Refactoring as a First-Class Inner Loop Practice

**Feature slug:** 2026-10-01-inner-loop-refactoring
**Status:** Approved
**Discovery date:** 1 October 2026
**Approved by:** Operator

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

1. **Refactor receipts in `/tdd`.** Require a structured-change note (specific improvements named) plus confirmation that the full suite is still green after the refactor step. Allow an explicit "skipped, because [reason]" entry. Record both in pipeline state via a new `refactorReceipt` field on each task's `tddState`. This makes a skipped refactor visible for the first time.

   **Receipt format (v0):**
   ```
   refactorReceipt:
     changes: ["Extracted authentication logic to shared module", "Consolidated error handlers", "Removed 3 duplicate validation blocks"]
     testResult: "pass" (required; "fail" triggers rollback)
     diffScope: "internal" | "interface-adjacent" | "external" (internal = private implementation only)
     notes: "[optional reasoning]"
   ```
   Or, if refactoring is skipped:
   ```
   refactorReceipt:
     status: "skipped"
     reason: "[explicit reason — required]"
   ```

2. **Design lens in `/implementation-review`.** Add a third review stage (Stage 3) over each task batch: cross-task duplication, emerging abstractions, whether refactor receipts exist and are coherent, and patterns in the structural changes named in receipts. This gives the tech lead a review signal without requiring a new skill. Stage 3 findings are recorded in the review artefact; at least one finding per feature is the directional target.

3. **Health model v0 design dimension.** Add design as a fifth dimension to the existing health roll-up, using receipt rate and refactor-caused failures as the initial signals. Advisory only (amber at most) until calibrated. Snapshot at each DoD and `/improve` run to produce a time series.

   **Signals:**
   - Receipt coverage rate: target ≥80% of tasks have either a receipt or an explicit skip reason
   - Skipped-without-reason rate: target 0% (silent skips are visible as missing fields)
   - Refactor-caused test failures: target 0 per feature (any failure means baseline was broken; refactor must be reverted)
   - Design lens findings: target at least one per feature

These three changes are deliverable via the artefact-first rule and the platform change policy without introducing a new skill in this epic. They produce the data needed to decide whether a `/refactor` skill and a granularity experiment are warranted.

**Explicitly deferred to later epics (with long-term pattern documented):**
- `/refactor` skill for post-DoD merged features and scheduled refactor sessions (next epic)
- Behaviour baseline manifest and versioning (next epic, prerequisite for `/refactor` skill)
- Refactor backlog (queue, priority, ownership) — Phase 5 planning
- Granularity experiment comparing per-task vs batch vs feature-close refactor modes — Phase 5, after 5+ features run under the new protocol
- Full product-health dashboard — Phase 5 epic (design dimension is one input to it)
- Static-analysis metrics (duplication ratio, cyclomatic complexity, coverage delta) — Phase 5+, gated on calibration of process signals against rework/defect data
- `/product-sync` and `/context-graph` — out of scope, named non-goals in brief
- Deterministic tooling integration (LSP, codemods, static-analysis metrics beyond receipt rate) — Phase 5+, stack-specific
- Retrofitting past features with baselines and receipts — out of scope for this epic; future work on legacy features

---

## Out of scope

1. **Replacing or weakening `/tdd`.** The iron law — no production code without a failing test first — is unchanged. The refactor step follows green; it does not precede or replace it.

2. **Agent-driven refactoring without a gate and receipts.** An agent may not refactor without producing a receipt that the suite is still green and the diff is structural-only. Ungated refactoring is the failure mode this work exists to prevent.

3. **Building the full product-health dashboard.** The health model v0 design dimension is a signal added to the existing roll-up. A dedicated product-health dashboard is a later epic.

4. **Retrofitting every past feature.** The behaviour baseline and the refactor backlog apply to features from this work forward. Retroactive baseline registration for all prior features is not in scope.

5. **Owning the granularity experiment end-to-end in this epic.** The MVP produces the data. The experiment — months-long comparison of modes across real features — is a separate, longer-horizon activity that `/improve` and `/estimate` actuals will support.

6. **Static-analysis and codemod tool selection.** Which tools fit the stacks the framework serves, and who owns their configuration, is an open question for future epics. This epic does not select or integrate specific tools; it proves the concept with process signals alone.

7. **The `/refactor` skill and post-DoD refactoring mode.** These are the natural follow-on epic, documented as the long-term pattern. Refactoring in this epic happens only within the in-loop `/tdd` step, before PR merge.

---

## Confirmed assumptions

✅ **Assumption 1 — Structural receipt format is viable for v0:**
Receipts are mini-structured (changes list, test result, diff scope, optional notes). Free-form narrative replaced by named-changes format to prevent receipt gaming and enable design-lens audit. Explicit skip reasons required for non-refactored tasks.

✅ **Assumption 2 — `/verify-completion` scope-creep check needs a refactor carve-out:**
Files touched in the green step are fair game for refactor-step rewrites, provided test suite remains green. A new parameter or conditional mode in `/verify-completion` will exempt refactor-step file rewrites from scope-creep flagging for files already in the DoR contract.

✅ **Assumption 3 — Design dimension computes from process signals only (v0):**
Receipt rate, skipped-without-reason rate, and refactor-caused test failures are sufficient for v0. Static-analysis metrics (duplication, complexity, coverage delta) are deferred to Phase 5+, gated on calibration of process signals against real rework and defect data. The design dimension is advisory (amber at most) in v0.

✅ **Assumption 4 — Long-term pattern: `/refactor` skill in next epic:**
In-loop refactoring (this epic) uses structured receipts within `/tdd`. Post-DoD refactoring and scheduled refactor sessions use a dedicated `/refactor` skill (next epic). The skill enforces behaviour baseline recording, refactor scope declaration, receipt production, and baseline re-verification. This positions the MVP as a stepping stone toward continuous, measurable refactor discipline.

---

## Remaining open questions for `/clarify`

No blocking open questions remain. All four critical assumptions have been confirmed. The discovery is ready to proceed to `/benefit-metric`.

**Optional investigation questions (if scope refinement is needed later):**
- Should refactor receipts be required per task, per task batch, or per feature? (Current assumption: per task, matching `/tdd`'s per-task granularity.)
- Does the design lens need a dedicated reviewer role, or does the tech lead handle it as part of standard `/implementation-review`? (Current assumption: tech lead, no new role.)

---

## Directional success indicators

**Receipt coverage rate:** Baseline: 0% (no receipts exist today). Target: ≥80% of tasks in a given feature end with either a receipt or an explicit skip reason. Measured via: `refactorReceipt` field on each task's `tddState` record; reported in `/improve` summary.

**Skipped-without-reason rate:** Baseline: 100% (all refactors are effectively skipped without record). Target: 0% of tasks end with a silent skip (all have either a receipt or an explicit skip reason). Measured via: missing `refactorReceipt` field is a signal; `/workflow` will highlight tasks with no receipt and no skip reason.

**Design lens findings per feature:** Baseline: [UNKNOWN BASELINE] — `/implementation-review` Stage 3 does not exist today; no historical data exists. Target: at least one design-lens finding per feature across the first five features run under the new review stage. Measured via: `/implementation-review` Stage 3 findings captured in the review artefact; tallied in `/improve` summary.

**Refactor-caused test failures:** Baseline: [UNKNOWN BASELINE] — no current tracking. Target: 0 refactor-caused baseline failures per merged feature (a failure means the baseline was broken and the refactor must be reverted). Measured via: CI suite result after each refactor step; any failure flagged in pipeline state and reported in `/improve`.

**Health model design dimension coverage:** Baseline: design dimension absent from all features today. Target: design dimension present and computing a status for every feature run under the new protocol. Measured via: health roll-up in pipeline state; confirmed at each DoD.

**Long-term (post-MVP):** Over months, measure whether per-task refactor discipline produces better design than batch or feature-close modes (the granularity experiment).

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

**From the brief and confirmed assumptions:**
- No static-analysis or codemod tool is selected or integrated in this epic. That question goes to later epics once process signals are calibrated.
- The design dimension is advisory (amber at most) until calibrated against rework and defect data over multiple features.
- The credit rule: a refactor counts toward health only if the baseline stays green and unchanged.
- A needed test change is a behaviour change, not a refactor — it returns to the outer loop via `/test-plan`.
- Refactor receipts are per-task, matching `/tdd`'s existing per-task granularity.
- The tech lead handles Stage 3 design lens review as part of standard `/implementation-review` scope.

---

## Attribution

**Contributors:**
- Hamish King — operator / platform maintainer — 1 October 2026

**Reviewers:**
- Pending

**Approved by:**
- Operator — 1 October 2026

---

*Instrumentation block (EXP-010)*

```yaml
experiment_id: EXP-010-fable5-model-sweep
model_label: claude-sonnet-4-6
cost_tier: fast
skill_name: discovery
artefact_path: artefacts/2026-10-01-inner-loop-refactoring/discovery.md
run_timestamp: 2026-10-01T12:00:00Z
fidelity_self_report: "Structured receipt format confirmed and locked. /verify-completion refactor carve-out identified for /clarify (now resolved via confirmation that files touched in green step are fair game for refactor rewrites). Process-signal-only design dimension v0 confirmed. Long-term /refactor skill pattern documented and deferred. All four critical assumptions validated in real-time. No blocking open questions remain. Artefact-first and platform change policy constraints applied. MVP scope held to three changes; all deferrals explicit with Phase 5 timeline noted."
```

<!-- eval-mode: false -->