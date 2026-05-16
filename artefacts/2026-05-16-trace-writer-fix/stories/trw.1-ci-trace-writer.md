# Story trw.1 — CI Trace Writer: Guarantee One Fresh JSONL Record per Master Push

**Feature slug:** 2026-05-16-trace-writer-fix
**Story ID:** trw.1
**Short-track:** Yes — platform infrastructure bug fix
**Created:** 2026-05-16
**Priority:** Medium (P14 secondary gap — primary loop unblocked by improvement-agent-schedule.yml fix)
**Complexity:** 1 — Well understood. Script writes from CI env vars to a fixed hardcoded path. No ambiguity, no external dependencies beyond GitHub Actions environment.
**Scope stability:** Stable
**Benefit linkage:** Platform trace freshness — P14 secondary fix. Ensures improvement agent reads current (not stale) traces, directly supporting MM1 signal quality and improvement loop integrity.

---

## User story

As a platform reliability engineer,
I want every push to master to guarantee at least one fresh JSONL trace record committed to the `traces` branch,
So that the improvement agent has an up-to-date and growing trace history to analyse rather than a permanently stale April 2026 snapshot.

---

## Background and root cause

### P14 primary fix (done — committed 2026-05-16)
`improvement-agent-schedule.yml` was reading `workspace/traces/` from the master branch, but traces have been stored on the `origin/traces` branch since PR #53 (~2026-04-12). Fix applied: added `git fetch origin traces && git checkout origin/traces -- workspace/traces/ || true` step before the agent runs.

### P14 secondary gap (this story)
Despite `trace-commit.yml` running after every master push and recording 10+ commits to `origin/traces`, the `workspace/traces/` directory on that branch contains only the same 18 JSONL files from 2026-04-11 to 2026-04-13. No new trace records have been generated.

**Root cause:** `trace-commit.yml` searches for the most recent *successful* `assurance-gate.yml` run to download its artifact. If recent assurance-gate runs have failed, not uploaded artifacts, or the artifact download returns stale files, `trace-commit.yml` falls back to the last reliably successful run — an April 12 run whose artifact contains exactly the 18 files that keep appearing. Every master push re-commits those same 18 files.

The fix must not depend on the artifact download path being reliable. A guaranteed trace-writer step — invoked directly from `trace-commit.yml` using GitHub push event environment variables — ensures at minimum one fresh record per master push regardless of artifact availability.

**Confirmed:** `git show origin/traces:workspace/traces/` returns 18 files, all dated 2026-04-11 to 2026-04-13.

---

## Acceptance criteria

### AC1 — Fresh record per push
**Given** a repository with `trace-commit.yml` configured to trigger on push to master
**When** any commit is pushed to master (via PR merge or direct push)
**Then** at least one new JSONL file is committed to `workspace/traces/` on the `origin/traces` branch, and its timestamp matches the current CI run date — not a date from a cached artifact

### AC2 — Correct record content
**Given** `scripts/write-ci-trace.js` runs in a GitHub Actions push context
**When** the generated JSONL file is read and each line is parsed as JSON
**Then** the record contains all 7 required fields: `runId` (Actions run ID), `commitSha` (GITHUB_SHA value), `headRef` (GITHUB_REF value), `trigger` = `"post-merge"`, `timestamp` (ISO 8601 UTC), `verdict` = `"trace-committed"`, `surface` = `"ci-trace-commit"`

### AC3 — Naming convention
**Given** `GITHUB_SHA` is known and a UTC timestamp is generated at run time
**When** the output filename is inspected
**Then** it matches the pattern `{ISO-timestamp-with-colons-replaced-by-dashes}-ci-{8-char-sha}.jsonl` — example: `2026-05-16T10-30-00-000Z-ci-bd7f996f.jsonl`

### AC4 — Additive to existing traces
**Given** the `origin/traces` branch contains pre-existing JSONL files
**When** `trace-commit.yml` runs after a master push
**Then** all pre-existing JSONL files remain present on the branch — the new writer is additive and does not overwrite or delete any existing trace records

### AC5 — Improvement agent compatibility
The JSONL file format must be parseable by `improvement-agent-schedule.yml`'s trace reading logic. Specifically: one JSON object per line, with the required fields from AC2, with no trailing commas or invalid JSON.

### AC6 — No regression on assurance-gate
The existing `assurance-gate.yml` artifact upload step (`Upload trace artifact`) and the artifact download step in `trace-commit.yml` must continue to function unchanged. The trace writer step is additive; it does not replace the artifact-based path.

---

## Implementation notes

A new script `scripts/write-ci-trace.js` should:
1. Read `GITHUB_RUN_ID`, `GITHUB_SHA`, `GITHUB_REF`, `GITHUB_REPOSITORY`, and `GITHUB_RUN_STARTED_AT` from the environment (all available in GitHub Actions push context)
2. Construct a JSONL record matching AC2
3. Write to `workspace/traces/{timestamp}-ci-{sha8}.jsonl`
4. Create the directory if it does not exist
5. Exit 0 on success; exit 1 on write failure (must not silently fail)

Call the script from `trace-commit.yml` as a new step *before* the artifact download steps, so even if the artifact path fails, the fresh record is already written and staged.

The script must not generate or log any GitHub token, credential, or repository secret.

---

## Out of scope

- Changing `assurance-gate.yml` artifact generation or upload logic
- Fixing the underlying reason assurance-gate.yml is not producing new artifacts for recent PRs (that is a separate investigation; this story guarantees baseline trace coverage)
- Backfilling trace records for merged PRs between 2026-04-12 and 2026-05-16

---

## NFRs

None — reviewed 2026-05-16. Security items (no credential logging, hardcoded output path with no user-controlled input) are covered by AC2 field constraints and test T11 in the test plan. No data classification concerns (trace metadata only, no PII).

## Architecture Constraints

- **D37** — Not applicable. No injectable adapters introduced by this story.
- **Path traversal guard** — Not applicable. Output path is hardcoded to `workspace/traces/` within the CI environment; no user-controlled input participates in path construction.
- **Credential guard** — `write-ci-trace.js` must not log `GITHUB_TOKEN` or any other secret to stdout, stderr, or the output JSONL file. Verified by test T11.
- **Additive-only** — The script appends a new file to the traces directory; it never reads, modifies, or deletes existing files.

---

## Definition of done

All ACs verified by the test plan. `npm test` passes with no new failures. A manual smoke check confirms: after pushing a test commit to master, `git show origin/traces:workspace/traces/` lists at least one new file with a timestamp from today.
