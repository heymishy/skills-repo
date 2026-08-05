## Story: Bootstrap a minimal fresh repo with one init command

**Epic reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/epics/rb-e1-no-fork-bootstrap-core.md
**Discovery reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/discovery.md
**Benefit-metric reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/benefit-metric.md
**Domain:** None identified — checked against `.github/standards/index.yml`; no listed domain (api, auth, data, web-ui, payments, ui, security) clearly matches CLI packaging/distribution.

## User Story

As an **engineering-capable evaluator**,
I want to **run a single init command against an empty target directory**,
So that **I get a minimal working skills-platform repo without ever cloning or forking the upstream platform repository**.

## Benefit Linkage

**Metric moved:** Bootstrap-to-first-inner-loop-run time; Fork/clone avoidance rate among new adopters
**How:** This story is the walking skeleton itself — it's the first point either metric becomes measurable at all, since no bootstrap path exists today.

## Architecture Constraints

- **Reuse, not reimplementation (ASSUMPTION-invalidated, see `decisions.md` 2026-08-05):** `scripts/platform-init.js` already exists and already copies `.github/skills`, `.github/templates`, `scripts` into a target directory, seeding a minimal `.github/copilot-instructions.md`. This story wraps that script as the npm-package's install engine — it does not reimplement file-copying, existing-file-skip, or directory-creation logic that `platform-init.js` already has and already works. The npm CLI entry point resolves `PLATFORM_ROOT` to the package's own bundled copy of the platform files (since a consumer running via `npx` has no local checkout) and invokes the same `COPY_DIRS` logic already defined there.
- **No npm publishing pipeline exists today** (discovery constraint) — this story's own scope includes setting up the initial package (name, registry access, minimal versioning) as a build dependency, not a precondition someone else delivers first. The package's `bin` entry point is new; the file-copy logic it calls is not.
- **ADR-004** (`context.yml` is the single config source of truth) — the init command must write a `context.yml` seed, not a parallel config format. `platform-init.js` does not currently seed `context.yml` or `pipeline-state.json` — this story adds that, alongside the existing copy behaviour.
- **Guardrail:** per `.github/architecture-guardrails.md` "Style Guide" section for scripts — plain Node.js, CommonJS, no external npm dependencies in any pre-commit-hook-adjacent tooling this story touches (matches `platform-init.js`'s own existing style already).
- **git-init is explicitly not this story's concern:** `platform-init.js` never calls `git init` on the target directory today, and this story does not add it — bootstrapping the platform's files is a separate concern from initializing the target's own version control, which remains the user's responsibility.

## Dependencies

- **Upstream:** None
- **Downstream:** rb-s2 (full skill set + registry) and rb-s3 (harness-agnostic instructions) both extend this story's init command rather than building a separate one.

## Acceptance Criteria

**AC1:** Given an empty target directory, When a developer runs the init command via `npx` (e.g. `npx @heymishy/skills-repo@latest init <dir>`) without any local clone or checkout of the platform repository present anywhere in that command's own working environment, Then the target directory ends up containing the same files `platform-init.js` already produces (skills, templates, scripts, a seeded `.github/copilot-instructions.md`) plus a newly-seeded `context.yml` and `pipeline-state.json`.

**AC2:** Given the npm package is installed and run via `npx`, When the CLI entry point invokes the bundled `platform-init.js` logic, Then it resolves `PLATFORM_ROOT` to the package's own bundled files (not an environment variable pointing at a developer's local checkout) — verified by running the command from a directory with no relationship to this repository's source and confirming identical output to running `platform-init.js` directly from a real checkout.

**AC3:** Given the init command is run a second time against a directory that already contains a bootstrapped repo, When the command detects existing platform files, Then it skips them without overwriting (matching `platform-init.js`'s existing `--force`-gated skip behaviour) and reports which files were skipped — it does not corrupt or duplicate content, and it does not reference any update mechanism beyond what `platform:fetch` (already existing, see `rb-s2`'s Architecture Constraints) already provides.

**AC4:** Given the init command has completed in a fresh directory, When the developer runs the first inner-loop skill (`/branch-setup`) in that directory, Then it completes successfully using only the files the init command materialized — no manual copying from the upstream repository is required.

## Out of Scope

- Copying the *full* skill set or generating a skills registry beyond what `platform-init.js` already copies — this story wraps the existing script's output; `rb-s2` extends it with the registry manifest.
- Harness-agnostic instruction file generation (CLAUDE.md/AGENTS.md/.cursorrules) — this story continues seeding one instruction file format only (matching `platform-init.js`'s current behaviour); `rb-s3` extends it.
- The existing-SaaS-repo entry point — entirely out of scope for this story; see `rb-s4`.
- Modifying `platform-init.js`'s own existing skip/force/copy behaviour — this story wraps it as-is; any behavioural change to that script is a separate concern.

## NFRs

- **Performance:** Init command completes materialization in under 30 seconds on a typical broadband connection (excluding `npm install` time for the target repo's own dependencies).
- **Security:** No credential, token, or secret is written to any file the init command creates; no network call other than fetching the published package itself.
- **Accessibility:** Not applicable — CLI tool, no visual UI surface.
- **Audit:** Not applicable at this story's scope — no SaaS-side event to log yet (that begins at `rb-s4`).

## Complexity Rating

**Rating:** 3
**Scope stability:** Unstable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
