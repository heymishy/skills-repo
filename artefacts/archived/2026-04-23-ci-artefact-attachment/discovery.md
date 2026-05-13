# Discovery: CI-Native Artefact Attachment (WS0.6)

**Status:** Approved
**Created:** 2026-04-23
**Approved by:** Operator, 2026-04-23
**Author:** Copilot
**Roadmap reference:** Phase 5 WS0.6 (Phase 4 completion track); ref doc item 4.B.9

---

## Problem Statement

When the assurance gate runs on a PR, the full pipeline artefact chain — discovery, benefit metric, stories, test plan, DoR, DoD, and trace — exists in the repository but is inaccessible to anyone without git access or tooling. A non-technical operator (product manager, business analyst), an auditor, or a second-line risk reviewer who needs to confirm what governed a delivery has no direct path to that evidence. They must ask an engineer for access, learn git, or be given repository permissions — each of which creates friction, a bottleneck on the engineering team, or a governance gap (repository read access granted beyond the delivery team).

The problem has a second face: even technical reviewers clicking through a GitHub CI run currently have no way to see the artefact chain associated with that run without navigating the repository tree manually. The CI run and the governing artefacts are not linked.

This problem is experienced after every assurance gate run — at every PR merge, at every second-line review point, and whenever an auditor requests evidence of a governed delivery. At current pipeline scale it is a coordination overhead; at 10+ team scale it becomes a systematic access and compliance gap.

## Who It Affects

**Product managers and business analysts** — own benefit metric definition and story AC quality. Currently cannot verify the artefact chain they are responsible for without engineering assistance. Need governed evidence to answer questions from stakeholders and risk functions.

**Second-line risk reviewers and auditors** — need to trace a delivery from business intent to implementation evidence without accessing the delivery team's repository. Currently blocked entirely unless given repository access or a file export. The organisational independence claim (Theme F, 4.F.4) requires that evidence be reachable from a platform outside the repository.

**Tech leads and squad leads** — sign off on DoR and are accountable for benefit metric targets. Want a stable link they can share with stakeholders after a gate pass, without managing repository permissions.

**Platform maintainers** — cannot point auditors to a governed evidence package from a CI run. Must respond to ad-hoc evidence requests manually.

## Why Now

The Phase 4 governance package is stable. The assurance gate (`assurance-gate.yml`) now runs at every PR boundary and evaluates the full artefact chain. `trace-report.js` already walks the artefact chain deterministically from `pipeline-state.json`. The infrastructure that identifies and reads artefacts is in place; the only missing piece is the upload and link step.

WS0.6 is the last ADDITIVE item in the WS0 distribution completion track (WS0.1–WS0.6) that can proceed without Spike D output. The roadmap risk register (R1) explicitly identifies WS0.1–WS0.6 as a separable first track. WS0.7–WS0.10 (non-technical channel) depend on Spike D; WS0.6 does not.

From a compliance readiness perspective, Theme F's organisational independence claim (4.F.4) is partially open until artefact evidence is reachable from outside the repository. WS0.6 closes that gap at the lowest implementation cost of any Theme F item.

## MVP Scope

1. A `--collect` flag added to `trace-report.js` that, given a feature slug (or resolved from `pipeline-state.json`), assembles the full artefact chain into a flat staging directory with sequentially numbered filenames (`00-summary.md`, `01-discovery.md`, `02-benefit-metric.md`, `03-stories.md`, `04-test-plans.md`, `05-dor.md`, `06-dod.md`, `07-trace.jsonl`).

2. A new step in the assurance gate CI workflow (`assurance-gate.yml`) that runs `node scripts/trace-report.js --collect` on gate pass and uploads the staging directory contents as a GitHub Actions artifact using the `actions/upload-artifact` action.

3. A corresponding step that posts a summary comment to the associated GitHub issue (or PR) linking to the uploaded artifact. The comment includes the feature name, gate result, and a direct link to the CI run's artifact download. Issue/PR identification uses the PR number from the GitHub Actions event context, which is already available in the workflow.

4. Consumer opt-in and CI platform configuration via `context.yml` under an `audit:` block:
   ```yaml
   audit:
     ci_attachment: true          # default false — opt-in
     ci_platform: github-actions  # github-actions | gitlab-ci | azure-devops | jenkins | circleci
     artifact_retention_days: 90  # optional, platform default if absent
   ```
   The upload and comment steps are skipped when `ci_attachment` is `false` or absent. The `ci_platform` field selects which adapter is used for upload and comment; defaults to `github-actions` when absent. Each platform adapter is a thin wrapper around the platform's native artifact upload API/CLI, implementing a common `upload(stagingDir, runId)` and `postComment(issueRef, summaryLink)` interface defined in `trace-report.js`.

5. Feature identification from `pipeline-state.json`: the `--collect` flag inherits the same feature resolution logic already in `trace-report.js` (walk `features[]`, match by `prStatus` and PR number from environment variable). No new feature-identification mechanism is designed.

6. Platform adapter architecture: `trace-report.js` exposes the collection logic (`--collect` flag) as CI-platform-agnostic. A thin adapter layer handles platform-specific upload and comment steps. The MVP ships with the `github-actions` adapter. Additional adapters (GitLab CI, Azure DevOps Pipelines, Jenkins, CircleCI) are structured as additive platform adapter files that any consumer can contribute following the interface contract. No existing adapter is modified when a new one is added.

## Out of Scope

- **Non-git consumer distribution (WS0.4):** This story does not deliver a distribution mechanism for Teams bots, Foundry deployments, or Confluence integrations. Those depend on Spike D output. WS0.6 uploads to a CI artifact store — the MVP ships the GitHub Actions adapter, with the adapter interface designed for extension to other CI platforms. It is not a non-git channel.

- **Automated issue-tracker ticket creation or Jira integration:** The comment is posted to the GitHub PR or issue associated with the CI run. No integration with external project management tools (Jira, ServiceNow, Azure DevOps) is in scope. External tool integration is a consumer responsibility using the artifact download link.

- **Long-term artefact retention beyond the CI platform's default retention window:** GitHub Actions artifacts have a configurable retention period (default 90 days). This story does not build a separate long-term storage layer (S3, Azure Blob, etc.). Teams needing permanent evidence retention configure the GitHub artifact retention setting or handle archival separately.

- **Verbatim instruction assembly record (G19):** WS0.6 attaches artefact files as they exist in the repository at gate time. It does not capture or attach the verbatim assembled instruction text sent to the model. That is an intentionally deferred item (Phase 6 WS9 scope per product/constraints.md).

- **Artefact diff or change-detection between CI runs:** The upload is a snapshot of the current artefact chain. No delta comparison with previous uploads is in scope.

- **Automated story identification from commit messages:** Feature resolution uses `pipeline-state.json` (existing mechanism). Commit message parsing for story identification (Spike C5 second sub-question) is out of scope — it is a Spike C5 design item that may inform a later story.

## Assumptions and Risks

**A1 — `actions/upload-artifact` is available in the consumer's GitHub Actions environment.** If consumers use a self-hosted GitHub Enterprise runner environment with a restricted action allow-list, `actions/upload-artifact` may not be permitted. Mitigation: the `ci_attachment` flag defaults to `false` and is explicitly opt-in; consumers on restricted environments simply leave it off. No breakage for existing consumers.

**A2 — The assurance gate already resolves the governing feature from `pipeline-state.json` reliably.** `trace-report.js` currently resolves features by walking `features[]`. If a PR touches multiple features (Spike C5 first sub-question), the `--collect` step uses the same resolution — collecting the first matched feature. Multi-feature PRs are rare at current scale but not impossible. This assumption is valid for single-feature PRs (the overwhelming majority). A future story can address multi-feature collection.

**A3 — File names in the staging directory do not need to be localised or configurable in the MVP.** The `00-summary.md` through `07-trace.jsonl` sequence is hardcoded in the MVP. Consumer-configurable naming is out of scope.

**A4 — The GitHub Actions artifact download link is stable for the artifact retention period.** The posted comment link depends on GitHub Actions artifact URL format. If GitHub changes the URL format, the link breaks. This is acceptable — the artefacts are still in the repository; the link is a convenience, not the primary evidence store.

**Risk R1 — Storage cost at fleet scale.** ~100 KB per feature at current sizes. At 50 teams, 10 features/team/year: ~50 MB/year of artifact storage. GitHub free tier and most paid tiers include several GB of artifact storage. Not a material risk at expected scale.

**Risk R2 — Spike C5 multi-feature resolution ambiguity.** If a PR legitimately spans two features, the `--collect` step will collect only the first resolved feature. A second-line reviewer could miss the second feature's chain. Mitigation: this is out of scope for the MVP and explicitly flagged in the Assumptions. The PR description and commit trail remain available as a supplement.

## Directional Success Indicators

- A non-technical stakeholder (product manager or auditor) who is given a link to a merged PR's CI run can access the full artefact chain — discovery through DoD — without any git access or tooling, in two clicks or fewer, regardless of whether the team uses GitHub Actions, GitLab CI, or Azure DevOps Pipelines.
- Tech leads can share a stable artifact download link in a Slack message or email after a gate pass, without managing repository access permissions.
- The second-line risk reviewer verifying Theme F organisational independence can download the evidence package from the CI platform (GitHub Actions) — a platform that is outside the delivery team's repository write boundary — and confirm chain integrity from that download alone.
- No existing consumer is broken by the addition of the `--collect` flag or the new CI step (the flag is opt-in; the new step is skipped when `ci_attachment` is false).

## Constraints

- **C11 (no persistent agent runtime):** Collection and upload run as standard GitHub Actions steps. No persistent hosted service is introduced. `trace-report.js` is already a zero-dependency Node script; the `--collect` extension follows the same pattern.
- **C1 (update channel not severed):** The new CI step is additive — it does not change the existing assurance gate logic or `trace-report.js` core behaviour. Existing consumers who do not set `ci_attachment: true` see no change.
- **Tech stack constraint:** `trace-report.js` is the only permitted file-walking mechanism for the artefact chain. No new file-discovery script is introduced — the `--collect` flag extends the existing script.
- **Dependency on WS0 track order:** WS0.6 can proceed without WS0.1–WS0.5 (distribution versioning and lockfile). WS0.6 is ADDITIVE and has no dependency on the lockfile model. It can be delivered in parallel with WS0.1–WS0.5 or independently.
- **GitHub Actions adapter ships in MVP; other adapters are additive:** The collection logic (`--collect`) is CI-platform-agnostic. The MVP ships the `github-actions` adapter. Other adapters (`gitlab-ci`, `azure-devops`, `jenkins`, `circleci`) are out of scope for the MVP implementation but are in scope as community or follow-on contributions following the defined adapter interface. Any platform configuration is expressed through `context.yml` `audit.ci_platform` — no workflow file changes are needed to switch platforms.

---

**Next step:** Human review and approval → /benefit-metric
