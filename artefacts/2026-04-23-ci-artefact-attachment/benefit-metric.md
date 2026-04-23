## Benefit Metric: CI-Native Artefact Attachment (WS0.6)

**Discovery reference:** `artefacts/2026-04-23-ci-artefact-attachment/discovery.md` (Approved 2026-04-23)
**Date defined:** 2026-04-23
**Metric owner:** Platform maintainer / tech lead (per consuming squad)

---

## Tier Classification

**⚠️ META-BENEFIT FLAG:** Yes

This initiative delivers user value (non-technical reviewers reach evidence without git access) and also validates a platform architecture hypothesis: that a CI-platform-agnostic adapter layer configured through `context.yml` is the correct extension model for cross-platform CI integrations. The adapter interface design is itself a learning deliverable.

---

## Tier 1: Product Metrics (User Value)

### Metric 1: Evidence reach without git access

| Field | Value |
|-------|-------|
| **What we measure** | Number of clicks required for a non-technical stakeholder (product manager, auditor, second-line risk reviewer) to download the full artefact chain from a gate-pass CI run, starting from a shared link (PR URL or CI run URL) — with no git access, no tooling installed |
| **Baseline** | Not yet established. Current state: requires git clone + file navigation or explicit engineer-sent file export. Estimated baseline: ≥ 5 manual steps, no self-service path. |
| **Target** | ≤ 2 clicks from a shared CI run URL or issue link to artifact download — no authentication beyond the CI platform's existing access controls required |
| **Minimum validation signal** | The artifact download link is reachable from the CI run summary page without navigating the repository file tree |
| **Measurement method** | Manual verification by the platform maintainer on the first gate-pass CI run after the feature ships. Confirmed by a non-engineer attempting the flow cold with no instruction beyond a shared CI run URL. Verified once at launch; re-checked if workflow structure changes. |
| **Feedback loop** | If the flow requires more than 2 clicks, review the CI run summary layout and the comment posting step. The comment text and link target are configurable without code changes; adjust and re-verify. |

---

### Metric 2: Zero breakage to existing consumers

| Field | Value |
|-------|-------|
| **What we measure** | Number of existing consumer CI runs that fail or change behaviour after the `--collect` flag and new workflow step are merged — when `ci_attachment` is absent or `false` |
| **Baseline** | 0 failures on existing consumers currently (all passing CI gates) |
| **Target** | 0 regressions: all existing consumers with `ci_attachment` absent or `false` see no change in CI run behaviour or outcome |
| **Minimum validation signal** | CI gate runs continue to pass on the platform repo (`npm test`, `validate-trace.sh --ci`) with no new failures introduced |
| **Measurement method** | `npm test` output before and after the PR merge; CI gate check on the platform repo itself. Checked as part of the standard test run on the implementation PR. |
| **Feedback loop** | Any failure in the standard test chain on the implementation PR is a blocking signal — do not merge until resolved. The `ci_attachment` opt-in default (`false`) is the primary safeguard. |

---

### Metric 3: CI-platform adapter extensibility validated

| Field | Value |
|-------|-------|
| **What we measure** | Whether the adapter interface defined in the MVP can accommodate a second CI platform (e.g. GitLab CI or Azure DevOps Pipelines) without modifying `trace-report.js` core collection logic — verified by implementing or sketching a second adapter against the interface contract |
| **Baseline** | No adapter interface exists today; all CI-specific logic would be inline in the workflow file |
| **Target** | A second platform adapter can be added by creating one new file and one new `context.yml` `ci_platform` entry, with no changes to `trace-report.js` or the assurance gate workflow core logic |
| **Minimum validation signal** | The adapter interface is documented in `trace-report.js` inline contract comments and at least one additional adapter stub (GitLab CI or Azure DevOps) is reviewed or contributed by a consumer within 60 days of feature ship |
| **Measurement method** | Interface contract review at DoD: confirm the GitHub Actions adapter was implemented against a declared interface, not as inline code. Stub contribution or review within 60 days is a post-ship signal recorded in the benefit metric evidence section. |
| **Feedback loop** | If no second adapter contribution or review occurs within 60 days, assess whether the interface contract is insufficiently documented or the demand is lower than expected. This is a learning signal, not a failure — the adapter pattern is still valid if consumers are GitHub-Actions-only. |

---

## Tier 2: Meta Metrics (Learning / Validation)

### Meta Metric 1: `context.yml` as the single configuration surface for CI integration

| Field | Value |
|-------|-------|
| **Hypothesis** | Consumers can fully configure CI artefact attachment behaviour — enable/disable, choose platform, set retention — through `context.yml` alone, without editing workflow YAML files or `trace-report.js` |
| **What we measure** | Whether a consumer can switch `ci_platform` from `github-actions` to `gitlab-ci` (when that adapter ships) purely by updating `context.yml`, with no changes to any other file |
| **Baseline** | No `context.yml`-driven CI integration exists today |
| **Target** | Platform switch requires only a `context.yml` edit — verified by the GitLab CI adapter stub test (or a simulated switch in the unit test suite) |
| **Minimum signal** | `context.yml` `audit.ci_platform` field is read and respected by the workflow invocation — confirmed in the test suite |
| **Measurement method** | Test coverage: a test case in the implementation PR's test file verifies that `ci_platform: github-actions` routes to the GitHub Actions adapter and that an unrecognised value fails gracefully with a clear error message. Manual verification that no workflow file edit is needed to change `ci_platform`. |

---

### Meta Metric 2: `trace-report.js --collect` as a zero-dependency artefact assembly mechanism

| Field | Value |
|-------|-------|
| **Hypothesis** | Extending `trace-report.js` with a `--collect` flag is the correct place to add artefact assembly — it remains a zero-external-dependency Node script after the extension |
| **What we measure** | Whether `trace-report.js --collect` introduces any npm dependency not already present (`package.json` diff) |
| **Baseline** | `trace-report.js` currently has zero external npm dependencies (reads files and walks pipeline-state.json) |
| **Target** | `trace-report.js --collect` introduces zero new npm dependencies — all file-walking and staging logic uses Node built-ins only |
| **Minimum signal** | `package.json` diff on the implementation PR shows no new production dependencies |
| **Measurement method** | `package.json` diff review on the implementation PR. Automated: CI test checks `require` statements in `trace-report.js` against the approved built-ins list. |

---

## Metric Coverage Matrix

<!-- Populated by the /definition skill after stories are created. -->

| Metric | Stories | Status |
|--------|---------|--------|
| M1 — Evidence reach without git access | TBD at /definition | Pending |
| M2 — Zero breakage to existing consumers | TBD at /definition | Pending |
| M3 — CI-platform adapter extensibility | TBD at /definition | Pending |
| MM1 — `context.yml` as single configuration surface | TBD at /definition | Pending |
| MM2 — `trace-report.js` zero-dependency constraint | TBD at /definition | Pending |

---

**Next step:** /definition — decompose into epics and stories
