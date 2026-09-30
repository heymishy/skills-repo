## Benefit Metric: Web UI Learnings and Improvements Integration

**Discovery reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/discovery.md
**Date defined:** 2026-09-30
**Metric owner:** Hamish King — Platform Owner
**Reviewers:** Hamish King — Platform Owner

**Rebuild note:** This artefact replaces a prior version that was, in fact, a full duplicate of `discovery.md` saved under the wrong filename — no real metrics, baselines, or targets had ever been defined for this feature. Found during a `/review` re-run (see `decisions.md`). This is a fresh, genuine benefit-metric pass, built from `discovery.md`'s own Directional Success Indicators section, not a patch of the prior content.

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** No — this is a standard product feature (dashboard UX + signal surfacing), not a tooling/process pilot or capability validation exercise.

**Tier 3 (Compliance):** No named regulatory clause or audit finding applies. Discovery's own "Secondary persona: Enterprise governance / risk function" describes a *future*, aspirational benefit for other potential deployments, not a current obligation this repo must satisfy — `product/constraints.md` and every NFR profile in this repo to date confirm no compliance framework currently applies here.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Skill launcher clarity

| Field | Value |
|-------|-------|
| **What we measure** | Whether the web UI skill launcher shows only genuine entry-point skills as primary call-to-action buttons, versus all skills shown as equally valid starts |
| **Baseline** | All 41+ skills shown as equal CTAs today — 0% rationalised |
| **Target** | Only the 5 confirmed entry-point skills (discovery, ideate, reverse-engineer, spike, improve) shown as primary CTAs; all other (chained) skills hidden from the primary view, reachable via a clearly-labelled advanced affordance |
| **Minimum validation signal** | Entry-point skills are visually and structurally distinguished from chained skills, even if the "advanced" affordance itself is not yet fully polished |
| **Measurement method** | E2E spec assertion (entry-point skills present as primary CTAs; a representative chained skill — e.g. `/definition` — is NOT shown as a primary CTA) + direct operator visual inspection in a real browser session |
| **Feedback loop** | If the 5-skill list needs adjustment once used, the operator revises the hardcoded list directly (parameterising it via `context.yml` is explicitly deferred to Phase 5 per the epic's own scope) |

### Metric 2: Improvement signal surfacing

| Field | Value |
|-------|-------|
| **What we measure** | Whether real improvement signals from the platform's 12 known workspace/framework sources are visible in the web UI dashboard |
| **Baseline** | 0 workspace signals surfaced in the web UI today — CLI/IDE access only |
| **Target** | All 12 signal sources are parsed by the aggregator and at least 1 signal from each active source type is displayed per active feature |
| **Minimum validation signal** | At least 1 signal source (e.g. `capture-log.md`) is surfaced correctly end-to-end via the real `/api/signals` endpoint — proves the aggregate-to-display path genuinely works, even before every one of the 12 sources has full parsing robustness (per-source robustness is explicitly Epic 2 scope) |
| **Measurement method** | E2E spec assertion on `GET /api/signals` (ep1-s2's own AC1) returning a real, non-empty `Signal[]` array + direct operator inspection of the rendered dashboard |
| **Feedback loop** | If a specific source's parsing proves unreliable in practice, Epic 2's per-source robustness stories (ep2-s1 and successors) absorb the fix — captured as a known, explicit gap, not silently dropped |

### Metric 3: Self-improvement loop accessibility

| Field | Value |
|-------|-------|
| **What we measure** | Whether an operator using *only* the web UI (no CLI, no IDE) can discover a real improvement signal and successfully start a new, seeded pipeline session from it |
| **Baseline** | 0% — the improvement loop requires CLI or IDE-based harness access today; entirely invisible to a web-UI-only operator |
| **Target** | 100% — an operator can see a signal, click its CTA, and land in a pre-populated new skill session, in a single browser session, with zero CLI access |
| **Minimum validation signal** | The *visibility* half of the loop works end-to-end (signal appears, is legible, and is traceable to its source) even if the *seeding* half (CTA pre-populating a new session with the signal as context) is not yet live — that seeding bridge is explicitly Epic 2 scope, not Epic 1's |
| **Measurement method** | Operator walkthrough in a real browser session without CLI access (matches discovery's own stated measurement approach exactly) |
| **Feedback loop** | If CTA-seeding proves harder to build than expected once Epic 2 starts, the minimum validation signal (visibility alone) still represents genuine, real progress from the 0% baseline — not a stalled metric |

**Cross-epic note:** Metric 3's full target (100%, the complete signal→seed→session loop) is a **feature-level** outcome spanning both epics — Epic 1 (this one, in scope now) delivers the visibility half; Epic 2 (not yet defined into stories) delivers the seeding half. This is intentional and matches the epic's own explicit walking-skeleton slicing strategy, not a scope gap in Epic 1.

---

## Tier 2: Meta Metrics (Learning / Validation)

Not applicable — see Tier Classification above.

---

## Metric Coverage Matrix

| Metric | Stories that move it | Coverage status |
|--------|---------------------|-----------------|
| Metric 1 — Skill launcher clarity | ep1-s3 | Covered (delivered; minimum validation signal met, on-track — see ep1-s3-dod.md) |
| Metric 2 — Improvement signal surfacing | ep1-s1, ep1-s2 (minimum validation signal); ep2-s1 (full target — "displayed per active feature") | Partial — minimum validation signal covered and on-track since Epic 1; full target requires ep2-s1 (not yet started). **Correction (2026-10-01):** this row previously listed `ep1-s3` as delivering signal display — confirmed incorrect post-merge: `ep1-s3` is the skill-launcher redesign, unrelated to signals. See decisions.md 2026-10-01 entry. |
| Metric 3 — Self-improvement loop accessibility | ep2-s1 (visibility half), ep2-s2 (seeding half — target is "land in a pre-populated session," not confirmed completion) | Not yet covered — both contributing stories are newly written, neither yet implemented. **Correction (2026-10-01):** this row previously listed `ep1-s1, ep1-s2, ep1-s3` as delivering the visibility half; confirmed incorrect — none of Epic 1's 3 stories renders a signal in any web UI page. A 3rd story confirming `/improve`'s full execution to completion was drafted then removed as scope creep beyond this metric's own stated target — see decisions.md 2026-10-01 entry. |

---

## What This Artefact Does NOT Define

- Individual story acceptance criteria — those live on story artefacts
- Implementation approach — that is the definition and design artefacts
- Sprint targets or velocity — these metrics are outcome-based, not output-based
