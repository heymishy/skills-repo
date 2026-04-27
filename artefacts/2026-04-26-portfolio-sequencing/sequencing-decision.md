# Portfolio Sequencing Decision

**Document type:** WSJF (Weighted Shortest Job First) portfolio sequencing output
**Date:** 2026-04-27
**Operator:** heymishy
**Method:** Idea 7 — multi-pass mandatory context load → WSJF scoring → dependency-ordered execution sequence
**Status:** Approved — operator confirmed after table review and two scope refinements (P6 split; `/prioritise` expanded to multi-framework)

---

## 1. Context Loaded Before Scoring

The following sources were read in full before any scoring began. Scoring without reading these first is a pipeline violation.

| Source | Key finding |
|--------|-------------|
| `.github/architecture-guardrails.md` | Highest ADR is ADR-015 (two-tier artefact scope model). ADR-013 (Phase 4 enforcement architecture: shared 3-operation governance package — `resolveAndVerifySkill`, `evaluateGateAndAdvance`, `writeVerifiedTrace`) is Active. |
| `.github/pipeline-state.json` | Phase 4 feature at stage `definition-of-done`. Two Phase 5 starter features (`2026-04-23-non-technical-channel`, `2026-04-24-platform-onboarding-distribution`) at stage `ideation`. One open PR (#187 fix/issue-dispatch-body-encoding). Active branch `test/caa-ci-smoke-2` has PR #193 in flight (CAA — CI artefact attachment). |
| `.github/pipeline-state.schema.json` | `portfolioItems[]` field does not exist in schema. Adding it requires a schema PR per ADR-003 (Schema-first: fields defined before use). |
| `.github/context.yml` | Personal profile, non-regulated, Sonnet 4.6 experiment active, `instrumentation.enabled: true`. |
| `src/enforcement/cli-adapter.js` | **P1 defect confirmed** — `advance()` lines 109-113: `actual: expectedHash` passed to `verifyHash`, identical to `expected`; `verifyHash` always returns `null`; C5 (hash verification non-negotiable) silently bypassed on every CLI advance call. |
| `src/enforcement/governance-package.js` | `evaluateGate()` handles only 4 gate names (`dor`, `review`, `test-plan`, `definition-of-done`); all others → `Unknown gate` finding. ADR-013 specifies combined operations (`resolveAndVerifySkill`, `evaluateGateAndAdvance`, `writeVerifiedTrace`); implementation exports them split. 7 CLI commands are stubs returning `{ status: 'ok' }`. |
| `artefacts/phase5-6-roadmap.md` | WS0 (Phase 4 completion — distribution versioning WS0.1-0.6 + non-technical channel WS0.7-0.10) confirmed absent from codebase. WS0 blocks 6 of 7 Phase 5 workstreams. All 5 Phase 4 spikes verdict: PROCEED. |
| `artefacts/phase5-proposal.md` | Gap audit G1–G17; 6 workstream proposals for Phase 5. Cross-referenced against `phase5-6-roadmap.md`. |
| `artefacts/2026-04-19-skills-platform-phase4/spikes/spike-b2-output.md` | CLI P1 fidelity SATISFIED, P2/P4 PARTIAL (Mode 1 only); A2 (assurance gate requires no modification) accepted. |

---

## 2. Items Scored

12 items in scope. P6 was split from the original 11-item list after operator review: the WSJF portfolio sequencing method (what this exercise demonstrates) belongs inside `/prioritise` as one of several supported frameworks, not as a standalone item. `/challenge` (decision stress-test) remains a separate item.

| ID | Item description |
|----|-----------------|
| P1 | Hash self-comparison defect in `src/enforcement/cli-adapter.js` — `actual: expectedHash` makes C5 a silent no-op |
| P2 | Phase 4 WS0 completion — distribution versioning + lockfile (WS0.1–WS0.6), non-technical discipline channel (WS0.7–WS0.10), ADR-013 combined-operation interface, 7 CLI stubs |
| P3 | Phase 5 execution (WS1–WS7) — harness infrastructure, subagent isolation, context governance, spec integrity, platform intelligence, human capability, operational domain standards |
| P4 | Phase 6 execution (WS8–WS11) — policy lifecycle management, agent identity layer, second model review, federation at enterprise scale |
| P5 | In-flight learning capture — structured mid-session signal capture; extends `/checkpoint` and `/record-signal` |
| P6a | `/prioritise` skill — multi-framework prioritisation (WSJF, RICE, Kano, MoSCoW, ICE, Opportunity Scoring, Cost of Delay); single or combined framework runs; divergence-flagging when frameworks disagree |
| P6b | `/challenge` skill — decision stress-test; surfaces hidden assumptions and risks in a discovery or DoR artefact |
| P7 | Monitor + feedback signals — delivery evidence → discovery layer feedback (WS5.2 prototype); closes G12/G16 PARTIAL gaps |
| P8 | Workshop transcripts / `/transcript` skill — session recordings → structured artefacts |
| P9 | Social legitimacy / external auditability — extend CI artefact attachment to auditor-readable governance summary; Theme F second-line independence |
| P10 | Web UI — interactive canvas / richer dashboard beyond `dashboards/pipeline-viz.html` |
| P11 | Bootstrap / squad onboarding — brownfield onboarding path (WS6.2), maturity-gated skill disclosure (WS6.3) |

---

## 3. WSJF Scoring

Fibonacci scale (1, 2, 3, 5, 8, 13, 20) for all dimensions.

**UBV** = User/Business Value. **TC** = Time Criticality. **RR** = Risk Reduction / Opportunity Enablement. **CoD** = Cost of Delay = UBV + TC + RR. **JS** = Job Size (effort + complexity; 20 = large programme). **WSJF** = CoD ÷ JS.

| # | Item | UBV | TC | RR | CoD | JS | WSJF | Dependency |
|---|------|-----|----|----|-----|----|------|------------|
| P1 | Hash self-comparison defect fix | 13 | 13 | 13 | **39** | 1 | **39.0** | None — unblocked now |
| P6a | `/prioritise` skill (multi-framework) | 8 | 5 | 8 | **21** | 3 | **7.0** | None — unblocked now |
| P5 | In-flight learning capture | 8 | 8 | 5 | **21** | 3 | **7.0** | None — unblocked now |
| P11 | Bootstrap / squad onboarding | 8 | 5 | 5 | **18** | 3 | **6.0** | Amplified by P2 distribution; unblocked now |
| P7 | Monitor + feedback signals | 8 | 8 | 8 | **24** | 5 | **4.8** | None — unblocked now; enables P3 WS5 |
| P9 | Social legitimacy / external auditability | 13 | 8 | 8 | **29** | 8 | **3.6** | Active branch; unblocked now |
| P6b | `/challenge` skill | 5 | 3 | 3 | **11** | 3 | **3.7** | None — unblocked now |
| P2 | Phase 4 WS0 completion | 8 | 8 | 8 | **24** | 13 | **1.8** | Blocks P3; unblocked now |
| P8 | Workshop transcripts / `/transcript` skill | 5 | 2 | 2 | **9** | 5 | **1.8** | None; complements P2 WS0.7 |
| P3 | Phase 5 execution WS1–WS7 | 13 | 3 | 13 | **29** | 20 | **1.45** | **Hard-blocked on P2 (WS0)** |
| P10 | Web UI | 5 | 2 | 2 | **9** | 8 | **1.1** | ADR-001 constrains scope; low urgency |
| P4 | Phase 6 execution WS8–WS11 | 8 | 1 | 8 | **17** | 20 | **0.85** | **Hard-blocked on P3** |

---

## 4. Scoring Rationale

**P1 at 39.0 — detached from the field.** The defect is a single-character fault that makes C5 (hash verification non-negotiable — a load-bearing audit integrity property) a silent no-op on every CLI `advance` call. The platform currently claims P1 fidelity (skill-as-contract: hash abort on mismatch) on the CLI surface. That claim is false. CoD is maximum on all three dimensions; JS is 1. No other item in the backlog comes within a factor of 5.

**P6a and P5 tied at 7.0.** P6a encodes the exact exercise just completed as a repeatable skill — the operator demonstrated demand by running it. P5 closes the learning signal loss between sessions. Both are JS=3 and unblocked. Execution order between them is the operator's choice; running P6a first means the second scoring run (whenever P5 is ready for prioritisation) can use the skill rather than a manual protocol.

**P7 at 4.8 above P6b at 3.7.** P7 closes two PARTIAL gaps (G12 bidirectional delivery-to-strategy feedback, G16 trace data as platform intelligence source) with no Phase 4/5 prerequisites. TC is high because every delivery session generates evidence that disappears without a capture mechanism. P6b (`/challenge`) is valuable but has no time pressure and no gap-closure urgency.

**P2 at 1.8 despite large CoD.** P2's CoD of 24 is legitimate, but JS=13 (two major sub-tracks: distribution versioning and non-technical channel, each with multiple deliverables) depresses the WSJF ratio. More importantly, P2's TC of 8 is already captured in P3's dependency — delay to P2 delays P3 by the same duration. There is no incremental cost-of-delay from prioritising small high-WSJF items before starting P2 sequentially, as long as P2 starts promptly after P1.

**P3 at 1.45 despite highest raw CoD.** Hard-blocked on P2 (WS0 must be stable before six of seven Phase 5 workstreams can begin). TC=3 reflects that the marginal urgency of starting P3 before P2 is complete is zero — it literally cannot start. The 1.45 score is correct; P3 becomes the dominant priority the moment P2 reaches stability.

**P10 at 1.1.** ADR-001 (single-file viz, no build step) structurally constrains any meaningful expansion of the dashboard. The item is not infeasible, but the constraint means JS is high relative to the value delivered. Defer until Phase 5 is stable and the platform has enough scale that a richer UI creates visible value.

---

## 5. Proposed Execution Sequence

Dependency-ordered WSJF. Items at the same tier can run in parallel or in any order.

```
Now — unblocked small items ──────────────────────────────────────────
  [1] P1   — Hash defect fix in cli-adapter.js             (1 story, 1-line correction + test)
  [2] P6a  — /prioritise skill                             (3 stories, ADDITIVE)
  [3] P5   — In-flight learning capture                    (3 stories, ADDITIVE)
  [4] P11  — Bootstrap / squad onboarding                  (3 stories, ADDITIVE)

Parallel — medium items, unblocked ──────────────────────────────────
  [5] P7   — Monitor + feedback signals                    (5 stories, ADDITIVE)
  [6] P9   — Social legitimacy / external auditability     (in-flight branch; extend)
  [7] P6b  — /challenge skill                              (3 stories, ADDITIVE)

Start immediately after P1 ──────────────────────────────────────────
  [8] P2   — Phase 4 WS0 completion                        (large; discovery → DoR)
  [9] P8   — /transcript skill                             (fill-in alongside P2)

After P2 WS0 stable ─────────────────────────────────────────────────
  [10] P3  — Phase 5 execution WS1–WS7                     (programme track)

Deferred ─────────────────────────────────────────────────────────────
  [11] P10 — Web UI                                        (defer until Phase 5 stable)
  [12] P4  — Phase 6 execution WS8–WS11                    (blocked on P3)
```

---

## 6. Schema and Pipeline State Notes

**`portfolioItems[]` field:** The field does not exist in `.github/pipeline-state.schema.json`. Per ADR-003 (Schema-first: fields defined before use), adding `portfolioItems[]` to `pipeline-state.json` requires a schema PR that adds the field definition first. This sequencing decision is recorded as a standalone artefact; the pipeline-state update is deferred to the schema story.

**ADR continuity:** Highest current ADR is ADR-015. Any new ADR produced by P2–P3 discovery work starts at ADR-016.

**Next pipeline action:** Run `/discovery` on P1 (Phase 4 hash defect) as a short-track story — test-plan → DoR → inner loop. The fix is scope-trivial but the story artefact is required by ADR-011 (Artefact-first).
