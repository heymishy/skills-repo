# Definition of Ready: Incident record pull request opened for each bridge-opened production error GitHub issue

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s7-incident-record-from-production-error-issue.md
**Test plan reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s7-incident-record-from-production-error-issue-test-plan.md
**Verification script:** artefacts/2026-11-08-cicd-observability-hardening-automation/verification-scripts/coha-s7-incident-record-from-production-error-issue-verification.md
**Review:** PASS, run 5 (artefacts/2026-11-08-cicd-observability-hardening-automation/review/coha-s7-review-5.md), 0 HIGH, 0 MEDIUM, 4 LOW (three fixed in the story, one carried to the test plan). Run 4 of the same amendments FAILED on one HIGH (the live check set-up order), which was fixed. Runs 4 and 5 were written by an independent reviewer agent, not by the author.
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-14
**Status:** SIGNED OFF by Hamish King, Platform Owner, 2026-11-14 (hard blocks 20/20 passed, 6 not applicable; W3 and W4 acknowledged as RISK-ACCEPTs)

---

## Contract Proposal

See `coha-s7-incident-record-from-production-error-issue-dor-contract.md` (saved alongside this artefact).

## Contract Review

✅ **Contract review passed.** Each of the nine ACs maps to named tests at the type it needs: AC1 to AC7 through the real logic module, the real record creation against a temp copy of the incident file, the real product page handler and real `git` in a temp repository (so the conflict and the rebuild are proven locally), the workflow file through structural tests (W1 to W12), and AC8 and AC9 as live-verified scenarios after merge. The contract states that the existing files the tests exercise (`routes/error-bridge.js` for `buildBody`, `create-incident.js`, `incident-recorder.js`, `incident-store.js`, `triage-drafter.js`, `products.js`) are read or run by tests but not edited, so it does not contradict the test plan (B1/D1). Mock-shape check: issue bodies are built by the real coha-s6 `buildBody`, so the parser is tested against what the producer really emits; the surrounding GitHub event envelope is built from GitHub's documented fields, not captured from a real run, and the contract says so and leaves its proof to the AC8 dry run.

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format, named persona | ✅ | "As a delivery engineer ..." |
| H2 | At least 3 ACs in Given/When/Then | ✅ | 9 ACs |
| H3 | Every AC has at least one test | ✅ | 39 automated tests plus 2 live scenarios (AC8, AC9); every AC mapped in the coverage table |
| H4 | Out-of-scope populated | ✅ | Eight explicit exclusions |
| H5 | Benefit linkage names a metric | ✅ | Production-defect detection latency (Metric 4), indirectly |
| H6 | Complexity rated | ✅ | Rating 2, scope stability stated |
| H7 | No unresolved HIGH review findings | ✅ | review-5: 0 HIGH (run 4's HIGH is fixed and re-reviewed) |
| H8 | No uncovered ACs | ✅ | AC8 and AC9 are live-only by nature and covered by scenarios; gaps classified in the test plan |
| H8-ext | Cross-story schema dependency | ✅ | Upstream coha-s6 declared; the contract carries `schemaDepends: [prStatus, dodStatus]`, both present in `pipeline-state.schema.json` |
| H9 | Architecture Constraints populated; no Category E HIGH | ✅ | Constraints cover ADR-009 (deviation accepted), ADR-010, ADR-012, least privilege, no untrusted text; no Category E HIGH in run 5 |
| H-E2E | No CSS-layout-dependent AC | ✅ N/A | No UI; `hasLayoutDependentGaps: false` |
| H-NFR | NFR profile exists | ✅ | Rows for coha-s7 (security, audit, reliability, compliance, data classification) added to `nfr-profile.md` on 2026-11-14; they were missing until this check |
| H-NFR2 | Compliance NFR sign-off | ✅ N/A | No regulatory clause |
| H-NFR3 | Data classification not blank | ✅ | "Internal" |
| H-NFR-profile | Profile present | ✅ | Present |
| H-GOV | Approved By in discovery | ✅ | "Hamish King — Platform Owner — 2026-11-08". M1 signal: role unverified for independent sign-off quality, as for the other stories in this feature |
| H-ADAPTER | Injectable adapter wiring check (D37) | ✅ N/A | This design introduces no injectable adapter: the script decides on data passed in and the git and pull request steps are plain workflow steps. If the implementation plan introduces an adapter after all, D37 applies to it in full (throwing stub, a wiring AC, a separate wiring task) and the DoR must be re-checked. |
| H-INF | `hasInfraTrack` not set | ✅ N/A | |
| H-MIG | `hasMigrationTrack` not set | ✅ N/A | No schema or table change |
| H-DESIGN | `hasDesignSystemTrack` not set | ✅ N/A | No UI |

**Result: 20/20 hard blocks passed (6 not applicable).**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | Security, audit, reliability stated; accessibility N/A; now in the NFR profile |
| W2 | Scope stability declared | ✅ | — | Rating and stability stated; amended by the operator on 2026-11-14 and re-reviewed |
| W3 | MEDIUM findings acknowledged | ⚠️ | Runs 3 (two MEDIUM) and 4 (four MEDIUM) found issues that were fixed in the story by the author agent before the next run; run 5 by an independent reviewer found 0 MEDIUM | Acknowledged by Hamish King on 2026-11-14; logged in decisions.md |
| W4 | Verification script reviewed by a domain expert | ⚠️ | An unreviewed script may miss edge cases | Acknowledged by Hamish King on 2026-11-14 as a RISK-ACCEPT in decisions.md; the 39 automated tests and the two live scenarios limit what an unreviewed script can get wrong. Not an independent review. |
| W5 | No UNCERTAIN gap-table items | ✅ | — | Every gap-table entry has a stated handling |

**Decisions already logged 2026-11-14 (decisions.md):** the three refinements (per-issue concurrency, exact author match, inline-code pull request text); AC9 added; the RISK-ACCEPT for the one-file workflow (ADR-009); the Actions-may-create-pull-requests and admin-bypass-merge confirmations.

---

## Oversight

Parent epic: **Medium**. The tech lead must be shown this DoR artefact; the operator is the only contributor and the tech lead in this repo, so this artefact and the operator's sign-off are that step.

**Sign-off:** Hamish King — Platform Owner — 2026-11-14, given in the session after the four decisions (three refinements, AC9 added, ADR-009 RISK-ACCEPT, and the two confirmations) and the W3 and W4 acknowledgements.

**Open facts the implementer must not assume away (recorded, not blocking):**
1. The workflow variable naming the bridge account does not exist yet; the operator creates it (their exact GitHub login, letter case included) before AC8 and AC9. Until then every issue is declined, by design.
2. AC8 and AC9 each need the operator's explicit approval immediately before the run: AC9 creates a real branch and pull request in a public repository, and the operator then closes the pull request unmerged, deletes the branch and closes the test issue.
3. Whether GitHub shows the required checks on a workflow-made pull request as not run, or waiting for approval, is unknown until AC9; the result goes in `decisions.md`.
4. The real `issues` `opened` payload is unverified until the AC8 live run.

---

## Standards injection

Story has no `domain` field — skipped silently.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes (operator sign-off, W3 and W4 acknowledgements, and the AC9 and ADR-009 decisions recorded 2026-11-14)
Story: Incident record pull request opened for each bridge-opened production error GitHub issue — artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s7-incident-record-from-production-error-issue.md
Test plan: artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s7-incident-record-from-production-error-issue-test-plan.md
Contract: artefacts/2026-11-08-cicd-observability-hardening-automation/dor/coha-s7-incident-record-from-production-error-issue-dor-contract.md
Decisions to read first (end of the file, entries dated 2026-11-14): artefacts/2026-11-08-cicd-observability-hardening-automation/decisions.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- Node.js, this repo's existing conventions; test runner is node scripts/run-all-tests.js; the new check is node tests/check-coha-s7-error-issue-incident.js. Use Git Bash first on PATH and PowerShell 7 for verification runs. Tests use real git in temporary directories and never contact GitHub.
- New files only: .github/workflows/error-issue-incident-record.yml, scripts/lib/error-issue-incident.js, scripts/error-issue-incident.js, tests/check-coha-s7-error-issue-incident.js, tests/fixtures/coha-s7-*.json if needed. Possibly scripts/run-all-tests.js (decide SEQUENTIAL_EXCLUSIVE_LIST by measuring on 2 pinned cores with a two-slot pool). Do not edit workspace/incidents.json, scripts/create-incident.js, src/modules/incident-recorder.js, scripts/lib/incident-store.js, src/modules/triage-drafter.js, src/web-ui/routes/error-bridge.js or src/web-ui/routes/products.js; tests may import or run them.
- NEVER read, write or touch workspace/incidents.json in any test or script run; always pass an explicit --incidents path to a temp copy. The script must contain no default path to the real file and no fallback.
- The workflow: trigger `issues` with types declared explicitly as [opened], plus workflow_dispatch with inputs issue number, dry_run and rebuild; one file with two jobs (the ADR-009 deviation is accepted); recognise job permissions contents: read and issues: read only; record job permissions contents: write and pull-requests: write only; no other permission; only the action actions/checkout (persist-credentials false on the recognise job); timeout-minutes on both jobs; concurrency group per issue number (covering both the event number and the dispatch input) with cancel-in-progress false; the bridge author read from a workflow variable (vars.*), never hard-coded; only secrets.GITHUB_TOKEN.
- Untrusted issue text (title, body, labels, author) must NEVER appear in a shell command or in a ${{ }} expression inside a run block; the script reads it from a JSON file (the event file or a fetched issue written to a file). Only an allow-list of trusted expressions may appear in run blocks (see test W4).
- Recognition: label production-error present at opening (current labels on a hand start); author login equal to the configured login, exact comparison, an unset or empty value recognises nothing; exactly one distinct whole-line marker `PostHog issue id: <lowercase uuid>` (CRLF accepted); the id validated as a lowercase UUID before any use in a branch name, tag or path; items carrying a pull_request key declined. Title or body text alone never creates a record.
- Record: created through the real recordIncident / create-incident path against a copy of the incident file; summary equals the fixed code; tags include production-error and posthog:<id>; trigger names the issue URL and the PostHog id; nothing else from the issue body (no first-seen text beyond the fixed fields as the plan says).
- Pull request: one per recognised issue, title and body built only from the fixed code (inline code formatting, one line, backticks replaced) and the issue number; into master; the workflow never merges, approves, marks ready, or pushes to master; every push targets refs/heads/incident/posthog-<validated id>.
- Idempotency: skip with a distinct logged reason when a record tagged posthog:<id> is already on master, the branch exists, or an open pull request exists; a rebuild hand start lifts only the branch-exists and pull-request-open skips (never the on-master skip), resets the branch from origin/master, rebuilds and pushes with --force-with-lease limited to that branch; a dry run (with or without rebuild) changes nothing.
- One log line per attempt carrying the outcome, a fixed reason and the issue number; never repeat issue text.
- No credentials in any file. The script is deterministic and takes the bridge login, facts and file paths as inputs.
- Open a draft PR when tests pass — do not mark ready for review. The operator merges it with the admin bypass.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing it and do not mark ready for review.
```
