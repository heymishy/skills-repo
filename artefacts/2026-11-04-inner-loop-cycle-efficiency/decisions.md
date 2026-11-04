# Decision Log: inner-loop-cycle-efficiency

**Feature:** Inner Loop Cycle Efficiency
**Discovery reference:** artefacts/2026-11-04-inner-loop-cycle-efficiency/discovery.md
**Last updated:** 2026-11-04

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-11-04 | ASSUMPTION | discovery/clarify**
**Decision:** Spec-compliance and code-quality review dispatches in `/subagent-execution` will run in parallel by default; whenever either reviewer requires a fix, the *other* reviewer's result (evaluated against pre-fix code) is discarded and re-dispatched against the post-fix code. **Updated 2026-11-04 at /review:** the mechanism is symmetric, not one-directional — the original framing (only spec-compliance fixes trigger a code-quality re-dispatch) left the reverse direction (a code-quality fix invalidating spec-compliance's already-passed verdict) unaddressed, flagged as finding `1-M1` in `ilce-s3`'s review and resolved by making the discard-and-re-dispatch rule apply to either direction.
**Alternatives considered:** (a) keep strictly sequential as today — rejected, wastes wall-clock time on the majority-case clean pass; (b) parallelize unconditionally with no discard step — rejected as unsafe, a fix on either side could introduce an issue invisible to the other reviewer's pre-fix pass; (c) one-directional discard (spec-fix only) — the story's original design, rejected at /review for leaving the reverse direction as an unacknowledged asymmetric risk.
**Rationale:** the review-yield audit (run in the session preceding this discovery) found spec-compliance review passes clean 56-83% of the time depending on Complexity Rating — the majority case. The existing strict sequencing pays a wall-clock cost on most tasks to protect against a risk that's real but minority-case. Discard-and-re-dispatch preserves full correctness while still capturing the majority-case time savings.
**Made by:** Hamish King (via /clarify Q1, 2026-11-04)
**Revisit trigger:** if the real spec-review failure rate, once measured via the new instrumentation, proves much higher than the 17-44% range already observed, re-evaluate whether parallelizing is still net-positive.
---

---
**2026-11-04 | ASSUMPTION | discovery/clarify**
**Decision:** The DoD-handoff enforcement check is built inside `/workflow`'s existing `pipeline-state.json` read (merged + stage≠definition-of-done + age>threshold → flag), surfaced prominently in the session-start report — not a new scheduled CI job.
**Alternatives considered:** (a) a new scheduled GitHub Actions job for always-on coverage — rejected, adds new CI infrastructure and review burden disproportionate to a solo-operator, session-based repo; (b) both the `/workflow` check and a scheduled CI job — rejected as more build cost than needed given CLAUDE.md already mandates `/workflow` at every session start.
**Rationale:** the original 22-story merged-but-no-DoD gap happened because no mechanism existed to catch it, not because the session-start `/workflow` convention wasn't followed. Making the existing convention's output more prominent closes the gap without new infrastructure.
**Made by:** Hamish King (via /clarify Q2, 2026-11-04)
**Revisit trigger:** if the gap keeps recurring despite this change — i.e., the session-start check isn't actually preventing new occurrences — escalate to a scheduled CI job.
---

---
**2026-11-04 | ARCH | definition**
**Decision:** The DoD-handoff enforcement check (story #3) must cross-reference live `gh pr list --state merged` against each story's `prUrl`, not rely solely on reading `pipeline-state.json`'s own `prStatus`/`stage` fields as the earlier `/clarify` answer assumed. Still runs inside `/workflow` at session-time — no new CI job.
**Alternatives considered:** (a) pipeline-state.json-only check as originally scoped at `/clarify` — rejected, this is the exact failure mode ADR-030 already proved insufficient (two merged PRs sat undetected for ~7 weeks because an unrelated merge-conflict resolution silently reverted `prStatus`, and a check reading that same field reported clean); (b) a brand-new reconciliation mechanism — rejected, ADR-030 already specifies the solution pattern, no need to re-derive it.
**Rationale:** `.github/architecture-guardrails.md`'s ADR-030 is a direct, already-paid-for precedent for this exact check — applying it is cheaper and more reliable than inventing a narrower pipeline-state.json-only version that repeats a known failure mode.
**Made by:** Hamish King (via /definition Step 1.5 architecture scan, 2026-11-04)
**Revisit trigger:** none — this refines the /clarify Q2 decision rather than reopening it; see ADR-030's own revisit trigger for when the underlying reconciliation need itself might go away.
---

---
**2026-11-04 | ARCH | definition**
**Decision:** This feature's `pipeline-state.json` entry uses epic-nested `feature.epics[].stories[]`, not flat `feature.stories[]` — reversing an earlier lean toward flat based on `architecture-guardrails.md`'s ADR-017.
**Alternatives considered:** (a) flat `feature.stories[]` per ADR-017's literal "all new features use flat" guidance — initially preferred, then rejected after investigation; (b) epic-nested per `/definition`'s own SKILL.md instruction and recent real-world precedent — chosen.
**Rationale:** a dedicated investigation found ADR-017 is 6 months stale (dated 2026-05-02) and was never acted on for any of this repo's recent multi-epic work — the 5 most recently updated features in the repo (including `fhff` itself) are all epic-nested. More decisively, `/workflow`'s own session-start reconciliation logic and the pipeline visualiser (`dashboards/pipeline-viz.html`) are both built around `epics[].stories[]` specifically, not shape-agnostic — a flat-shaped feature risks being mishandled by both. The 11 other skills checked are genuinely shape-agnostic. Real tooling behavior outweighs a stale ADR that was never followed in practice.
**Made by:** Hamish King (via dedicated fork investigation at /definition, 2026-11-04)
**Revisit trigger:** if `architecture-guardrails.md`'s ADR-017 is formally revised or `/workflow`/the visualiser are updated to be shape-agnostic, revisit which shape new features should use. Separately, ADR-017 itself appears to need a platform-maintenance update to reflect actual practice — flagged here as an observation, not actioned in this story.
---

---
**2026-11-04 | SCOPE | definition-of-ready**
**Decision:** `ilce-s1`'s AC1 amended to add a `fullSuite: boolean` field for `/verify-completion`-stage timing records, discovered missing during `/definition-of-ready`'s mandatory Contract Proposal step for `ilce-s2`.
**Alternatives considered:** (a) leave `ilce-s1` as-is and have `ilce-s2` infer full-suite coverage some other way (e.g. a separate signal) — rejected, no other signal exists and inventing one would duplicate data `ilce-s1` is already positioned to record; (b) amend `ilce-s1`'s AC1 directly — chosen, since `ilce-s1` hadn't shipped yet and the fix is a one-field addition to an already-planned record.
**Rationale:** this is exactly the failure mode `/definition-of-ready`'s Contract Proposal step exists to catch — a downstream story's AC quietly assumed data an upstream story's AC never promised. Caught before implementation, not during it.
**Made by:** Hamish King (via /definition-of-ready Contract Review, 2026-11-04)
**Revisit trigger:** none — this is now part of `ilce-s1`'s shipped contract.
---

---
**2026-11-04 | ASSUMPTION | discovery/clarify**
**Decision:** Instrumentation is a new, standalone append-only log, `.github/pipeline-timings.jsonl`, written by each relevant skill's own "State update" step — not new fields added to `pipeline-state.json`, and not further mining of Claude Code's own session-transcript logs.
**Alternatives considered:** (a) add timing fields directly into `pipeline-state.json` — rejected, triggers CLAUDE.md's Artefact-first rule's schema-change requirement for no real benefit, and risks the large-JSON read-modify-write fragility already experienced in the session preceding this discovery; (b) continue mining Claude Code's session-transcript logs — rejected, confirmed unreliable in that same session (`gitBranch` broken by git worktrees, slug-text-matching contaminated by later, unrelated citations).
**Rationale:** a separate append-only file avoids both the governance overhead of a `pipeline-state.json` schema change and the fragility/unreliability found when trying to reconstruct timing data after the fact from raw session logs. Purpose-built structured writes at the source are simpler and trustworthy by construction.
**Made by:** Hamish King (via /clarify Q3, 2026-11-04)
**Revisit trigger:** if a rollup/summary view proves necessary once real usage accumulates, add a periodic rollup mechanism as a follow-up — that would extend this decision, not reverse it.
---

---

## Architecture Decision Records

<!-- None yet for this feature. -->
