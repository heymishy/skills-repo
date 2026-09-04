# Story: Production Docker image includes artefacts/ and .github/pipeline-state.json, so local-disk-based artefact features actually work

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the finding below, made while checking `fapg-s1`'s own production result
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As a **Platform maintainer whose recently-shipped artefact-page fixes rely on reading local files from the connected repo's own checkout**,
I want **the production Docker image to actually contain `artefacts/` and `.github/pipeline-state.json`**,
So that **`aada-s1`'s archived-directory fallback and `fapg-s1`'s per-story accordion — both already merged and DoD-marked-COMPLETE — actually take effect in production, instead of silently no-op-ing because the files they read were never in the deployed container in the first place**.

## Benefit Linkage

**Metric moved:** Time to First Actionable Content — the same metric this entire investigation thread (`ppg-s1`, `fal-s1`, `pefl-s1`, `aada-s1`, `prlf-s1`, `fapg-s1`) has targeted.
**How:** Found while checking `fapg-s1`'s own live production result at the operator's request ("Looks the same on prod to me"). Confirmed via direct investigation: `.dockerignore` excludes both `artefacts/` (line 41) and `.github/` (line 53) from the Docker image. `WUCE_TENANT_ROOT_BASE` is confirmed unset on this deployment (`as-built-diagrams.js`'s own comment: "Dormant on this deployment... unset everywhere today"), so there is no separate runtime-cloned tenant checkout that would sidestep the exclusion — `getRepoRoot` resolves to the container's own static image for every request. The Dockerfile's own `CMD` starts the server directly (`node src/web-ui/server.js`) with no clone/entrypoint step. Concretely: `listLocalArtefacts` (`aada-s1`'s own fix) and `getFeatureStoryStructure` (`fapg-s1`'s own new function) both always return `null` in production, regardless of either fix's own correctness — confirmed by both stories' own DoD-complete unit tests passing (they use real temporary directories via `fs.mkdtempSync`, which sidesteps this deployment-topology gap entirely) while the live page showed no visible change.

## Architecture Constraints

- **Fix — `.dockerignore`:** remove the whole-directory exclusions for `artefacts/` (currently line 41) and `.github/` (currently line 53). The existing, more specific `.github/scripts/` exclusion (currently line 63, presently redundant since its own parent directory is already excluded) becomes meaningfully re-scoped once the parent exclusion is removed — dev/CI-only tooling correctly stays out of the runtime image, while `.github/pipeline-state.json` and everything else under `.github/` (workflows, templates, etc.) is now included.
- No change to any other `.dockerignore` exclusion (`node_modules/`, `.env*`, `tests/*`, `.git/`, `.worktrees/`, `.claude/`, `scripts/`, `docs/`, `dashboards/`, `coverage/`, etc.) — all confirmed still correctly scoped and unaffected.
- No change to `Dockerfile`, `fly.toml`, or any application code — this is a build-context-inclusion fix only.
- No change to how or when a production deploy is promoted — the existing `promote-to-prod` manual-approval gate (already used for every change this session) remains the only path to production; this story does not add automatic redeploys or bypass that gate.

## Dependencies

- **Upstream:** `aada-s1` (archived-directory fallback, merged, DoD-complete — the specific feature this story makes actually take effect in production) and `fapg-s1` (per-story accordion, merged, DoD-complete — same).
- **Downstream:** None. Once merged and promoted, both `aada-s1`'s and `fapg-s1`'s own already-written, already-passing tests describe the correct, now-actually-reachable production behaviour — no new application-level tests are needed for those two stories themselves.

## Acceptance Criteria

**AC1:** Given `.dockerignore`'s own text content, When inspected after this fix, Then it contains no bare, whole-directory exclusion line for `artefacts/` (a bare `artefacts/` line with no scoping) or for `.github/` (a bare `.github/` line with no scoping).

**AC2:** Given `.dockerignore`'s own text content, When inspected after this fix, Then the more specific `.github/scripts/` exclusion is still present — dev/CI-only tooling remains correctly excluded from the runtime image even though its own parent directory is no longer wholesale-excluded.

**AC3 (regression guard):** Given `.dockerignore`'s own text content, When inspected after this fix, Then every other pre-existing exclusion (`node_modules/`, `.env`/`.env.*`, `tests/*` and its own established re-inclusion chain, `.git/`, `.worktrees/`, `.claude/`, `scripts/`, `docs/`, `README.md`/`CHANGELOG.md`/`CONTRIBUTING.md`, `dashboards/`, `coverage/`, `*.log`/`npm-debug.log*`, `.vscode/`/`.DS_Store`/`Thumbs.db`) remains present and unchanged — this story touches only the two lines named in AC1.

## Out of Scope

- Any change to the archival mechanism, `getFeatureStoryStructure`, `groupArtefactsByStory`, or any other application code from `aada-s1`/`fapg-s1` — both are already correct; this story only fixes what the production container has available for them to read.
- A narrower re-inclusion of only specific files within `artefacts/`/`.github/` (e.g. only `.github/pipeline-state.json`, excluding `.github/workflows/`) — investigated and confirmed unnecessary: the combined size of both directories (~38MB, ~4,900 files) is negligible next to the `.claude/` exclusion this file was originally built to solve (3.2GB, 429k files) and next to a typical Node application image's own base size.
- Wiring `WUCE_TENANT_ROOT_BASE` or any true per-tenant runtime-cloned-repo mechanism — a separate, much larger architectural change or a real future feature if this platform ever needs genuine per-tenant repo isolation (already noted as "dormant... today" in existing code comments); not needed to fix the specific gap this story addresses.
- Any change to the `promote-to-prod` approval gate or deploy cadence.

## NFRs

- **Performance:** Docker image grows by ~38MB (36MB `artefacts/` + 2.4MB `.github/`, minus whatever `.github/scripts/` itself contributes) — confirmed negligible next to a typical Node application image's own base size (Node runtime + `node_modules`), and two orders of magnitude smaller than the `.claude/` exclusion this file already solves for.
- **Security:** Spot-checked both directories for accidentally-committed secrets (API key/token/password patterns) before proposing this fix — all matches confirmed false positives (e.g. CSS class names like `risk-high` incidentally matching a token-prefix-shaped substring). `.env`/`.env.*` remain separately, correctly excluded regardless of this change.
- **Availability:** None identified — a Docker image content change, not a runtime behaviour change; existing health checks and deploy gates are unaffected.
- **Audit:** None identified.

## Complexity Rating

**Rating:** 1 — a two-line removal from one config file, with the fix's own correctness verifiable by direct text inspection; both real risks (size, secrets) were investigated and confirmed negligible before this story was written, not left as open questions.
**Scope stability:** Stable.

## Definition of Ready Pre-check

<!-- Filled in by /definition-of-ready -->

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
