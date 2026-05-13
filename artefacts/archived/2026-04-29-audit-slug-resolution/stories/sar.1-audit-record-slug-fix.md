## Story: Fix audit record to resolve feature slug from PR body, not pipeline-state heuristic

**Epic reference:** Short-track — no parent epic (bounded bug fix)
**Discovery reference:** N/A — short-track defect fix
**Benefit-metric reference:** N/A — short-track defect fix

## User Story

As a **platform operator reviewing a merged PR**,
I want the "Governed Delivery Audit Record" to show artefacts belonging to the story in the PR being reviewed,
So that the audit record is a meaningful governance signal rather than a misleading display of unrelated artefacts with green ticks.

## Benefit Linkage

**Metric moved:** Pipeline governance integrity (no formal metric — short-track defect)
**How:** The current `resolve_feature` step in `assurance-gate.yml` picks a feature slug by heuristic (last non-done feature in `pipeline-state.json` array order). This is PR-blind: a p11.4 PR will show CAA artefacts with ✅ if CAA happens to be last in the array. This story replaces the heuristic with PR-body extraction: the slug is read from the artefact path in the "Chain references" table, which every PR template populates. The audit record becomes accurate, and reviewers can trust it.

## Architecture Constraints

- ADR-009: no `contents: write` permission in the workflow — read-only GitHub API calls only. Slug extraction reads the PR body from `github.event.pull_request.body` (already available in context), not from a new API call. No write operations added.
- Zero new npm dependencies — all extraction logic in Node.js built-ins or inline shell.
- The extraction helper must be a standalone Node.js script (`scripts/extract-pr-slug.js`) so it can be unit-tested outside CI. Inline shell one-liners are not testable.
- Fail-open: if no artefact path is found in the PR body, the workflow falls back to the existing heuristic and posts a ⚠️ notice in the audit record. It does not fail the gate.

## Dependencies

- **Upstream:** None
- **Downstream:** None

## Acceptance Criteria

**AC1:** Given a PR body containing at least one markdown table row with an artefact path matching the pattern `` `artefacts/<slug>/` `` (as produced by the standard PR template "Chain references" table), when `scripts/extract-pr-slug.js` is called with the PR body text as input, then it returns the first matching `<slug>` string.

**AC2:** Given a PR body with no `artefacts/` path (e.g. a minimal stub issue body or a PR with no chain references table), when `scripts/extract-pr-slug.js` is called, then it returns an empty string (not an error, not a crash).

**AC3:** Given the `resolve_feature` step in `.github/workflows/assurance-gate.yml`, when the PR body contains a valid artefact path, then `resolve_feature` sets `outputs.slug` to the PR-body-extracted slug and logs `[resolve_feature] Extracted from PR body: <slug>` — the pipeline-state.json heuristic is not used.

**AC4:** Given the `resolve_feature` step falls back to the heuristic (PR body yielded empty string), when the audit record comment is posted on the PR, then the "What was delivered" section header includes `⚠️ slug auto-resolved from pipeline-state — verify artefacts are correct` so reviewers can see the fallback occurred.

**AC5:** Given `resolve_feature` successfully extracted a slug from the PR body, when the audit record comment is posted, then the "What was delivered" section header includes `Source: PR body (Chain references)` so reviewers can confirm the artefacts are correctly scoped.

## Out of Scope

- Changing how artefact hashes are computed or displayed — hash accuracy is not in scope.
- Adding a hard gate failure when fallback is used — fail-open behaviour is intentional (ADR-009 pattern: attachment failure must not block the governance gate result).
- Cross-checking the manifest slug against the extracted slug and blocking merge on mismatch — desirable but a separate story; deferred to avoid scope creep on this fix.
- Changes to any file outside `scripts/extract-pr-slug.js`, `.github/workflows/assurance-gate.yml`, and `tests/check-sar1-slug-resolution.js`.

## NFRs

- **None identified** — checked against `.github/architecture-guardrails.md`. Slug extraction is a string operation on an already-available value; no performance, security, or compliance implications.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable — PR body format is controlled by the PR template; the artefact path pattern `artefacts/<slug>/` is stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared
- [x] Benefit linkage is written
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (explicitly "None")
- [x] Human oversight level confirmed: Low (bounded single-file logic fix + workflow update)
