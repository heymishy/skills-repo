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
