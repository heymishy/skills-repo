# Retrospective Story: Artefact-list repo-root fallback (close the artefact-listing mismatch)

**Story ID:** alrf-s1
**Retrospective audit date:** 2026-07-26
**Risk classification:** LOW (additive fallback path; existing GitHub-API behaviour is preserved and only used when no local checkout is available)

**Epic reference:** `artefacts/2026-07-25-code-shape-diagrams/epics/csd-e1-code-shape-diagrams.md` — found via the same manual staging-testing pass as the canvas-render fix, and itself an instance of the "code shape drift" this epic exists to visualise and catch
**Parent retrospective:** `r-canvas-render-and-story-extraction-fix.md` (same directory) — a second, independent bug found during the same staging session, split into its own story since it touches different files and a different root cause

## What was delivered

An operator testing the Resume-a-feature flow on staging reported "No artefacts found for this feature" for a feature the kanban board correctly showed as "design · 3 artefacts". Investigation found three independent implementations of "list this feature's artefacts" existed simultaneously in the codebase, never reconciled against each other:

1. `src/web-ui/adapters/artefact-list.js`'s `listArtefacts()` — GitHub-REST-API-based, gated on `WUCE_REPOSITORIES`, which is never set anywhere (`fly.staging.toml`, `fly.toml`) — so it unconditionally returned `noArtefacts: true` on staging regardless of real content.
2. The same file's `listLocalArtefacts()` — a correct, filesystem-based alternative that already existed but was dead code, never called from any route.
3. `journey-store-pg.js`'s `getArtefactCountsForJourneys()` — Postgres-based, the actual mechanism behind the kanban board's "N artefacts" badge (`products.js`'s `_enrichColumnsWithArtefactCounts`), entirely independent of the other two.

**Fix:** `listArtefacts(featureSlug, token, repoRoot)` now accepts an optional `repoRoot` and, when supplied, checks the local filesystem first via the existing `listLocalArtefacts()`. If the feature's `artefacts/<slug>` directory exists locally, its contents are returned directly (mapped to the same `{name, path, sha, type, viewUrl}` shape, repo-relative path with forward slashes — matching the convention already used by `as-built-system-architecture.js`'s `path.relative(repoRoot, artefactPath).split(path.sep).join('/')`). Only when no local directory exists does it fall through to the pre-existing GitHub-API path, so multi-repo/no-local-checkout deployments are unaffected. `src/web-ui/routes/features.js`'s `handleGetFeatureArtefacts` now resolves `repoRoot` via the existing `getRepoRoot(req)` adapter (the same `COPILOT_REPO_PATH`/`CLAUDE_REPO_PATH` convention used throughout `server.js`/`journey.js`) and passes it through.

**Key files changed:**
- `src/web-ui/adapters/artefact-list.js` — `listArtefacts` takes an optional third `repoRoot` arg, local-first with GitHub-API fallback.
- `src/web-ui/routes/features.js` — resolves and passes `repoRoot` via `getRepoRoot(req)`.
- `tests/check-alrf-s1-artefact-list-repo-root-fallback.js` — new regression test (8 ACs, all passing).

## Benefit Linkage

**Metric moved:** trust in the "Resume a feature" flow and the artefact-index page as an accurate reflection of real repo state — directly relevant to csd-e1's own benefit (visual/structural inspection tooling is worthless if the underlying "what artefacts exist" signal is wrong).
**How:** closes a real, user-visible false negative that would have made every staging user believe their completed work was missing.

## Acceptance Criteria

**AC1 — `listArtefacts` finds real local artefacts via `repoRoot` when `WUCE_REPOSITORIES` is unset**
Status: MET — `tests/check-alrf-s1-artefact-list-repo-root-fallback.js` AC1, plus manual verification against this repo's own real `artefacts/2026-07-26-canvas-render-and-story-extraction-fix/` directory (found 1 file correctly).

**AC2 — an existing-but-empty local artefacts directory returns `noArtefacts: true`, not a silent fall-through**
Status: MET — same test file, AC2.

**AC3 — no regression to the GitHub-API path when no local directory exists or `repoRoot` is omitted entirely**
Status: MET — same test file, AC3/AC4; full pre-existing suites (`check-wuce6-feature-navigation.js`, `check-wuce20-artefact-index-html.js`, `check-kfd1-kanban-card-and-detail-page-cx.js`) all still pass unchanged (139/139 combined).

**AC4 — repo-relative artefact paths use forward slashes on all platforms (Windows path.join uses backslashes)**
Status: MET — `path.relative(...).split(path.sep).join('/')`, verified in AC1's assertions.

## Out of Scope

- Reconciling the THIRD mechanism (`journey-store-pg.js`'s Postgres-based artefact counts) with this fix — the kanban badge already works correctly via its own path; this story only fixes the feature-index page. A follow-on question (see Open Questions) is whether these should ever be unified.
- Removing `listArtefacts`'s GitHub-API path entirely — kept as the fallback for any future multi-repo/no-local-checkout deployment mode.

## Open Questions

- [ ] Operator raised (2026-07-26): "we may need to tighten skill or CLI checks to avoid similar deviations in future" and separately floated "a mechanism to sync postgres, redis, and file-based updates" as a structural fix. See `workspace/capture-log.md` (2026-07-26, signal-type: gap) for the full framing. Proposed direction captured in `decisions.md` update below, not yet implemented — this story fixes the *symptom* (feature-index page), not the *systemic* cause (no shared source of truth across storage layers for "artefacts belonging to feature X").

## Traceability Linkage

**DoR artefact:** not written — retrospective story, same convention as the parent canvas-render-fix story
**Test plan:** not written as a separate artefact — `check-alrf-s1-artefact-list-repo-root-fallback.js` is the test coverage
**DoD artefact:** not yet written — recommend after the Open Question above is either actioned or explicitly deferred
