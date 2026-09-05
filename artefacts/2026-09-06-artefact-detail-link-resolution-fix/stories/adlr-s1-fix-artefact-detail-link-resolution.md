## Story: Fix artefact detail links so nested and archived artefacts resolve instead of 404ing

**Slug:** adlr-s1
**Track:** Short-track (bugs, small fixes, bounded refactors)
**Date:** 2026-09-06

---

## Problem

Reported live: opening most artefact links from `/features/2026-07-05-product-stds-hierarchy` (and confirmed, independently, on two unrelated features including `sri-s1`, shipped this same session) returns "artefact not found".

**Root cause, confirmed by direct code reading — a single link-generation defect compounded by an already-correct-but-unused fix elsewhere:**

`listArtefacts` (`src/web-ui/adapters/artefact-list.js`) already computes each artefact's correct, full repo-relative path — including the `archived/` prefix when a feature has been archived (`aada-s1`'s own fallback, already shipped and working) — and even pre-builds a `viewUrl` field from it. But `_renderArtefactListByType` (`src/web-ui/routes/features.js`), which actually renders the clickable link on the feature-detail page, ignores that field entirely and rebuilds its own URL from only the artefact's bare filename (`a.path.split('/').pop()`), discarding both the subdirectory (`stories/`, `dor/`, `dod/`, `test-plans/`, `review/`, `epics/`, `plans/`, `verification-scripts/`) and the `archived/` prefix.

The resulting URL (`/artefact/<slug>/<bare-filename>`) reaches `handleArtefactRoute` → `fetchArtefact` (`src/web-ui/adapters/artefact-fetcher.js`), which fetches a single fixed path, `artefacts/<slug>/<bare-filename>.md` — with no subdirectory and no `archived/` fallback of its own. This resolves correctly only for the 4 artefact types that happen to live directly in the feature root (`discovery.md`, `benefit-metric.md`, `decisions.md`, `nfr-profile.md`) on a non-archived feature.

**Quantified blast radius**, via direct comparison of every `.md` file under `artefacts/` against this resolution rule:
- 4,926 total artefact files repo-wide
- 320 resolve correctly today (non-archived, root-level files only)
- 3,244 fail because their real file lives in a subdirectory
- 1,362 fail because their feature has been archived (this breaks even the 4 root-level types for those features)
- **4,606 / 4,926 (93.5%) currently 404 when opened from the web UI**

This has been the case since the artefact viewer's very first commit (`wuce.2`, PR #265) — not a regression.

**A second, unrelated dead code path was found during this investigation and is explicitly out of scope**: `listArtefacts` builds `viewUrl: /artefacts/${encodeURIComponent(relPath)}` (plural `/artefacts/`), but no route handler for that path exists in `server.js` at all — it is unreachable, unused dead code, not the cause of the live symptom (since `_renderArtefactListByType` never reads `a.viewUrl`). Not fixed or removed here — flagged as a separate, lower-priority cleanup opportunity.

## As a / I want / So that

As an operator browsing any feature's artefact index
I want every artefact link to open the real file, regardless of which subdirectory it lives in or whether the feature has been archived
So that I can actually read the artefact I clicked on, instead of hitting "artefact not found"

## Acceptance Criteria

- **AC1:** Given an artefact whose real file lives in a subdirectory (e.g. `dor/psh-s1-dor.md`), when the feature-detail page renders its link, then the link's URL encodes the full relative path within the feature (e.g. `dor/psh-s1-dor`), not just the bare filename.
- **AC2:** Given that URL is opened, when `fetchArtefact` resolves it, then it fetches the exact decoded relative path directly — no directory-guessing needed for correctly-generated links.
- **AC3:** Given a feature that has been archived (its artefacts live under `artefacts/archived/<slug>/...`), when any of its artefact links are opened (root-level or nested), then `fetchArtefact` falls back to the `archived/` prefix after the non-archived path 404s, and the artefact renders successfully.
- **AC4:** (regression guard) Given the 4 existing root-level artefact types on a non-archived feature (already working today), when their links are opened, then behaviour is unchanged — they continue to resolve on the first attempt.
- **AC5:** (defensive, for any already-shared bare-type link) Given a legacy URL with no subdirectory encoded (e.g. `/artefact/<slug>/psh-s1-dor` instead of `/artefact/<slug>/dor%2Fpsh-s1-dor`), when `fetchArtefact` exhausts the direct non-archived and archived attempts, then it probes each of the repo's known artefact subdirectories (`stories`, `epics`, `test-plans`, `verification-scripts`, `dor`, `plans`, `dod`, `trace`, `coverage`, `reference`, `research`) under both prefixes, using a shorter timeout per probe, before returning a real 404.
- **AC6:** (manual, post-merge) Given the two originally-reported live pages, when their previously-broken artefact links are opened post-deploy, then they render the real content instead of "artefact not found".

## Out of scope

- The dead, unreachable `/artefacts/:path` (plural) route referenced by `listArtefacts`'s own unused `viewUrl` field — not fixed or removed, flagged as a separate cleanup opportunity.
- `commit-view.js`'s post-commit "View artefact" link (`skills.js`'s `handleGetResultHtml` / `renderCommitResult`) — investigated and found to be currently unreachable for an unrelated, pre-existing reason (`getCommitResult` is never wired via `setGetCommitResult` in `server.js`, so the route always throws before reaching this link). Not touched here; a real D37 injectable-adapter gap, but a separate defect with its own scope.
- Any change to the artefact content rendering itself (`markdown-renderer.js`) — confirmed unaffected.
- Any change to `listArtefacts`/`artefact-list.js`'s own already-correct path computation — it is not the defect; only its consumer in `features.js` is.

## Benefit linkage

Closes a real, confirmed, platform-wide defect (93.5% of all artefact links, every feature, since the product's first commit) discovered via direct operator report and confirmed by direct quantified audit. No formal benefit-metric artefact — short-track story, consistent with every other short-track delivery this session.

## Architecture Constraints

`fetchArtefact` remains a single-purpose adapter function (ADR-012: all artefact fetching goes through this module). This story adds one new invariant: given a relative path that already includes a subdirectory, resolve it directly against both the non-archived and archived prefixes before any fallback guessing — the guessing loop (AC5) must never run for a correctly-generated link, only for a bare legacy one, to keep the common-case latency at 1-2 requests. No ADR references this function specifically; no new one is warranted for a bounded resolution-order fix.

## Complexity Rating

**Rating:** 2 (root cause and exact call sites were fully traced via direct code reading before this story was written, including ruling out two adjacent-looking but out-of-scope defects; the fix itself is a well-understood, bounded resolution-order change)
**Scope stability:** Stable
