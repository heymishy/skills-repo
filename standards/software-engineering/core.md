---
title: Software Engineering Core Standards
discipline: software-engineering
lastReviewedBy: Hamish
lastReviewedDate: 2026-04-10
---

# Software Engineering Core Standards

**Discipline:** software-engineering
**lastReviewedBy:** Hamish
**lastReviewedDate:** 2026-04-10

These standards define the universal baselines for software engineering delivery across all surfaces and domains. Domain and squad extensions may add requirements; they may not relax these baselines.

## Requirements

- MUST have a passing automated test suite committed before the implementation PR is merged
- MUST express all public API contracts in a machine-readable schema before the API is deployed
- MUST record all architectural decisions in a decision log entry at the time the decision is made
- SHOULD structure code so that each named service boundary can be deployed independently of others
- SHOULD declare all external dependencies with pinned version references in a manifest file
- MAY include performance benchmarks in the test suite when a latency SLO is defined for the service
- MUST write any mutable state file (e.g. `workspace/state.json`) using an atomic-replace pattern: write to a temp file in the same directory, then rename over the target. Append operations and non-truncating in-place writes produce unparseable files under partial write or tool failure conditions.
- SHOULD, when resolving any merge conflict in `package.json`, run `git log origin/master --oneline -- package.json` to identify all scripts merged since the branch point and include them all in the resolved file, plus any new script added by the current branch.
- SHOULD list all existing files in the target directory before writing any new file to a shared directory (e.g. `.github/workflows/`) to avoid filename collision with previously merged work.
- MUST test all check scripts on Linux-equivalent paths before committing. Use `process.platform` guards for Windows-specific behaviour. Never assume `bash` resolves to Git Bash on Windows — CI runs on Linux where `bash` is the system shell.
- MUST design stateful bot / session modules so that all session state is passed in as a function parameter and returned in the function result. No module-level mutable state (no `let session = {}` at module scope). This satisfies C11 (no persistent hosted runtime) structurally: a stateless function cannot hold state between invocations.
- MUST inject all configuration values as explicit function parameters (config objects, dependency injection). No module-level reads from `process.env`, `process.argv`, or the filesystem at require-time. Config injection enables unit tests to supply fixture values without mocking and enforces ADR-004 (context.yml as single config source) at the implementation level.
- MUST update `testPlan.totalTests` and `testPlan.passing` fields in `pipeline-state.json` from the actual test runner output (run the test, read the count from stdout), not from a pre-implementation estimate. Stale test count metadata breaks DoD evidence integrity and makes coverage reports misleading.
- MUST, when implementing a distribution CLI that writes files to a consumer repository, maintain a hardcoded permanent exclusion list of paths the CLI must never write to regardless of configuration (e.g. `pipeline-state.json`, `context.yml`, `workspace/**`, `artefacts/**`). This list must not be configurable away by consumers. Consumers may add additional exclusions via config; they must not remove the hardcoded set. A CLI that allows consumer config to override safety exclusions introduces a misconfiguration path that silently destroys pipeline state.
- SHOULD, when implementing a managed-merge file (a file co-owned by upstream and consumer), identify consumer-authored blocks by a structural marker (e.g. `## ADR-NNN` heading pattern) and preserve them unconditionally on upgrade. If an upstream change conflicts with a consumer-authored block, halt and require manual resolution rather than overwriting. A silent overwrite destroys consumer architecture decisions and breaks the audit trail for the affected period.
- MUST, when a story adds a CLI command invokable via `npm run`, include the `package.json` script entry and a `package-json-has-<command-name>-entry` test in the same PR. The script existing at a file path is not the same as it being part of the public command surface — both must ship together. A CLI command that cannot be invoked via `npm run` is incomplete regardless of whether the underlying script is functional.
- SHOULD, when implementing a CLI command that detects divergence or integrity failures (e.g. lockfile verify, hash mismatch, schema drift), produce a three-part error output: (1) the specific file or resource that failed, (2) the expected vs actual value (hash, version, field), and (3) the exact `npm run` command to repair the state. This pattern — file + comparison + fix-command — is the established platform divergence error shape and must not be collapsed into a single-line message.
