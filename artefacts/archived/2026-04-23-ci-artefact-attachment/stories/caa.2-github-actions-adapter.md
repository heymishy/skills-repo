# Story: caa.2 — GitHub Actions adapter: upload artefact bundle and post summary link

**Feature:** 2026-04-23-ci-artefact-attachment
**Epic:** e1-ci-artefact-attachment
**Story ID:** caa.2
**Track:** standard
**Complexity:** 2 — Some ambiguity in exact `assurance-gate.yml` placement; CI permission model requires care
**Scope stability:** Stable

## User Story

As a second-line risk reviewer or product manager with no git access,
I want the CI pipeline to upload the governed artefact bundle as a downloadable CI artifact and post a direct link to the associated PR or issue,
So that I can reach the full evidence chain in two clicks or fewer from any CI run URL, without needing git credentials or local tooling. (M1-evidence-reach)

## Context and Background

This story introduces the first concrete CI platform delivery. It builds on the staging directory produced by caa.1. The delivery has two parts: (1) upload the staging directory using `actions/upload-artifact` in `assurance-gate.yml`; (2) post a comment on the associated PR/issue via `gh pr comment` (or the GitHub Actions context).

The upload and comment steps are wrapped in an adapter file (`scripts/ci-adapters/github-actions.js`) that implements the declared interface:
```
interface CIAdapter {
  upload(stagingDir: string, runId: string): Promise<{ artifactUrl: string }>
  postComment(issueRef: string, summaryLink: string): Promise<void>
}
```

The adapter file is the extensibility point — a GitLab CI adapter would be a second file implementing the same interface. The interface is documented in `scripts/ci-adapters/README.md`.

Per the **two-workflow CI audit pattern** (architecture-guardrails.md): the upload step is appropriate within the `pull_request` workflow (`assurance-gate.yml`), using `contents: read`. The upload artifact action does not write to the repo — it uploads to GitHub's artifact storage, which does not require `contents: write`.

## Architecture Constraints

- Two-workflow CI audit pattern (architecture-guardrails.md): upload artifact in the `pull_request` workflow with `contents: read` permission. Do not use `contents: write` in the evaluator workflow.
- No external npm dependencies: the adapter script uses Node.js built-ins for file operations; the actual upload is delegated to `actions/upload-artifact` (a GitHub-managed action, not an npm package).
- Config reading (architecture-guardrails.md): the adapter is selected by reading `audit.ci_platform` from `context.yml` — not hardcoded in the workflow YAML.

## Dependencies

- **Upstream:** caa.1 must be DoD-complete — this story consumes the staging directory produced by `trace-report.js --collect`.
- **Downstream:** caa.3 (opt-in gate) wraps the invocation of this story's steps behind `ci_attachment: true`. The steps added in this story must be individually functional before caa.3 adds the condition layer.

## Acceptance Criteria

**AC1:** Given a workflow run of `assurance-gate.yml` on a pull request, when the staging directory `.ci-artefact-staging/[slug]/` exists (produced by `trace-report.js --collect`), then the directory is uploaded as a named GitHub Actions artifact with the name `governed-artefacts-[slug]-[run-id]` and is accessible from the workflow run's Artifacts section.

**AC2:** Given a completed artifact upload in `assurance-gate.yml`, when the workflow step that posts a PR comment runs, then a comment is posted on the PR containing: the phrase "Governed artefact chain", a direct download link to the uploaded artifact (the GitHub Actions artifact URL or run URL), and the feature slug.

**AC3:** Given the `scripts/ci-adapters/` directory, when a new adapter file is added for a second CI platform implementing the interface `{ upload(stagingDir, runId), postComment(issueRef, summaryLink) }`, then no changes to `scripts/trace-report.js`, `assurance-gate.yml`, or any other file are needed to register the second adapter — it is purely additive.

**AC4:** Given `scripts/ci-adapters/README.md`, when a platform engineer reads it, then it documents: the adapter interface contract (method signatures and expected return types), how to add a new adapter, and which `context.yml` `ci_platform` value maps to each adapter file.

**AC5:** Given the `assurance-gate.yml` workflow, when the upload and comment steps are added, then the workflow's `permissions:` block does not include `contents: write` — the upload uses only GitHub's artifact store (no repo write required).

## Out of Scope

- GitLab CI, Azure DevOps, Jenkins, CircleCI adapter implementations — those are additive files against the interface established in this story.
- Long-term artifact archival beyond GitHub's default artifact retention.
- Posting comments to issues (as opposed to PRs) — the MVP targets PR comments; issue comment support is a future enhancement.
- Any changes to the post-merge `contents: write` workflow — the artifact upload happens pre-merge only.

## NFRs

- **Security:** The workflow step that posts the PR comment must use `${{ github.token }}` — no personal access tokens or secrets stored outside the GitHub Actions secrets mechanism.
- **Permissions:** The `assurance-gate.yml` workflow must not acquire permissions beyond what it already holds. New steps must fit within `contents: read, pull-requests: write` (pull-requests write is needed for the comment).
- **Idempotency:** If the workflow runs twice on the same PR (e.g. after a push), the adapter either updates the existing comment in-place or posts a new comment — silent skip or silent failure is a failing outcome.
