## Story: Viewer route lists a DoD-validated feature and navigates its scope/benefit/per-story AC structure

**Epic reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/epics/feature-playback-web-viewer.md
**Discovery reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/discovery.md
**Benefit-metric reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/benefit-metric.md
**Domain:** [web-ui]

## User Story

As a **feature sponsor / business owner reviewing a delivered feature**,
I want **to open a page in the app and see the feature's own scope, benefits, and a per-story breakdown of its ACs**,
So that **I can navigate straight to the specific thing I care about, reading it as this platform's own traceability chain — not a flat file listing — directly moving M1 (acceptance loop closure) and setting up M2 (sponsor feedback re-entry) by making the package genuinely reviewable**.

## Benefit Linkage

**Metric moved:** M1 — Acceptance loop closure rate (a package only counts as "shared" once it's genuinely reviewable, not just produced); M2 — Sponsor feedback re-entry rate (a well-organised, traceable package makes specific feedback more likely than a folder of loose files)
**How:** This story is the walking skeleton's own thinnest viewer increment — the navigable structure exists and is browsable even before `fpd-s4` fills in real media. A sponsor can already see what was built, why, and how it's organised by story and AC; `fpd-s4` adds the visual evidence.

## Architecture Constraints

- **Ordinary application code, not a skill (ADR-027).** This route is live, user-facing, triggered by any authenticated user at any time — not inside an agent-driven pipeline session. It belongs under `src/web-ui/routes/`, following this repo's own existing route-handler conventions (matching `journeys.js`'s own established pattern: route handler → `html-shell.js` page wrapper → string-concatenation HTML).
- **One canonical traversal, not a second derivation (ADR-028).** Before writing new feature → epic/story → AC traversal logic, this story's own implementation must check whether `/trace`'s own chain-walking logic or `dashboards/pipeline-viz.html`'s own feature-card rendering already provides a reusable traversal (`decisions.md`, 2026-10-15) — reuse it if found; only build a new one if neither covers this shape. This is an implementation-time check, not resolved at `/definition`.
- **Reads existing files only — no new persisted data.** The route reads `pipeline-state.json` (for feature/epic/story/AC structure and DoD status) and the artefact files `fpd-s1`/`fpd-s2` already produce — no new database table, no new schema.
- **No dashboard replacement (discovery Out of Scope item 7).** This route is additive, a narrower sponsor-facing surface — it does not restructure or replace `dashboards/pipeline-viz.html`.

## Dependencies

- **Upstream:** `fpd-s1` (walkthrough document + screenshots must exist for a feature to be listable here — though this story's own ACs can be satisfied structurally even for a feature whose media isn't built yet, per the walking-skeleton framing).
- **Downstream:** `fpd-s4` renders the actual screenshot/video media inside the structure this story establishes.

## Acceptance Criteria

**AC1:** Given at least one DoD-validated feature with a playback package produced (`fpd-s1`), When an authenticated user navigates to the new viewer route, Then they see a list of DoD-validated features with a playback package, each one opening its own review page.

**AC2:** Given a feature's own review page, When it loads, Then it opens with a scope-and-benefit summary — the feature's own `discovery.md` problem statement and `benefit-metric.md` named metrics, read and rendered directly, not re-authored into a new format.

**AC3:** Given the same review page, When the user scrolls past the summary, Then they see one section per story in the feature, each showing that story's own ACs, sourced from the DoD artefact's own AC Coverage table — the same table `fpd-s1`'s walkthrough document is already scripted from.

**AC4:** Given a feature with multiple epics and stories, When the review page renders the per-story sections, Then they appear grouped and ordered consistently with the feature's own epic/story structure in `pipeline-state.json` — not an arbitrary or alphabetical order.

**AC5:** Given a DoD-validated feature with no playback package produced yet, When a user looks for it in the viewer's own feature list, Then it does not appear — the list only shows features with an actual package to review, not every DoD-validated feature regardless of readiness.

## Out of Scope

- **Rendering actual screenshots or playing video** — a separate story (`fpd-s4`); this story establishes the navigable structure only.
- **Redesigning or replacing the existing governance dashboard** — per discovery Out of Scope item 7.
- **Sponsor feedback collection tooling** — the page is read-only; no comment/feedback form.
- **In-browser editing of any kind** — playback-only, per discovery Out of Scope item 5.

## NFRs

- **Performance:** No specific SLA named in discovery; the route reads already-existing files/state, no new heavy computation.
- **Security:** Standard session-based authentication, matching every other route in `src/web-ui/` — no new auth mechanism. No tenant-crossing data exposure (feature list scoped to the authenticated user's own tenant, matching existing conventions).
- **Accessibility:** WCAG 2.1 AA — native HTML structure (headings, lists), matching this repo's own established accessible-markup conventions elsewhere in `src/web-ui/`.
- **Audit:** None — read-only viewing, no new mutating action.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
