# Discovery: Programme Entry Points

**Status:** Approved
**Created:** 2026-11-08
**Approved by:** Hamish King — Platform Owner — 2026-11-08
**Author:** Claude Sonnet 5 (conversational discovery session with operator)

---

## EA Registry Check

`architecture.ea_registry_authoritative: true` in `.github/context.yml`. No EA registry entry exists for `skills/programme/SKILL.md` or the pipeline-tooling surface this initiative validates — proceeding without blast-radius data. This does not block discovery.

---

## Problem Statement

`/programme` has never been invoked once in this repo's history (`programmes: []`, 0 of 342 features) — but the investigation found the skill only really designs for one way in, and may not even have that one validated:

1. **Top-down entry (the realistic enterprise pattern) — exists but unvalidated.** `/programme`'s Step 1 options (legacy migration, service rewrite, new platform build, regulatory programme) correctly model how real transformative initiatives actually start: a deliberate, top-down decision, not an organic discovery. This repo has simply never had a genuinely big, transformative initiative to invoke it on (`context.yml`: `scope: personal` — correct non-use, not a gap). But that also means this entry path has **never been exercised even once**, by anyone, including synthetically — nobody knows if the skill actually holds up end-to-end for a real top-down invocation.
2. **Bottom-up entry (less common, but real, and currently has zero mechanism) — doesn't exist at all.** Sometimes a programme-shaped effort is already underway as several related features before anyone decides it should be coordinated as one — this repo's own `skills-platform-phase4` (5 epics — `e1`–`e5`, with 5 spikes nested inside `e1` — the largest multi-phase effort in its history, archived at `artefacts/archived/2026-04-19-skills-platform-phase4/`) ran entirely through the standard pipeline, never recognized as programme-shaped by anyone or anything. `/programme`'s own setup flow is entirely prospective (registers workstreams before their own `/discovery` runs) — there's no path from "I notice several related features have grown into this" to "now coordinate them as a programme."

Both entry points matter for the same reason: the real audience for `/programme` is most plausibly a multi-team enterprise-fork consumer (established in initiative 1's constraints section), and neither entry path into the skill has ever been proven to work for them — one because it's never been tried even once, the other because it structurally doesn't exist.

## Who It Affects

1. **The platform maintainer validating skill readiness** (the operator, in practice) — needs confidence that `/programme` actually works before a real transformative initiative arrives, rather than discovering gaps live, under pressure, during an actual migration/rewrite. Trying to accomplish: find and fix gaps now, synthetically, when the cost of being wrong is low.
2. **The eventual enterprise-fork consumer who would invoke it for real** — a genuinely multi-team org running a real transformation, migration, or rewrite. Trying to accomplish: a skill that holds up end-to-end the first time they use it for something consequential, not one that's never been exercised by anyone.

## Why Now

Three things converge:

1. **Platform readiness, just reached** — same precondition as the other initiatives in this tranche: `inner-loop-cycle-efficiency` just completed, hardening CI/pipeline reliability, freeing capacity to look at a dormant, unvalidated skill.
2. **This session's own audit just found the gap, for the first time.** This isn't a hypothetical trigger — the `programmes: []` finding and the `skills-platform-phase4` near-miss were discovered today, during this discovery session, not carried as a known-but-deferred item.
3. **The enterprise-fork relationship is already live, not hypothetical** (established in initiative 1). If a fork consumer started a real transformation today using this platform's artefacts as reference, they'd hit a skill that's either never been exercised (top-down) or structurally can't help them (bottom-up). Finding and fixing that now, cheaply and synthetically, beats a fork consumer discovering it live, under real pressure, mid-migration.

There's also a quieter risk worth naming: `/programme` has sat completely unexercised while the rest of the pipeline (schema, templates, other skills) kept evolving around it. The longer it goes unvalidated, the more likely it's quietly drifted out of sync with the rest of the platform without anyone noticing — the same failure shape as the ADR-030/Guardrails-Registry gap found earlier this session, just for a whole skill instead of one registry entry.

## MVP Scope

A 3-story MVP, consistent with the overhead-amortization pattern already applied in initiatives 1 and 2 — initiative 5 (post-DoD follow-through) isn't built yet, so this can't lean on it to consume anything automatically:

1. **Synthetic top-down validation exercise** — dry-run `/programme`'s full flow (Step 0 qualification through Step 6 programme artefact) retrospectively against `skills-platform-phase4` (the largest, most multi-phase real effort in this repo's history), as if it had been run through `/programme` from the start. Produce a gap report: where did the skill's own instructions hold up, where would they have broken down or felt incomplete?
2. **Fix what story 1 finds** — not just observe gaps, actually patch `/programme/SKILL.md` for any concrete issues the dry-run surfaces. This is real hardening, not a report that sits unused.
3. **A minimal bottom-up detection heuristic** — a small script (not a full mechanism) that flags candidate feature clusters in `pipeline-state.json` suggesting programme-scale growth, weighted primarily on **epic count** (the signal that cleanly separates real programme-candidates from normal complex features in this repo's own data — see Assumptions and Risks), with cross-feature dependency density in `decisions.md` as a secondary signal. Calendar timeline span is deliberately **not** used as a signal — verified inverted in this repo's data (below). Since initiative 5 doesn't exist yet to consume this automatically, it produces a periodic report for the operator to review manually — a real signal, not a fully-automated escalation.

This keeps both entry points addressed with concrete, bounded work — no new orchestration system, no dependency on unbuilt initiatives.

**Delivery surface:** stories 1 and 2 are harness/Claude Code-only (skill-instruction work, no UI). Story 3 is a CLI script for this MVP, producing a manual-review report — not a web UI feature yet, though its output is designed to be artefact-source-agnostic so it can feed initiative 1's visibility surface later without a redesign, the same pattern already established for incident records and patch/deploy events.

## Out of Scope

1. **A real, live top-down `/programme` invocation for an actual new transformative initiative** — this MVP validates synthetically/retrospectively against a historical case; it doesn't manufacture or wait for a real one to test against.
2. **Automated escalation from the bottom-up heuristic into an actual programme artefact** — story 3 produces a manual-review report only; it does not auto-create `programme.md` or auto-register workstreams.
3. **The single-feature follow-through altitude** (post-DoD deferred-scope/delayed-metric mechanism) — split back out as its own separate initiative (5); not part of this one.
4. **A web UI surface for programme candidates** — deferred to a future extension of initiative 1's visibility surface; not built now.
5. **Validating `/programme` against more than one historical case study** — story 1 picks one case (`skills-platform-phase4`); a broader multi-case validation sweep is future work if this first dry-run proves valuable.

## Assumptions and Risks

[ASSUMPTION — RESOLVED 2026-11-08 via /clarify, verified directly against the archived artefact — CONFIRMED, with a correction] `skills-platform-phase4`'s historical artefacts are complete and detailed enough to run a meaningful retrospective dry-run against `/programme`'s Step 0–6. Verified: the archive at `artefacts/archived/2026-04-19-skills-platform-phase4/` holds 205 files covering every stage — `discovery.md`, `benefit-metric.md`, `decisions.md`, 5 epics, spikes, stories, `dor/`, `dod/`, `review/`, `trace/`, `plans/`, `test-plans/`, `verification-scripts/`. This is the richest artefact set checked anywhere this session. Correction: the real structure is **5 epics** (`e1`–`e5`), not "5 spikes gating 3 epics" as originally stated — the 5 spikes are nested inside `e1` specifically.

[ASSUMPTION — RESOLVED 2026-11-08 via /clarify, verified with real data — PARTIALLY INVALIDATED] A simple heuristic (epic count + timeline span + cross-feature dependency mentions in `decisions.md`) is sufficient to flag real programme-candidates without too many false positives. Checked phase4 against `team-identity-roles` (a normal-complexity feature: 1 epic, 9 stories, 4 "depend" mentions in `decisions.md`). Epic count cleanly separates them (5 vs. 1). But **calendar timeline span is inverted in this repo's actual data**: phase4's git-committed artefacts span only 2 days (2026-04-19 → 04-20), while `team-identity-roles` — unambiguously a normal single-feature effort — spans 39 days (2026-07-10 → 08-18). Including timeline span as a signal would have misranked exactly the case it's meant to catch. The heuristic (story 3) now weights epic count as primary and decisions-density as secondary, and drops calendar timeline span entirely.

[ASSUMPTION — stays open, by design, not resolvable at /clarify] Whatever gaps the dry-run finds in `/programme/SKILL.md` will be fixable as targeted patches within this initiative's own scope, not evidence the skill needs a full redesign. This can only be answered once story 1 actually runs — forcing an answer now would manufacture false confidence rather than resolve a real unknown. If the dry-run finds something structurally broken, that's a bigger finding than this MVP is sized for.

**Known constraint, not an assumption:** `/programme/SKILL.md` is a governed file — any patches from story 2 go through CLAUDE.md's "Platform change policy" (PR required, not direct push to master), the same path used for the `bootstrap/SKILL.md` correction earlier this session.

**What could make this not worth building:** if nobody — including any eventual enterprise-fork consumer — ever actually launches a real transformative initiative, this validation work never gets exercised in anger. That's the same risk every "harden it before someone needs it" initiative carries, and it's why doing this synthetically and cheaply now, rather than waiting, is still the right call even if the risk never materializes.

## Directional Success Indicators

1. **Retrospective dry-run completion.** Baseline: 0 of 342 tracked features have ever had `/programme` Step 0–6 run against them, even synthetically — confirmed via the audit script against `pipeline-state.json`. Target: 1 complete, documented dry-run of `/programme` Steps 0–6 against `skills-platform-phase4`'s historical artefacts, with a pass/fail/gap verdict recorded per step. Measured via: the dry-run write-up artefact names, for each of the 7 steps, whether phase4's actual history would have satisfied it.
2. **Qualification-gate fix validated against a real case.** Baseline: Step 0's gate fails by construction for this repo (`context.yml`: `meta.scope: "personal"`, `scaling.target_team_count: 1`) — phase4 itself could not have passed Step 0 as currently written, despite being the closest real analogue to a big-bet effort this repo has produced. Target: a revised Step 0 gate that phase4's real historical profile would pass, without removing the gate's ability to reject a normal complex feature. Measured via: a before/after gate-logic check against the phase4 case (fail → pass) and against at least one normal multi-story feature from `pipeline-state.json` (pass → still fail, i.e. no false positive introduced).
3. **Routing visibility for a genuine big-bet candidate.** Baseline: `/orient` and `/workflow` never surface `/programme` in any routing state — confirmed by reading both skills; it is reachable only via an explicit cold menu pick that re-runs the same failing gate. Target: at least one routing path exists (in `/orient` or `/discovery`'s own entry point) that surfaces `/programme` as an option when a new idea's framing matches transformative/multi-team/multi-phase signals. Measured via: a routing-state count before vs. after — 0 states mentioning `/programme` today, ≥1 after, verified by re-reading the edited skill files.
4. **Bottom-up detection heuristic — directional only, `[UNKNOWN BASELINE]` on real-world precision.** Baseline: no detection mechanism exists at all today — not a false-positive-rate baseline, a complete absence baseline. Target: a CLI script exists that scans epic count (primary signal) and `decisions.md` dependency density (secondary signal) — explicitly not calendar timeline span, confirmed inverted in this repo's data (see Assumptions and Risks) — and correctly flags `skills-platform-phase4` (5 epics) as a candidate (true positive) while not flagging `team-identity-roles` (1 epic) as one (true negative). Measured via: script run against those two known historical cases pre-ship. Real-world false-positive rate on future features is `[UNKNOWN BASELINE]` — this MVP can't produce that number; it's logged as the condition for the first `/decisions` revisit of this heuristic, not a target to hit now.

## Constraints

**Governed-file PR requirement:** any patch to `skills/programme/SKILL.md` (story 2) goes through CLAUDE.md's Platform change policy — branch + PR, never direct push to master, same path used for the `bootstrap/SKILL.md` correction earlier this session.

**"Not a persistent agent runtime" constraint** (`product/constraints.md` #11): the detection heuristic (story 3) must be a CLI script invoked on demand or from a CI job — not a standing watcher — consistent with how initiative 2's checks were scoped.

**Design-system constraint** (#9) does not apply — no `src/web-ui/` surface in this MVP; stories 1–2 are harness/Claude Code-only, story 3 is a CLI script.

**EA registry Path B**, same as initiatives 1 and 2 — no existing entry for the skills-platform/pipeline tooling itself in the EA registry.

**Process constraint:** story 3's script lands under `scripts/`, which per CLAUDE.md's Artefact-first rule needs its own story artefact (discovery → DoR chain) before/alongside implementation — already satisfied by this discovery; a note for `/definition`, not a new constraint to invent.

No time/budget/team-capability constraints identified beyond these.

## Contributors

- Hamish King — Platform Owner — 2026-11-08

## Reviewers

- [None yet]

## Approved By

Hamish King — Platform Owner — 2026-11-08

---

## Clarification log

[2026-11-08] Clarified via /clarify:
- Q: Are `skills-platform-phase4`'s historical artefacts complete enough for a meaningful retrospective dry-run? A: Confirmed — verified directly at `artefacts/archived/2026-04-19-skills-platform-phase4/`, 205 files across every pipeline stage. Correction applied: 5 epics (`e1`–`e5`), not "5 spikes gating 3 epics" as originally stated.
- Q: Is the proposed heuristic (epic count + timeline span + decisions-density) sufficient to flag real programme-candidates without too many false positives? A: Partially invalidated with real data — checked against `team-identity-roles` (1 epic, 9 stories, 39-day span) vs. phase4 (5 epics, 2-day span). Timeline span is inverted in this repo's actual history and was dropped from the heuristic; epic count is the primary signal, decisions-density secondary.
- Q: Will gaps the dry-run finds in `/programme/SKILL.md` be fixable as targeted patches, not a full redesign? A: Left genuinely open — not resolvable before story 1 runs; recorded as an accepted residual risk rather than forced to a premature answer.

---

**Next step:** Human review and approval → /benefit-metric
