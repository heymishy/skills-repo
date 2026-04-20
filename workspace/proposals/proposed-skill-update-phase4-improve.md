# Proposed Skill Updates — Phase 4 /improve

**Source feature:** `2026-04-19-skills-platform-phase4`
**Produced by:** `/improve` run — 2026-04-21
**Status:** Awaiting operator review — do not apply directly to SKILL.md files
**Governed path:** Operator raises a PR against the fleet repo; platform team reviews and merges; consuming repos receive the improvement on next upstream sync.

---

## Proposal 1 — `/definition` SKILL.md: Spike-first gate guidance

**Confidence:** High (D13, observed across all 5 spikes in Phase 4)
**Rationale:** Phase 4's spike programme (p4-spike-a through p4-spike-d) prevented multiple REDESIGN failures by validating mechanism feasibility before ACs were written. The pattern should be surfaced as an explicit step in `/definition` so future definition runs propose spike stories when a novel mechanism dependency is detected.

**Proposed insertion point:** After Step 4 (story decomposition) and before the scope accumulator runs.

**Proposed text to insert in `/definition` SKILL.md:**

```markdown
### Step 4b — Spike-gate check (novel mechanisms)

After decomposing epics into stories, scan for any story whose AC depends on a mechanism
that has not previously been confirmed as viable in this codebase or in a prior spike:

- "the bot will enforce X structurally" — X has never been implemented
- "the CLI will call Y via Z interface" — Z interface has not been tested
- "the adapter will integrate with W" — W integration feasibility is unknown

For any such dependency:
1. Propose a spike story (scope: 1–2 days, question: PROCEED/REDESIGN/DEFER on the mechanism)
2. Mark the dependent implementation story as blocked until the spike returns PROCEED
3. If the spike returns REDESIGN: revise the implementation story ACs before DoR
4. If the spike returns DEFER: descope the story from this phase; create a future-phase placeholder

**Anti-pattern:** Writing implementation ACs speculatively ("Teams bot enforces C7 structurally")
before validating that C7 can be enforced on that surface at all. The spike must drive the ACs,
not the other way around.

**When this check fires:** Any epic where the mechanism is novel (no prior implementation evidence
in the codebase for the enforcement approach, integration point, or surface class).

**When this check does not fire:** Stories that extend or modify known, tested patterns.
```

---

## Proposal 2 — `/definition-of-done` SKILL.md: Consolidated DoD selection guidance

**Confidence:** High (D12, observed at Phase 4 — 27 stories as a coordinated batch)
**Rationale:** Phase 4 correctly used a consolidated DoD artefact rather than 27 individual per-story DoD artefacts. This pattern should be codified so future DoD runs make an explicit, informed choice rather than defaulting to per-story or consolidated without criteria.

**Proposed insertion point:** Entry condition / preamble section of `/definition-of-done` SKILL.md.

**Proposed text to insert in `/definition-of-done` SKILL.md:**

```markdown
### Consolidated vs per-story DoD selection

Before running DoD, decide whether to produce a consolidated feature-level artefact or individual per-story artefacts:

**Use consolidated DoD when all of the following apply:**
- Feature has 10+ stories AND they shipped as a coordinated batch (not independent releases)
- All stories share a single phase boundary (one commit batch, one PR set, one release)
- NFRs and metrics are feature-level, not per-story
- A single operator session closes all stories simultaneously

**Use per-story DoD when any of the following apply:**
- Stories ship to production independently (separate releases, separate deployments)
- A story has story-specific NFRs or metrics distinct from the feature-level set
- The DoD artefact is the primary audit trail for a single-story change (hotfix, bug fix)
- Stories were dispatched and completed at different times across multiple sessions

**Consolidated DoD format requirement:**
A consolidated DoD MUST include an explicit AC coverage table per story (not just per epic).
"Epic X: all stories complete" is not sufficient — the table must show each story's test count
and AC-by-AC verification summary to preserve individual story traceability.
```

---

## Proposal 3 — `/estimate` SKILL.md: outerLoopCharacter field at E2

**Confidence:** High (D15, Phase 4 E2 was 8× under-estimated due to unmodelled genuine-decision character)
**Rationale:** The standard estimate formula (`calendarDays × 2 × engagementFraction`) assumes the operator is validating agent-proposed artefacts (artefact-validation character). Features with spike programmes or novel mechanism decisions require the operator to reason through options, adjudicate trade-offs, and seek external validation — this is structurally different and the formula underestimates significantly.

**Proposed insertion point:** E2 estimate collection step in `/estimate` SKILL.md.

**Proposed text to insert in `/estimate` SKILL.md:**

```markdown
### E2 outer loop character

Before recording the E2 estimate, classify the outer loop character:

**`artefact-validation`** (most features — Phases 1, 2, 3 pattern):
Agent proposes artefacts; operator validates and approves. Focus time scales with volume
(number of artefacts to review). Standard formula applies.

**`genuinely-novel-decisions`** (spike-heavy features — Phase 4 pattern):
Operator must reason through options, adjudicate architectural trade-offs, and in novel cases
seek external validation (second model, reference material). Agent produces candidate options
but the decision belongs to the operator. Focus time scales with decision complexity, not story count.

**Calibration adjustment when `genuinely-novel-decisions`:**
- Add +0.5h flat for each spike epic (E1-type epic in the feature)
- Apply a minimum floor: `storyCount × 0.35h`
- Use whichever is higher: `max(derivedEstimate + spikeFlat, storyCount × 0.35h)`

**Record in estimation-norms.md YAML block:** `outerLoopCharacter: "genuinely-novel-decisions"` or `"artefact-validation"`

**Examples:**
- Phase 4 (24 stories, 5 spikes, genuinely-novel-decisions): E2 was 0.75h; calibrated estimate = max(0.75 + 2.5, 24×0.35) = max(3.25, 8.4) = 8.4h. Actual: ~6h. Delta: −2.4h (32% over, acceptable vs 8× with raw formula).
- Phase 3 (13 stories, 0 spikes, artefact-validation): standard formula applicable.
```

---

## Summary

| Proposal | Target SKILL.md | Category | Confidence | Status |
|----------|----------------|----------|-----------|--------|
| P1 — spike-first gate | `/definition` | B (standards gap) | High | Awaiting operator PR |
| P2 — consolidated DoD selection | `/definition-of-done` | B (standards gap) | High | Awaiting operator PR |
| P3 — outerLoopCharacter at E2 | `/estimate` | B (standards gap) | High | Awaiting operator PR |

**Note:** These proposals require a PR against the fleet repo reviewed by the platform team. Do not apply directly to SKILL.md files.
