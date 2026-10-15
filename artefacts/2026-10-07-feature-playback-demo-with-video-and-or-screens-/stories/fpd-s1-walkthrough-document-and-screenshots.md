## Story: Produce a structured, DoD-sourced walkthrough document with AC-mapped screenshots

**Epic reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/epics/feature-playback-core-package.md
**Discovery reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/discovery.md
**Benefit-metric reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **feature engineer who just completed a DoD-validated feature**,
I want **the Feature Playback Package skill to generate a walkthrough document scripted from my feature's own DoD artefact, with a screenshot captured at each AC's own stable UI state**,
So that **I have a reviewable, sponsor-presentable artefact without authoring one from scratch — directly moving M3 (demo preparation time) and establishing the one prerequisite M1 (acceptance loop closure rate) needs to exist at all**.

## Benefit Linkage

**Metric moved:** M3 — Demo preparation time (primary); M1 — Acceptance loop closure rate (enabling — no package can exist without this story)
**How:** The DoD artefact's own AC Coverage table and Metric Signal section already contain sponsor-relevant content (what was built, what it achieves) in structured form; scripting the walkthrough from that table directly, rather than having the engineer write prose from scratch, is the single biggest time-saver named in discovery. Automated screenshot capture removes the second-biggest manual step.

## Architecture Constraints

- **Reuse Playwright, already a devDependency (ADR-018, ADR-026).** No new npm dependency for screenshot capture. This is the same tool and the same `webServer`-driven pattern already used by every `tests/e2e/*.spec.js` file in this repo.
- **New skill file, following this repo's own skill-authoring convention.** `skills/feature-playback/SKILL.md` — a pure instruction file (per `CLAUDE.md`'s own "How skills are invoked" section: `/name` is this repo's shorthand for `skills/[name]/SKILL.md`, not a registered Claude Code skill), matching every other skill in this repo.
- **New capture helper script.** A reusable script under `scripts/` (not re-authored ad hoc per invocation) that the skill instructs the engineer to run, parameterised by feature slug. It reads the feature's DoD artefact(s) — AC Coverage table and Metric Signal section — and drives Playwright screenshot capture against the stable UI state for each AC.
- **Output location.** `artefacts/[feature-slug]/playback/walkthrough.md` and `artefacts/[feature-slug]/playback/screenshots/` — the standard artefact directory structure, per discovery's own Constraints section (not an external service).
- **D2-platform check confirmed testable:** staging/webServer accessibility for Playwright-driven capture was confirmed via `/clarify` (this repo's own E2E suite already targets it) — no platform-availability gap for this story.

## Dependencies

- **Upstream:** None.
- **Downstream:** `fpd-s2` (video) and `fpd-s3`/`fpd-s4` (viewer) all read from the same `artefacts/[feature-slug]/playback/` output this story establishes.

## Acceptance Criteria

**AC1:** Given a DoD-validated feature (`dodStatus: "complete"` in `pipeline-state.json`) with at least one story whose DoD artefact has a populated AC Coverage table, When the Feature Playback Package skill is run against it, Then a walkthrough document is produced at `artefacts/[feature-slug]/playback/walkthrough.md` with one section per AC, each section's narrative text sourced from that AC's own row in the DoD's AC Coverage table — not from raw E2E test file content.

**AC2:** Given the same walkthrough document, When its Metric Signal section is checked, Then it includes the feature's own `benefit-metric.md` targets together with their current signal and evidence, sourced directly from the DoD artefact's own Metric Signal section.

**AC3:** Given a DoD-validated feature, When the skill's screenshot-capture step runs, Then Playwright captures one screenshot per AC at that AC's own key, stable, repeatable UI state — not an arbitrary mid-interaction frame — saved to `artefacts/[feature-slug]/playback/screenshots/`, and the generated walkthrough document embeds each screenshot inside its own AC section.

**AC4:** Given automated capture has completed, When the package's own completion status is checked, Then it is not marked complete until the engineer has explicitly reviewed and confirmed each screenshot — automated capture does not bypass editorial review.

**AC5:** Given a feature that is not DoD-validated (`dodStatus` other than `"complete"`), When the skill is invoked against it, Then the skill refuses to run and states which gate is unmet — this is not a general-purpose demo tool.

## Out of Scope

- **Video recording** — a separate story (`fpd-s2`); this story's own package is doc + screenshots only.
- **The web-app viewer** — a separate epic (`feature-playback-web-viewer`); this story's output is files on disk, not yet browsable in-app.
- **Automated video narration / AI voiceover** — out of scope for the whole feature per discovery.
- **Sponsor feedback collection tooling** — out of scope for the whole feature per discovery.

## NFRs

- **Performance:** No specific SLA named in discovery for this step alone; informed by M3's own 45-minute whole-package target, but not independently targeted here.
- **Security:** Screenshots capture only what is already visible in the normal authenticated UI — no new data exposure beyond what the feature itself already renders; no tenant-sensitive-data scrubbing mechanism is introduced (matches this repo's own existing E2E screenshot precedent).
- **Accessibility:** The walkthrough document itself is plain Markdown — no special accessibility constraint beyond normal document readability. (Captions/transcript for video belong to `fpd-s2`, not this story.)
- **Audit:** None — read-only capture against an already-DoD-complete feature; no new mutating action.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
