## Story: Fall back to Postgres-durable content when the artefact viewer's GitHub fetch 404s

**Epic reference:** None — short-track (bug fix, live gap found via direct staging usage)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui]

## User Story

As an **operator using the deployed web UI to review a journey's completed stages**,
I want to **see a completed stage's real content when I click its artefact link, even if that stage's GitHub commit never happened**,
So that **a normal, expected state of this platform (a journey whose product has no repo connected yet) doesn't look like broken/lost work when the content genuinely exists**.

## Benefit Linkage

**Metric moved:** Direct correctness fix (short-track, no formal benefit-metric artefact) — confirmed live (2026-08-09) that clicking a "Benefit Metric" artefact link for journey `new-feature-32ded088` on staging returned "artefact not found", while the operator's session showed the stage as complete.

**How:** Direct source inspection confirms the root cause and confirms this exact class of gap has already been fixed once for a sibling surface. `routes/artefact.js`'s `handleArtefactRoute` (serving `GET /artefact/:slug/:type`, wired at `server.js:2343`) calls `adapters/artefact-fetcher.js`'s `fetchArtefact`, which *only* reads from the GitHub Contents API — there is no fallback. But `routes/journey.js`'s own stage-completion handler (`das-s1`, lines ~2042-2063) explicitly treats "no connected repo" as a valid, expected no-op state (AC4: "proceed unchanged... matching every other optional Postgres-backed feature in this codebase") — a stage is marked complete via `completeStage()` regardless of whether a GitHub commit happened. Meanwhile, `journey.js:1986` documents that **Postgres is "the web UI primary durable store" for artefact content** (`journey-store-pg.js`'s `saveArtefact`/`getArtefactsForJourney`, table `artefacts`), written on every stage completion independent of the GitHub dual-write. This exact "written to Postgres, but nothing reads it back" shape was already found and fixed once before, for the feature-index/artefact-list page (`alrf-s4`, see `adapters/artefact-list.js`'s 3-tier fallback: local disk → Postgres → GitHub) — but `handleArtefactRoute`, the click-through detail view, was never given the same fallback. Fixing this closes the same gap on the one surface `alrf-s4` didn't reach.

## Architecture Constraints

- **Reuse the `alrf-s4` fallback pattern, not a new mechanism.** `adapters/artefact-list.js` already established local-disk → Postgres → GitHub as this codebase's fallback order for artefact content; this story extends the same Postgres tier to `handleArtefactRoute`, it does not invent a second fallback design.
- **Tenant scoping is mandatory on the new Postgres path (ADR-025).** GitHub's own per-token access control implicitly scopes today's only code path (a user's OAuth token can only read repos they can access). The Postgres fallback bypasses that implicit control entirely — it resolves a journey directly from `featureSlug`, with no repo-level ACL in between. Without an explicit tenant check, this reintroduces exactly the cross-tenant defect class `mtrr-s1` fixed for a different artefact-fetching path (`export-data-source.js`'s `ownerRepoForFeature`/`repoOverride`) — a user on tenant A could read tenant B's artefact content for any `new-feature-<id>`-style slug they can guess or observe. The fix must reuse the same tenant check already established in this same file's neighbour, `handleDeleteJourney` (`journey.js` ~line 505): `if (!journey || (journey.tenantId && journey.tenantId !== tenantId))` → treat as not-found.
- **Best-effort, never a new failure mode.** The Postgres fallback attempt must be wrapped so any DB-level failure (no `DATABASE_URL`, connection error) degrades to the existing "artefact not found" page — never a 500 where today's behaviour is a clean 404.
- **GitHub content is never shadowed.** When GitHub *does* have the file, it remains the source of truth and is returned exactly as today, unchanged — the fallback only activates when GitHub itself reports not-found.

## Dependencies

- **Upstream:** None (extends already-shipped, already-merged `das-s1`/`alrf-s4` infrastructure).
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given a journey has a completed stage whose content was saved to Postgres (`journey-store-pg.js`'s `saveArtefact`) but whose GitHub commit was skipped (no repo connected) or never succeeded, When the operator requests `GET /artefact/:slug/:type` for that stage as a member of the journey's own tenant, Then the real Postgres-stored content is rendered — not the "artefact not found" page.

**AC2:** Given GitHub *does* have the artefact committed (the common, already-working case), When `GET /artefact/:slug/:type` is requested, Then GitHub's content is returned exactly as before this fix — the Postgres fallback is never consulted and never overrides real committed content.

**AC3:** Given neither GitHub nor Postgres has any content for the requested slug/type (a genuinely never-produced artefact), When `GET /artefact/:slug/:type` is requested, Then the existing "artefact not found" 404 page is shown, unchanged from today's behaviour.

**AC4:** Given the Postgres fallback lookup itself fails (e.g. no `DATABASE_URL` configured, or a database error), When `GET /artefact/:slug/:type` is requested and GitHub has already returned 404, Then the route still returns the existing "artefact not found" 404 page — never an unhandled exception or a 500 where today's behaviour is a clean 404.

**AC5:** Given the resolved journey belongs to a different tenant than the requesting session's tenant, When the Postgres fallback is attempted, Then it is not used and the response is identical to the no-fallback-available case (404, "artefact not found") — a user must never be able to read another tenant's artefact content by requesting a guessed or observed feature slug.

## Out of Scope

- **The "unable to resume" symptom reported alongside this bug.** `journey.js`'s resume-session code path (~lines 1441-1465) already does Postgres-first, disk-fallback for rebuilding prior-stage context, and inspection did not surface an obvious defect there — if resume failure recurs after this fix ships, it needs its own separate investigation rather than being assumed-fixed by this story.
- **A possible second, separately-routed `/artefacts/<relpath>` viewer** referenced by `viewUrl` fields in `adapters/artefact-list.js`'s output. No route registration for this exact path was found in `server.js` during investigation; if it turns out to be real and separately broken, it is a follow-up, not part of this fix.
- **Changing `das-s1`'s own AC4 no-op behaviour** (skipping the GitHub commit when no repo is connected). That behaviour is correct and intentional — this story fixes the *viewer's* blind spot about it, not the write path.
- **Deleting the stuck `new-feature-32ded088` journey itself.** A real, already-shipped cleanup path exists for that (`DELETE /api/journey/:journeyId`, `alrf-s10`) — unrelated to this code fix.

## NFRs

- **Performance:** Negligible — the Postgres fallback query only runs on the already-uncommon GitHub-404 path, not on every request.
- **Security:** Mandatory tenant check per Architecture Constraints (ADR-025, `mtrr-s1` precedent) — the Postgres fallback must never serve another tenant's artefact content.
- **Accessibility:** Not applicable — no change to rendered markup or page structure, only to the content source.
- **Audit:** The existing `artefact_read` audit log entry (`_logger.info`) fires unchanged regardless of which source (GitHub or Postgres) actually supplied the content.

## Complexity Rating

**Rating:** 2 — the fallback mechanism itself is a known, already-proven pattern (`alrf-s4`) being extended to a second call site; the tenant-scoping check adds real but bounded complexity.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (short-track, no parent epic — set directly in DoR)
