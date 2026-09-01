# Decisions: Cross-Channel Feature Continuity (new-feature-af17f555)

<!-- Created retroactively 2026-09-01, per this repo's decisions.md mandatory rule, covering decisions made while backfilling this feature's artefacts and bringing it to DoR-ready level. -->

---

## 2026-09-01 — Artefact resolution: directory-scan model, not singular pipeline-state.json fields

**Context:** `design.md`'s Component 2 originally modeled every stage's prior-work artefact as a single file at a single `pipeline-state.json` path field (`storyArtefact`, `reviewArtefact`, etc.) — an assumption already false for CLI-driven `/definition` and `/review`, which split into multiple per-epic/per-story/per-run files.

**Decision:** Component 2 revised to resolve artefacts by directory scan for `definition` and `review` stages, while single-file stages (discovery, benefit-metric, design) keep the original singular-path resolution.

**Rationale:** Matches what `darc-s1` (PR #807) actually made the Web UI write, and what the CLI's own `/definition`/`/review` skills have always produced. Superseded text kept inline in `design.md` (not deleted) for the audit trail, per this repo's traceability standard.

---

## 2026-09-01 — DoR oversight level: follow epic-declared Medium literally, do not silently repeat ep1-s1's Low

**Context:** The epic (`epics/cross-channel-feature-continuity.md`) declares `Oversight: Medium`. `ep1-s1`'s own DoR (run live in production, 2026-05-16) recorded `Oversight: LOW` without visibly checking the epic field, as `definition-of-ready/SKILL.md` instructs.

**Decision:** For `ep1-s2` through `ep1-s6` (all DoR'd today, not backfilled from a live production run), the DoR skill's own instruction is followed literally: **Medium**. The discrepancy with `ep1-s1`'s already-signed-off Low is noted explicitly in each new DoR artefact rather than silently matched or silently ignored.

**Rationale:** `ep1-s1`'s sign-off is historical production record and not something this session should retroactively rewrite. But new DoR runs should follow the skill as written, not propagate a possibly-unintentional shortcut. Medium oversight ("tech lead awareness required") was self-acknowledged by the operator (Hamish King), who is both platform owner and de facto tech lead in this solo-operator context.

---

## 2026-09-01 — RISK-ACCEPT: verification scripts not reviewed by a domain expert distinct from the author (W4)

**Context:** `definition-of-ready/SKILL.md`'s W4 warning requires the AC verification script to be reviewed by a domain expert before proceeding, or explicitly acknowledged as a risk.

**Decision:** Accepted as a risk for `ep1-s2` through `ep1-s6`. No separate review was obtained.

**Rationale:** This is a solo-operator dogfooding session on internal platform tooling with no external or regulated impact. The operator wrote and is the sole reviewer of these artefacts. Consistent with how this repo has handled W4 on other single-operator stories.

---

## 2026-09-01 — ep1-s1 retargeted from a new skill-picker feature to extending the existing Journeys page

**Context:** Before starting `/implementation-plan` for `ep1-s1`, an investigation (this session) confirmed its original 2026-05-16 DoR contract was stale: the literal AC ("skill picker shows in-progress features, Continue posts to `/api/skills/[skill]/sessions?featureSlug=`") is satisfied nowhere in the current codebase, but the Journeys page (`/journey`) already has a working, tested "Continue →" mechanism (`journey.js`'s `handleGetJourneyResume`) that resumes a feature into a session — built on the Web UI's own internal journey-store rather than `pipeline-state.json`, with no terminal-stage filtering and a `createdAt` rather than last-modified date. A `pipeline-state.json`-reading adapter (`listFeatures()` in `adapters/feature-list.js`) already exists and is already shaped almost exactly right, but is wired nowhere.

**Decision:** Operator explicitly chose (via `AskUserQuestion`, 2026-09-01) to extend the Journeys page — merge non-terminal, journey-store-unknown `pipeline-state.json` features into `_renderJourneyHome`'s existing card list, reusing the existing Continue action completely unchanged — over building a parallel mechanism in `/skills` (the literal, but functionally bare, skill picker).

**Rationale:** Reuses a proven, already-tested UX pattern instead of fragmenting "continue a feature" into two mechanisms on two different pages. Also converges naturally with `ep1-s3` (Journey Record Backfill) — a CLI-only feature this story makes visible for the first time is exactly the case `ep1-s3`'s `backfillJourney` exists to handle on first Continue click, so the two stories now compose on the same page rather than needing to be wired together across two separate surfaces. `stories/ep1-s1.md`, `dor/ep1-s1-dor.md` (+ new `dor/ep1-s1-dor-contract.md`), and `test-plans/ep1-s1-test-plan.md` were all revised in place (original content kept, marked superseded) to reflect this — not silently rewritten, per this repo's traceability standard.

---

## 2026-09-01 — Feature registration shape: epics-nested, direct initial-creation write

**Context:** `new-feature-af17f555` had zero entry in `.github/pipeline-state.json` despite 8 completed outer-loop stages' worth of real artefacts already on disk (see `artefacts/2026-09-01-artefact-commit-durability-gap/discovery.md`).

**Decision:** Registered as an `epics[]`-nested feature (one epic, six stories) via a direct, validated JSON write — not `skills init` (which only creates a bare `discovery`-stage stub with a flat `stories: []` array, unsuitable for a feature already at `review`/`definition-of-ready`).

**Rationale:** Permitted under CLAUDE.md's cdg.6 exception (a) — "initial story creation." Validated immediately with `node scripts/check-pipeline-state-integrity.js` (0 failures) and `node scripts/trace-report.js --collect --feature new-feature-af17f555` (resolved all artefact files correctly) before any further writes. All subsequent field updates for this run used `node bin/skills gate-advance`/`advance`, not further direct writes — see the capture-log entry (2026-09-01, `definition-of-ready` phase) for the one exception (patching `hasLayoutDependentGaps`/`e2eToolingRequired` directly due to a gap in `cli-advance.js`'s boolean coercion).
