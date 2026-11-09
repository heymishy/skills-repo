# Decision Log: programme-entry-points

**Feature:** Programme Entry Points
**Discovery reference:** artefacts/2026-11-08-programme-entry-points/discovery.md
**Last updated:** 2026-11-08

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
**2026-11-08 | ASSUMPTION | discovery (/clarify)**
**Decision:** Correct the discovery's description of `skills-platform-phase4` from "5 spikes gating 3 epics" to its real structure: 5 epics (`e1`–`e5`), with the 5 spikes nested inside `e1` specifically. The artefact itself lives at `artefacts/archived/2026-04-19-skills-platform-phase4/` (archived, not in the live `artefacts/` tree) and holds 205 files across every pipeline stage — confirmed sufficient for story 1's retrospective dry-run.
**Alternatives considered:** The discovery draft's original, unverified description ("5 spikes gating 3 epics"), carried forward from an earlier session summary rather than checked directly.
**Rationale:** Read the real artefact directory and `pipeline-state.json`'s `phase4.spikes` block directly during /clarify rather than trusting the inherited description. Getting the structure right matters because story 1's dry-run report will reference these epics by name.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /clarify session, 2026-11-08
**Revisit trigger:** None expected — this is a factual correction, not a design choice that could later reverse.
---
**2026-11-08 | ASSUMPTION | discovery (/clarify)**
**Decision:** Drop calendar timeline span from the bottom-up detection heuristic (story 3). Weight epic count as the primary signal and `decisions.md` cross-feature dependency density as a secondary signal.
**Alternatives considered:** The discovery draft's original three-signal heuristic (epic count + timeline span + decisions-density), assumed sufficient without checking against real data.
**Rationale:** Checked `skills-platform-phase4` (5 epics, 2-day git-committed artefact span) against `team-identity-roles` (1 epic, 9 stories, 39-day span) — a normal single-feature effort the heuristic must NOT flag. Timeline span is inverted in this repo's actual history: the normal feature took 19x longer in wall-clock terms than the genuine programme-candidate. Including it would have misranked exactly the case the heuristic exists to catch. Epic count cleanly separates the two cases (5 vs. 1); timeline span does not.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /clarify session, 2026-11-08
**Revisit trigger:** If story 3's dry-run against a third historical case shows epic count alone produces too many false positives, re-evaluate whether a different secondary signal (not timeline span) is needed.
---

---
**2026-11-09 | RISK-ACCEPT | benefit-metric**
**Decision:** Metric owner on `benefit-metric.md` is self-assigned to Hamish King (Platform Owner). Reviewers remains `[Pending]` rather than self-assigned.
**Alternatives considered:** (A) Self-assign Hamish King as both owner and reviewer — rejected, since the point of an independent reviewer is a second perspective on whether a metric is honest and measurable, which self-review cannot provide. (B) Fabricate a placeholder reviewer role to satisfy the skill's completion check — rejected, contradicts this pipeline's "never invent" discipline for unfilled fields.
**Rationale:** Metric owner is a genuine accountability role this operator already holds across every delivery artefact in this repo; self-assigning it reflects reality rather than inventing a role. The Reviewers field is left honestly unfilled because no second contributor exists in this personal-scope team to fill it.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), 2026-11-09
**Revisit trigger:** If a second contributor ever joins this project, assign them as Reviewer on this and every other open benefit-metric artefact rather than continuing to leave the field pending.
---

---
**2026-11-09 | ARCH | definition — Step 0 mechanism correction**
**Decision:** Correct the discovery's claim that `/programme`'s Step 0 gate automatically fails by reading `context.yml`'s `meta.scope`/`scaling.target_team_count` fields. It does not — Step 0 is a conversational Q1–Q4 Q&A (team count, cross-team dependencies, phase gates, consumer migration); `skills/programme/SKILL.md` never references `context.yml` anywhere (confirmed by direct grep). Answered honestly against phase4's real history, it still fails every scoring signal — a correct outcome for a genuinely single-team effort, not a bug caused by a config read. Reframe story 2's fix target accordingly: add an epic-count-based signal to Step 0's scoring table (reusing story 3's own validated primary signal) so a single-team, programme-scale-by-epic-count effort has a structured qualification path, rather than "fix a context.yml read" that doesn't exist to fix.
**Alternatives considered:** (A) Leave the discovery's mechanism claim uncorrected and have story 2 "fix" a context.yml-reading behaviour that was never real — rejected, this would produce a story whose AC set targets nonexistent code. (B, chosen) Correct the record and retarget the fix at the real gap (no structured single-team escape hatch), unifying it with story 3's own epic-count signal for internal consistency.
**Rationale:** Verified directly by reading `skills/programme/SKILL.md` Step 0 (lines 37–98) in full before writing story 2 — the same "read the real code before building on an assumption" discipline applied throughout this session (see initiative 1's `kanban-view.js` correction, logged 2026-11-09 in that feature's own `decisions.md`, for the precedent this follows).
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /definition session, 2026-11-09
**Revisit trigger:** None — factual correction of a verifiable code claim, not a design choice that could later reverse.
---
**2026-11-09 | ARCH | definition — routing-visibility premise correction**
**Decision:** Correct the discovery's claim that "0 routing states mention `/programme` today... confirmed by reading `/orient` and `/workflow` directly." `/workflow` (`skills/workflow/SKILL.md`) already has substantial `/programme` routing: a route-selector option 5, a Complex-track signal, and an informal Q1–Q4-equivalent pre-check (lines ~164–189) that duplicates Step 0's own gate logic almost exactly. Only `/orient` genuinely has 0 mentions, confirmed by direct grep. Retarget story 2's routing-visibility work at the real gap: make `/workflow`'s pre-check defer to `/programme`'s Step 0 rather than duplicating its questions (a duplication-drift consistency risk, the same hazard `MC-CONSIST-02` names for gate logic generally), and add the missing cross-reference to `/orient`.
**Alternatives considered:** (A) Leave the false "0 routing states" baseline uncorrected and have story 2 "add" a routing path that already exists in `/workflow` — rejected, this would either produce a no-op story or an unintentional duplicate of existing routing logic. (B, chosen) Correct the baseline and retarget at the real, verified gap (duplication risk + `/orient`'s missing cross-reference).
**Rationale:** Verified directly by reading `skills/workflow/SKILL.md` lines 95–194 in full before writing story 2, rather than trusting the discovery's own "confirmed by reading both skills" claim at face value — the second such correction found in this initiative's discovery during this same /definition session, both from the same root cause: a discovery-time claim stated as verified that wasn't actually checked against the real file content.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /definition session, 2026-11-09
**Revisit trigger:** None — factual correction of a verifiable code claim, not a design choice that could later reverse.
---

---
**2026-11-09 | ARCH | review — epic-count threshold pinned**
**Decision:** Pin the epic-count threshold both `pep-s2` (AC1) and `pep-s3` (AC1-AC3) reference at **≥4 epics within a single feature**.
**Alternatives considered:** (A) Leave it as "a defined threshold" for the implementation plan to invent — rejected by `/review` (findings 1-H1 on both stories): both comparison data points (`skills-platform-phase4`: 5 epics; `team-identity-roles`: 1 epic) were already known at /definition time, so deferring the number served no real purpose and left both ACs untestable. (B) Pin the minimum possible separating value (≥2) — rejected, too tight against the one known normal-complexity case with no margin. (C, chosen) ≥4 — strictly between 1 and 5, a round and defensible cutoff with margin on both sides, not merely "whatever number happens to separate these two specific cases."
**Rationale:** `/review` (2026-11-09) found both stories referenced the same unpinned value, and that `pep-s2` explicitly inherits it from `pep-s3`, compounding into neither AC set being independently testable. Fixed together so both stories state the identical number.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /review fix-and-rerun, 2026-11-09
**Revisit trigger:** If `pep-s1`'s dry-run or a future third historical case shows ≥4 produces a false positive or false negative, revisit the exact cutoff — the number itself was never validated against more than the 2 known cases.
---

---
**2026-11-09 | RISK-ACCEPT | definition-of-ready — W4 verification-script review, all 3 stories**
**Decision:** Acknowledge, rather than resolve, DoR Warning W4 ("verification script reviewed by a domain expert") for `pep-s1`, `pep-s2`, and `pep-s3` together, in a single shared entry. No second contributor has independently reviewed any of the 3 AC verification scripts in `artefacts/2026-11-08-programme-entry-points/verification-scripts/`.
**Alternatives considered:** (A) Block DoR sign-off on all 3 stories until an independent review happens — rejected, since no second contributor exists in this personal-scope project; blocking on a review role that cannot be filled would stall delivery indefinitely rather than manage a real, bounded risk. (B, chosen) Acknowledge explicitly, as W4's own stated option 2 allows, with a concrete revisit trigger.
**Rationale:** Hamish King, as the story author and Platform Owner, is the only available reviewer. This is the same honest-gap pattern already applied to the benefit-metric Reviewers field (2026-11-09, this feature's own earlier decisions.md entry) — leaving a role unfilled rather than fabricating a second sign-off.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /definition-of-ready, 2026-11-09
**Revisit trigger:** If a second contributor joins this project, have them formally review these 3 verification scripts before the next time any of these stories' scope changes.
---

## Architecture Decision Records

<!-- None yet for this feature. -->
