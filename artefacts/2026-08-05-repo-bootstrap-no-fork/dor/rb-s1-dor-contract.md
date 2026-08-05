# Contract Proposal: Bootstrap a minimal fresh repo with one init command

**Story reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s1-minimal-fresh-repo-init.md
**Date:** 2026-08-05

## What will be built

An npm package (`bin` entry point, e.g. `cli/bin/init.js`) wrapping the existing `scripts/platform-init.js` COPY_DIRS logic, resolving `PLATFORM_ROOT` to the package's own bundled files instead of requiring a local checkout, plus seeding `context.yml` and `.github/pipeline-state.json` in the target directory (which `platform-init.js` doesn't currently do).

## What will NOT be built

- Full skill set/registry — `rb-s2`
- Harness-agnostic instructions — `rb-s3`
- `git init` of the target directory — explicitly out of this story's concern
- npm-publish CI automation beyond initial manual publish setup

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Temp-dir + CLI invocation, assert output matches `platform-init.js` + new seeds | Integration |
| AC2 | Assert `PLATFORM_ROOT` resolution logic returns bundled path, not env-var/cwd-derived | Unit |
| AC3 | Assert skip-not-overwrite behaviour + message references `platform:fetch` | Unit |
| AC4 | Manual — real `/branch-setup` run against bootstrapped output | Manual |

## Assumptions

- Package name is available on npm
- The CLI can bundle `scripts/`, `.github/skills/`, `.github/templates/` via npm's standard `files` field without a build step

## Estimated touch points

- **Files:** new `cli/bin/init.js`, `package.json` (`bin` + `files` fields)
- **Services:** none
- **APIs:** none

**Contract review:** ✅ PASSED — proposed implementation aligns with all 4 ACs.
