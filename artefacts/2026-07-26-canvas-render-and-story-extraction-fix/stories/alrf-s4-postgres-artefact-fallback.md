# Retrospective Story: Postgres artefact-content fallback for listArtefacts

**Story ID:** alrf-s4
**Retrospective audit date:** 2026-07-26
**Risk classification:** LOW (additive read-side fallback; local disk still takes priority, no write-path changes)

**Epic reference:** `artefacts/2026-07-25-code-shape-diagrams/epics/csd-e1-code-shape-diagrams.md`
**Parent decision:** `decisions.md` D3/D4 (same directory) — this is the concrete implementation of D3's "durable artefact store" recommendation for the read side, using a store that turned out to already exist and already be written to.

## What was delivered

Investigating D3 (which recommended git/GitHub as the canonical artefact store) surfaced something better already half-built: `routes/skills.js` already saves every completed stage's full artefact content to Postgres (`journey-store-pg.js`'s `saveArtefact()`, called on every stage completion when `journeyId` and `DATABASE_URL` are set) — with an explicit code comment: "Persist artefact content to Postgres so cross-device / post-deploy resume works." Nothing was reading it back for the feature-index page (`GET /features/:slug`); `listArtefacts()` only checked local disk (alrf-s1's fix) and the still-unconfigured GitHub API. On a redeployed container with an empty or absent local `artefacts/` directory, this durably-saved Postgres content was invisible to the exact page whose job is to show it.

**Fix:**
- `modules/journey-store.js` gains `getArtefactsForJourney(journeyId)`, delegating to the already-wired Postgres adapter (consistent with the module's existing `setPgAdapter`/`_activePgAdapter()` pattern) — returns `[]` when no pg adapter is wired (local dev, disk-only mode).
- `adapters/artefact-list.js`'s `listArtefacts()` takes an optional 4th argument, `pgArtefactRows` (pre-fetched `{skill_name, artefact_path, content}` rows). Priority order: local disk (if it has real content) → Postgres rows → GitHub API. An existing-but-empty local directory no longer short-circuits before checking Postgres.
- `routes/features.js`'s `handleGetFeatureArtefacts` resolves the feature's journey once (reusing the existing `journeyForPage` lookup already used for resume-links/displayName), fetches Postgres rows via `getArtefactsForJourney(journeyForPage.journeyId)`, and passes them through — wrapped in try/catch so a Postgres error degrades to `[]`, not a crash.

## Benefit Linkage

**Metric moved:** closes the actual remaining gap in the original artefact-listing mismatch this session started with — a feature whose content survived only in Postgres (the realistic case after any staging redeploy) is now findable on the feature-index page, not just via the kanban board's count badge.
**How:** this is a genuine architecture improvement over the D3 recommendation as originally written: rather than building a new GitHub-commit write path from scratch, this wires a read path onto a durable store that was already being populated — smaller change, lower risk, ships today.

## Acceptance Criteria

**AC1 — Postgres rows used when local disk and GitHub API both find nothing**
Status: MET — `tests/check-alrf-s4-postgres-artefact-fallback.js` AC1.

**AC2 — local disk still wins over Postgres when local has real content (no duplication)**
Status: MET — AC2.

**AC3 — an existing-but-empty local directory still checks Postgres before giving up**
Status: MET — AC3 (this required changing alrf-s1's original short-circuit-on-empty-dir behaviour).

**AC4 — no regression when pgArtefactRows is omitted or empty**
Status: MET — AC4a/b.

**AC5 — route-level wiring: `handleGetFeatureArtefacts` resolves the journey once and fetches Postgres rows via its `journeyId`**
Status: MET — AC5.

**AC6 — a Postgres error degrades gracefully (no crash, empty rows, not a 500)**
Status: MET — AC6.

**AC7 — no regression to existing suites**
Status: MET — `check-wuce6-feature-navigation.js` (57/57), `check-wuce20-artefact-index-html.js` (40/40), `check-kfd1-...` (42/42), `check-alrf-s1-...` (8/8), `check-p3.1-pg-journey-adapter.js` (13/13), `check-p3.3-persistence-survival.js` (18/18) all unchanged.

## Out of Scope

- Migrating artefact *writes* to a GitHub-commit-based path (D3's original recommendation) — Postgres already durably captures content on the write side via the existing `saveArtefact()` call; this story only fixes the read side that wasn't consulting it. Whether a git-commit write path is still worth adding (for diff/PR-review value, not durability) remains open — see `decisions.md`.
- `workspace/ideas.json` and `workspace/estimation-norms.md` (tracked separately, `2026-07-26-storage-drift-audit`).

## Traceability Linkage

**DoR artefact:** not written — retrospective story
**Test plan:** `tests/check-alrf-s4-postgres-artefact-fallback.js` (14 ACs, all passing)
**DoD artefact:** not yet written
