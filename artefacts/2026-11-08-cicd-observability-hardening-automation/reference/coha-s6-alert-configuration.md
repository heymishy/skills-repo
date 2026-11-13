# coha-s6 alert configuration (read back from PostHog)

**Story:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s6-alert-to-github-issue-bridge.md
**Evidence for:** AC1 (repository scope) and AC2 (stored alert shape); checks T1 and T2 of the test plan.
**Read back:** 2026-11-13, from PostHog project 10908 through `integrations-list`, `integrations-github-repos-retrieve` and `error-tracking-alerts-list` (not from the creation response).

This file holds no credential. The PostHog integration id below is PostHog's own row id for the GitHub connection, not a GitHub installation id and not a token.

## T1 — GitHub integration (AC1)

| Field | Observed |
|-------|----------|
| Integration count on the project | 1 (kind `github`, PostHog integration id 428805, display name `heymishy`, no errors reported) |
| Repositories it can reach | exactly one: `heymishy/skills-repo` (`total: 1`, `has_more: false`) |
| Permissions on GitHub's installation page | STATED by the operator, not observed by the agent: read on metadata; read and write on actions, checks, code, commit statuses, issues, pull requests, repository hooks and workflows. Broader than the issue write the story first required; accepted as a RISK-ACCEPT in `decisions.md` on 2026-11-13. |

Result: repository scope is correct; the permission half of AC1 is recorded as accepted risk, not as satisfied.

## T2 — Stored alert (AC2)

| Field | Observed |
|-------|----------|
| Alert id | `01a1d39d-861d-0000-eba6-eb88e9db9449` |
| Name | coha-s6: open GitHub issue for new production error issue |
| Type | `internal_destination` |
| Template | `template-github` |
| Enabled | yes |
| Trigger events | exactly one: `$error_tracking_issue_created` (not `$error_tracking_issue_reopened`, not `$error_tracking_issue_spiking`) |
| Filter | one property filter on the event: `environment` equals `production` (operator `exact`) |
| Destination repository | `skills-repo` under the account of the integration above (`heymishy`) |
| Title input | template default: exception type, a colon and the exception message, newlines replaced with spaces, cut to 120 characters |
| Description input | template default: the exception message in a code block, plus browser, OS, release and session-replay lines only if those properties exist (a server error has none) |
| Created | 2026-11-13 |

Template behaviour read from its source on 2026-11-13, relevant to what an issue contains: the body is the description, then up to 5 in-app resolved stack frames each shown as a file base name (extension allow-listed, otherwise `[redacted]`), a line number and a function name (`[redacted]` if it does not match a plain-identifier pattern or looks like a secret), then a "View in PostHog" link. It applies no label.

Result: matches AC2.

## Not yet verified (belongs to later checks)

- That the `environment` property filter actually keeps staging events out (AC5, T5).
- That the template's issue has the expected shape and author (AC3, T3).
- That no tenant text reaches an issue (AC4, T4, if needed).
- That a real production error opens exactly one issue (AC6, T6, deferred).
