## Story: Fix epic/flat story render duplication and missing story registration

**Slug:** sri-s1
**Track:** Short-track (bugs, small fixes, bounded refactors)
**Date:** 2026-09-06

---

## Problem

Reported live: `/features/2026-04-14-skills-platform-phase3` renders several stories (e.g. `p3.3`) twice — once under their epic's accordion, once again in a separate flat "Stories" section — and five other stories (`p3.18`–`p3.22`) don't get their own accordion at all, falling into generic feature-level type groups instead.

**Root cause, confirmed by direct code and data reading — two distinct defects, not one:**

**Defect A (render duplication, code bug):** `.github/pipeline-state.schema.json`'s own documented design for `epic.stories[]` is: "may be full story objects (Phase 1/2 style) or string slug references (Phase 3+ style where full objects live in `feature.stories[]`)". This is a deliberate, valid data shape — a story can legitimately appear as a bare-string reference inside its epic AND as a full tracking object (DoR status, PR link, dodDate, etc.) in the feature's flat `stories[]` array simultaneously. `getFeatureStoryStructure` (`src/web-ui/adapters/feature-story-structure.js`) reads both lists correctly but returns them without deduplication, and `renderGroupedArtefactIndexHtml` (`src/web-ui/routes/features.js`) renders every epic's stories AND every flat story unconditionally — so any slug present in both places (which the schema explicitly permits and phase3/wucp's data legitimately does) gets its own accordion rendered twice.

**Defect B (missing registration, data gap):** Separately, some real story files have no registration at all — their slug is absent from both their feature's `epics[].stories[]` and flat `stories[]` — so `groupArtefactsByStory` has no way to know they belong to a story group, and their artefacts fall into the generic feature-level type buckets. Confirmed via cross-referencing each orphaned file's own `Epic reference` header against its feature's actual registered epics:
- `2026-04-14-skills-platform-phase3`: `p3.18`–`p3.22` (5 files) — all reference the existing `e1-governance-chain-integrity` epic, never added to its `stories[]`.
- `2026-04-19-skills-platform-phase4-opus`: all 23 story files — this feature's epics only ever stored a `storyCount` number, never a `stories[]` array at all (an older schema shape that was never backfilled when `stories[]` tracking was introduced).
- `2026-05-05-web-ui-model-first-chat`: `mfc.2` — feature uses a flat-only schema variant (`epics: []`, all tracking lives in `feature.stories[]`); `mfc.2` was simply never added as an entry.
- `2026-05-26-bsr-workforce-planner`: `wfp.11` — references the existing `wfp-planning-dashboard` epic (alongside its own already-registered siblings `wfp.11a`/`wfp.11b`), never added to its `stories[]`.

**Explicitly out of scope (logged as follow-ups, not fixed here — see `workspace/capture-log.md`, 2026-09-06):**
- `2026-05-06-web-ui-guided-outer-loop`: all 7 stories (`ougl.1`–`ougl.7`) are correctly registered in `pipeline-state.json`, but their files on disk use dash notation (`ougl-1-*.md`) while the registered id uses dot notation (`ougl.1`) — a slug/filename format mismatch, not a registration gap. No safe mechanical fix without either a code-level dot/dash normalization decision or a risky id rename touching existing `issueUrl`/`prUrl`/`dispatchTarget` references.
- `2026-06-22-wuce-multi-tenancy`: `s0.1`–`s0.3` and `s2.1` reference epics (`sprint-0-tenant-fixes`, `sprint-2-preflight-gate`) that were never created as epic artefacts or registered at all — there is no existing epic entry to add them to; closing this needs content-authoring (new epic artefacts), not a mechanical data fix.

## As a / I want / So that

As an operator browsing any multi-story feature's artefact-index page
I want each story to render exactly once, in its correct group, whether that group is an epic or a flat list
So that the page never shows the same story twice and never silently drops a real story into the wrong section

## Acceptance Criteria

- **AC1:** Given a story slug that is registered both as a bare-string reference inside an epic's `stories[]` and as a full object in the feature's flat `stories[]` (the schema-documented "Phase 3+ style"), when the feature's artefact-index page renders, then that story's accordion appears exactly once (under its epic), not twice.
- **AC2:** (regression guard) Given a story slug that is registered only in the flat `stories[]` (no epic membership), when the page renders, then that story still appears exactly once, in the flat "Stories" section — unaffected by AC1's dedupe.
- **AC3:** Given the five specific missing-registration cases identified above (phase3's `p3.18`–`p3.22`, phase4-opus's 23 stories, `mfc.2`, `wfp.11`), when each is added to its correct existing epic (or flat list, for `mfc.2`) in `pipeline-state.json`, then each renders inside its own correct accordion section instead of the generic feature-level type groups.
- **AC4:** Given a live check of the two originally-affected pages post-deploy (`2026-04-14-skills-platform-phase3`, `2026-05-08-web-ui-copilot-chat-parity`) and the four newly-registered features, when each page is rendered, then no story slug appears more than once and every registered story has its own accordion.

## Out of scope

- The two follow-up items above (`ougl` dot/dash mismatch, `wuce` missing sprint-0/sprint-2 epics) — logged separately for their own dedicated scoping.
- Backfilling full tracking objects (DoR status, PR links, etc.) for phase4-opus's 23 newly-registered stories, or for phase3's `p3.1a`–`p3.2b` which already exist as epic-only bare-string references with no flat companion object — registration for rendering purposes only; richer process-tracking data is a separate, larger backfill exercise not required to fix the display defect.
- Any change to `deriveTypeFromPath` or other artefact-type derivation — confirmed unaffected.

## Benefit linkage

Closes a real, confirmed UX defect affecting at least 2 features with visible render duplication and 4 features with silently-misplaced stories — found via direct operator report on `phase3`, then traced to two distinct root causes via direct data audit. No formal benefit-metric artefact — short-track story, consistent with `bsgm-s1` and every other short-track delivery this session.

## Architecture Constraints

`getFeatureStoryStructure`/`groupArtefactsByStory` remain pure functions with no I/O (unchanged from `bsgm-s1`'s own documented constraint). This story adds one new invariant to that same code path: a slug present in both an epic's `stories[]` and the feature's flat `stories[]` must be treated as a single logical story for rendering purposes — the flat list is a secondary detail record for schema-documented "Phase 3+ style" features, not an independent set of things to render. No ADR references this function; no new one is warranted for a bounded, backward-compatible dedupe.

## Complexity Rating

**Rating:** 2 (the render fix is well understood; the registration data fix required direct per-file forensic cross-referencing against each story's own `Epic reference` header to avoid guessing — done, and the four follow-up cases were deliberately carved out rather than guessed at)
**Scope stability:** Stable
