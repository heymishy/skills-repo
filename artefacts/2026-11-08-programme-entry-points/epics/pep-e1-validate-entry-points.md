## Epic: /programme holds up for a real invocation, from either direction

**Discovery reference:** artefacts/2026-11-08-programme-entry-points/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-programme-entry-points/benefit-metric.md
**Slicing strategy:** Risk-first

Chosen because this epic's whole purpose is de-risking a dormant, never-exercised skill before a real transformative initiative arrives. Story 1 (the retrospective dry-run) is the highest-uncertainty piece — its own Tier 2 meta-metric explicitly frames it as a hypothesis that could be invalidated — and story 2's scope is bounded by whatever story 1 actually finds, not decided in advance. Story 3 (the bottom-up heuristic) is a second, independent validation exercise with its own meta-metric. Risk-first fits better than vertical slice or walking skeleton because the point is explicitly to surface unknowns before committing to fixes, not to ship independently demo-able slices of a known design.

## Goal

When this epic is complete, `/programme`'s Step 0–6 has been exercised at least once (retrospectively, against `skills-platform-phase4`'s real history) with a documented pass/fail/gap verdict per step; every concrete gap that dry-run found has either been patched in `skills/programme/SKILL.md` or explicitly accepted as a residual risk; and a CLI script exists that can flag a programme-scale feature cluster in `pipeline-state.json` using a validated signal (epic count), without waiting for a real transformative initiative to prove any of this the hard way.

## Architecture constraints scan (Step 1.5)

`.github/architecture-guardrails.md` exists and was read. Relevant constraints:

- **Governed-file PR requirement**: any patch to `skills/programme/SKILL.md` (story 2) goes through CLAUDE.md's Platform change policy — branch + PR, never direct push to master, same path used for the `bootstrap/SKILL.md` correction earlier this session and the ADR-001 correction this session.
- **`product/constraints.md` #11** (no persistent agent runtime): story 3's detection heuristic is a CLI script invoked on demand or from a CI job, never a standing watcher.
- **No `hasDesignSystemTrack`**: confirmed, no `src/web-ui/` surface in this MVP.
- **ADR-011 / Artefact-first**: story 3's new `scripts/` file requires this chain, already satisfied by this discovery and this epic.
- **MC-CONSIST-02** (gate add/remove synced with SKILL.md criteria): directly relevant to story 2's `/workflow` de-duplication fix — the two gates (`/programme` Step 0, `/workflow`'s informal pre-check) must not be allowed to silently drift apart, which is exactly the defect story 2 corrects.
- Verified directly in code before writing stories (not assumed from the discovery text alone, after finding the discovery itself had two unverified "confirmed" claims — see `decisions.md`, 2026-11-09): `skills/programme/SKILL.md`'s Step 0 (lines 37–98) is a conversational Q1–Q4 gate with zero `context.yml` references; `skills/workflow/SKILL.md` (lines 95–194) already has a route-selector option, a Complex-track signal, and an informal pre-check duplicating Step 0; `skills/orient/SKILL.md` genuinely has zero `/programme` mentions.

No guardrail here is a blocker before decomposing.

## Out of Scope

- **A real, live top-down `/programme` invocation** — story 1 validates synthetically/retrospectively; it does not manufacture or wait for a real transformative initiative.
- **Automated escalation from story 3's heuristic into an actual programme artefact** — manual-review report only; no auto-created `programme.md`, no auto-registered workstreams.
- **The single-feature follow-through / post-DoD mechanism** — split out as initiative 5, not part of this epic.
- **A web UI surface for programme candidates** — deferred to a future extension of initiative 1's visibility surface.
- **Validating `/programme` against more than one historical case** — story 1 uses `skills-platform-phase4` only; a broader multi-case sweep is future work if this first dry-run proves valuable.
- **A full redesign of `/programme` if story 1 finds something structurally broken** — per the discovery's own open (not pre-resolved) assumption, that would be a bigger finding than this MVP is sized for, and would be surfaced as a new discovery, not absorbed into story 2 silently.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| Qualification-gate fix validated against a real case | Step 0 fails every scoring signal for phase4's honest history today — correct behaviour, but no structured single-team escape hatch | A new epic-count signal passes the phase4 case without introducing a false positive on a normal feature | Story 2, informed by story 1's and story 3's findings |
| Routing visibility for a genuine big-bet candidate | `/workflow` already routes to `/programme` but duplicates Step 0's gate; `/orient` has zero mentions | `/workflow` defers instead of duplicating; `/orient` gains a cross-reference | Story 2 |
| Retrospective dry-run validity (meta) | 0 of 342 features have ever had Step 0–6 run against them, even synthetically | A complete, documented dry-run with a pass/fail/gap verdict per step | Story 1 |
| Bottom-up detection heuristic validity (meta) | No detection mechanism exists at all today | Correctly classifies both known historical cases (phase4 true positive, team-identity-roles true negative) | Story 3 |

## Stories in This Epic

- [ ] Retrospective dry-run of /programme Steps 0-6 against skills-platform-phase4 — pep-s1
- [ ] Patch /programme and /workflow for the gaps story 1 (and the discovery-correction) found — pep-s2
- [ ] Bottom-up programme-candidate detection script (epic-count primary signal) — pep-s3

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Story 2 patches a governed skill file (`skills/programme/SKILL.md`) and a widely-used routing skill (`skills/workflow/SKILL.md`) — not regulated or customer-facing, but a mistake here could misroute every future feature's track selection, warranting human PR review before merge.

## Complexity Rating

**Rating:** 2
**Rationale:** Story 1 is well-understood in mechanism (read artefacts, compare against steps) but genuinely uncertain in outcome — that uncertainty is the point, not a complexity risk to resolve before starting. Story 2's scope is bounded by story 1's findings plus the two discovery corrections already made. Story 3 is a small, well-scoped script against two known cases.

## Scope Stability

**Stability:** Unstable
**Rationale:** Story 2's exact scope cannot be fully fixed until story 1's dry-run completes — this is intentional, not a planning gap, consistent with the epic's own risk-first ordering. Flagged explicitly so a reviewer doesn't mistake "scope may grow slightly once story 1 runs" for scope creep.
