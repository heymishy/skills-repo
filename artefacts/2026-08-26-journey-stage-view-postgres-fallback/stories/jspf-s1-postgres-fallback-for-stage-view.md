## Story: Shared disk-then-Postgres artefact resolver, wired to all 4 journey.js sites that were missing it

**Epic reference:** None — short-track (bug fix, live gap found via direct operator usage on production, then audited codebase-wide per operator request)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui]

## User Story

As an **operator resuming a past conversation, viewing a stage's content, or starting review/side-trip work on the deployed web UI**,
I want to **have my previously-completed stage content actually available everywhere it's needed, even when the local file was lost to a redeploy and no repo is connected**,
So that **resuming or continuing my own work never silently loses context or looks like it's been lost, when the content genuinely still exists in Postgres**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact) — confirmed live (2026-08-26) that resuming journey `031759f9` on production (`https://skills-framework.fly.dev/journey/031759f9-9c4c-4e6a-8f11-a328ea10a925/stage/discovery`) showed "No artefact content found," while the exact same content loaded correctly via `https://skills-framework.fly.dev/artefact/new-feature-031759f9/discovery`. The operator reported this recurring "across all resumed features," then explicitly asked for a codebase-wide audit for the same bug class before fixing.

**How:** Direct source inspection confirms the root cause on the reported route, and a subsequent full-codebase audit (per operator request) found 3 more instances of the identical shape, all in `routes/journey.js`. `journey-store-pg.js`'s `saveArtefact()`/`getArtefactsForJourney()` (table `artefacts`) durably stores every completed stage's full content on every stage completion, independent of whether a repo is connected — documented in this same file (line ~1502) as "Postgres-first (survives Fly deploys), disk fallback." This exact "written to Postgres, but this particular reader doesn't check it" shape was already found and fixed twice before, for two sibling routes (`alrf-s4`, 2026-07-26, feature-index page: local disk → Postgres → GitHub; `avpf-s1`, 2026-08-09, artefact-detail page, explicitly citing `alrf-s4` as precedent) — but 4 read sites inside `journey.js` itself were never given the same fallback:

1. **`handleGetJourneyStageView`** (`GET /journey/:journeyId/stage/:stageName`, ~line 786) — the originally reported bug. Falls back to a git-fetch (`das-s1`) on disk-miss, but never checks Postgres, so a repo-less feature (the common case for a quickly-created, not-yet-linked feature) shows "No artefact content found" even though the content is sitting in Postgres.
2. **`handleGetStories`** (`GET /journey/:journeyId/stories`, ~line 2451) — reads `definition.md` from disk to auto-populate the story-list form with extracted story IDs. On disk-miss, silently falls back to an empty textarea (`autoIds = []`) with no fallback of any kind — the operator has to retype every story slug by hand, a real (if soft) usability regression, and a strict subset of the exact same underlying gap.
3. **`handlePostStories`** (`POST /journey/:journeyId/stories`, ~line 2517-2522) — builds `priorArtefacts`, the actual context handed into the system prompt for the review session this endpoint kicks off. Disk-only, no fallback of any kind. This is the most functionally serious of the four: on disk-miss, the next skill session (review) silently starts with **no knowledge of any prior completed stage's content** — a correctness bug in the AI's own context, not just a display bug, and the one most likely to produce subtly wrong downstream work with no visible error.
4. **`handlePostSideTripClarify`** (`POST /api/journey/:journeyId/side-trip/clarify`, ~line 3292-3293) — reads `discovery.md` from disk to pre-load context for a `/clarify` side-trip session. Comment reads "tolerate missing file" — disk-miss silently produces an empty pre-loaded context, again a correctness gap in AI context, not a visible error.

All 4 share the identical fix shape (try disk, then Postgres, keyed by `journeyId` + stage/skill name) — this story fixes the class via one shared helper rather than four separate ad hoc patches, mirroring the `renderShellWithNav` precedent this repo already established for an analogously-shaped, multi-site "forgot to check a required data source" defect (`pncg-s1`, 2026-08-26).

**Ruled out during the audit, not part of this fix:** the spikes-directory listing (`journey.js` ~line 3238-3244) reads `.md` files from a feature's `spikes/` directory, but spikes are never written to Postgres via `saveArtefact()` in the first place (that call only fires for `STAGE_ORDER` stage completions) — there is no Postgres content to fall back to. Fixing this would require a write-path change (dual-writing spike content to Postgres), a materially different and larger scope than this story's read-side fix; flagged as a separate follow-up if spike-content loss post-redeploy is ever reported as a real problem.

## Architecture Constraints

- **One shared helper, not four ad hoc patches.** Add `resolveArtefactFromDiskOrPg(repoRoot, artefactRelPath, journeyId, stageName)` to `routes/journey.js` (or a small new module if that reads cleaner — implementer's call, following whichever existing convention in this file is closer, e.g. the module-level helper pattern already used for `getRepoRoot`). Order: (1) disk read via `fs.readFileSync` exactly as today at each site; (2) if empty, Postgres lookup via `journey-store-pg.js`'s `getArtefactsForJourney(journeyId)` filtered to `skill_name === stageName`, wrapped in try/catch (best-effort, matching the existing `_resumePgArts`/`_pgArts` try/catch pattern already used at lines ~1506-1512 and ~2257-2263 in this same file). Returns the resolved content string, or `''` if neither source has anything.
- **`handleGetJourneyStageView` keeps its existing git-fallback tier, now ordered after the new Postgres tier.** Call the shared helper first; only if it returns empty, fall through to the existing `das-s1` git-fetch logic (lines ~806-821), unchanged. Postgres is faster (no external API call) and requires no repo connection, so checking it first is strictly better than today's disk → git order, and matches `alrf-s4`'s already-established local disk → Postgres → GitHub ordering.
- **The other 3 sites (`handleGetStories`, `handlePostStories`, `handlePostSideTripClarify`) get disk → Postgres only — no git-fallback added.** None of them has ever had a git-fallback tier; adding one is out of scope (a materially bigger change requiring the same repo/owner resolution `das-s1` built specifically for the stage-view route) and not needed to fix the reported class of bug, which is specifically "Postgres has it but nobody checks."
- **No new tenant-scoping mechanism needed at any of the 4 sites — reuse what's already there.** All 4 handlers already resolve `journey` from `journeyId` and (where relevant) already call `requireJourneyAccess` or an equivalent guard before reaching the artefact-content read. The shared helper takes an already-tenant-verified `journeyId` as input; it does not resolve a journey from an untrusted slug itself (unlike `avpf-s1`'s route, which had to add a tenant check for exactly that reason — not needed here).
- **Best-effort, never a new failure mode.** Every Postgres lookup inside the shared helper must be wrapped so a DB-level failure (no `DATABASE_URL`, connection error) degrades to each site's own pre-existing fallback (git-fetch for site 1, empty string for sites 2-4) — never a 500 where today's behaviour is a clean fallback or default.
- **Disk is authoritative when it has content — Postgres never shadows fresher disk content, at any of the 4 sites.** The helper's own tier ordering (disk first) already guarantees this; no site should call the Postgres tier when disk already produced content.
- **Do not change `_dasFetchFailed`'s existing message-selection logic in `handleGetJourneyStageView` beyond what's needed.** The distinction between "No artefact content found" (nothing anywhere) and "Artefact content could not be retrieved..." (a real git-fetch error, `anvf-s1`) must still hold — a successful Postgres fallback should render real content (bypassing both messages), not trigger either one.

## Dependencies

- **Upstream:** None (extends already-shipped, already-merged `das-s1`/`alrf-s4`/`avpf-s1` infrastructure).
- **Downstream:** None known.

## Acceptance Criteria

**AC1 (site 1 — stage-view, the originally reported bug):** Given a journey has a completed stage whose content was saved to Postgres but whose local disk file is missing (post-redeploy) and whose git-fallback also finds nothing (no repo connected, or repo connected but this stage was never committed), When the operator requests `GET /journey/:journeyId/stage/:stageName` for that stage, Then the real Postgres-stored content is rendered — not "No artefact content found."

**AC2 (site 2 — story-list auto-populate):** Given the `definition` stage's content was saved to Postgres but its local disk file is missing, When the operator requests `GET /journey/:journeyId/stories`, Then the story-list textarea is still auto-populated from the real (Postgres-sourced) definition content — not silently empty.

**AC3 (site 3 — review-session context, highest severity):** Given one or more completed stages' content was saved to Postgres but their local disk files are missing, When the operator submits `POST /journey/:journeyId/stories` (kicking off the review session), Then `priorArtefacts` passed into the new session's context includes the real (Postgres-sourced) content for each such stage — not an empty string.

**AC4 (site 4 — clarify side-trip context):** Given the `discovery` stage's content was saved to Postgres but its local disk file is missing, When the operator triggers `POST /api/journey/:journeyId/side-trip/clarify`, Then the `/clarify` session's pre-loaded context includes the real (Postgres-sourced) discovery content — not an empty string.

**AC5 (regression guard, all 4 sites):** Given the local disk file exists and reads successfully (the common, already-working case), When any of the 4 routes above is requested, Then the disk content is returned exactly as before this fix at every site — the Postgres fallback is never consulted and never overrides fresher disk content.

**AC6 (regression guard, site 1 only):** Given the disk read fails but the existing git-fallback succeeds (the existing `das-s1` case — a connected repo with a real commit, and Postgres itself has nothing for that stage), When `GET /journey/:journeyId/stage/:stageName` is requested, Then git content is still returned correctly — the new Postgres tier does not disrupt or shadow the existing git-fallback path.

**AC7 (true-empty case, all 4 sites):** Given neither disk, Postgres, nor (for site 1 only) git has any content for the requested stage, When any of the 4 routes is requested, Then each site's own existing default behaviour is preserved unchanged (site 1: "No artefact content found"; sites 2-4: empty textarea / empty context, exactly as today).

**AC8 (fallback-failure safety, all 4 sites):** Given the shared helper's Postgres lookup itself fails (e.g. no `DATABASE_URL` configured, or a database error), When any of the 4 routes is requested and the disk read has already failed, Then each site falls through to its own existing next behaviour (site 1: the existing git-fallback, or the default message if that also fails; sites 2-4: their existing empty-fallback behaviour) — never an unhandled exception or a 500.

## Out of Scope

- **Changing `das-s1`'s write-path behaviour** (dual-write to disk + git-commit-on-stage-completion). That mechanism is correct and unrelated — this story only extends what these 4 *readers* check, matching `avpf-s1`'s own precedent of scoping strictly to the read side.
- **The session-resume context-rebuild code paths already fixed** (`journey.js` ~line 1500 and ~line 2255-2276) — both already correctly Postgres-first; not touched by this story except as the established pattern this story's own shared helper is modeled on.
- **The spikes-directory listing** (~line 3238-3244) — different artefact lifecycle, never written to Postgres in the first place; would need a write-path change, out of scope for this read-side fix (see Benefit Linkage's "Ruled out during the audit" note).
- **Any further audit beyond `journey.js`.** The full-codebase grep this story's own investigation ran (`fs.readFileSync` across every `src/web-ui/routes/*.js`, `adapters/*.js`, `modules/*.js` file) found no additional sites outside `journey.js` reading Postgres-durable stage-artefact content without an existing fallback — `artefact.js` and `features.js` were already fixed by `avpf-s1`/`alrf-s4`, and every other `fs.readFileSync` call site found was either a same-request write-then-read-back (safe by construction) or unrelated content (SKILL.md files, config, session JSON). If a further site surfaces later, that is a new, separate finding.

## NFRs

- **Performance:** Negligible — the Postgres lookup only runs on the already-uncommon disk-read-failed path at each of the 4 sites, not on every request; for site 1 it also *reduces* average latency on that path by skipping an unnecessary GitHub API round-trip whenever Postgres already has the content.
- **Security:** None new — all 4 sites already resolve an access-checked `journeyId` before reaching the new helper call; no new ACL surface is introduced.
- **Accessibility:** Not applicable — no change to rendered markup or page structure at any site, only to the content source.
- **Audit:** No existing audit-log call needs to change at any of the 4 sites.

## Complexity Rating

**Rating:** 2 — the fallback mechanism itself is a known, twice-proven pattern (`alrf-s4`, `avpf-s1`) being extracted into one shared helper and wired to 4 call sites; keeping site 1's existing git-fallback and `anvf-s1` message-selection logic intact is the main source of care needed, plus verifying `priorArtefacts` construction (site 3) doesn't regress its existing `STAGE_ORDER`-based shape.
**Scope stability:** Stable — full audit already run, all sites enumerated above.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)
