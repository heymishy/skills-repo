# DoR Contract Proposal: Bounded production-log scan with pattern-match notification

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s4-bounded-production-log-scan.md
**Date:** 2026-11-09

---

**What will be built:**
A new script `scripts/production-log-scan.js` (named in the epic's program-design canvas) that invokes `flyctl logs --since <window>` (window bounded hours-to-a-day), scans output against a static known-error-pattern list (including `tenant_admin_bootstrap_failed`), and calls `coha-s1`'s adapter exactly once on a match with timestamp/pattern/excerpt context. A new scheduled GitHub Actions workflow (`schedule:` cron trigger) invoking this script and exiting — never a standing process.

**What will NOT be built:**
Any remediation or auto-fix action. A configurable/extensible pattern-definition UI. Any observability vendor integration beyond `flyctl logs`.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test on the scan invocation and bounded-window parameter; integration test confirming clean process exit, no lingering handle | unit / integration |
| AC2 | Unit tests for pattern detection and notification content; integration test via the real adapter path on the known-bad fixture | unit / integration |
| AC3 | Unit test asserting zero notifications and clean exit on a no-match fixture | unit |
| AC4 | Manual verification scenario — real-world first-occurrence event, per the story's own benefit-metric.md baseline deferral; the diff-recording arithmetic itself is unit-tested with synthetic timestamps | manual (gap, acknowledged) |

**Assumptions:**
`flyctl` CLI is available in the CI runner environment (GitHub Actions) or a CLI-contract-faithful test double is used where it isn't. `FLY_API_TOKEN` is added to GitHub Actions repo secrets by the operator before this story's PR merges.

**Estimated touch points:**
Files: `scripts/production-log-scan.js` (new), one new scheduled GitHub Actions workflow file (TBD exact name at implementation-plan time, e.g. `.github/workflows/production-log-scan.yml`). Services: Fly.io (via `flyctl` CLI, logs-read scope if supported). APIs: Fly.io logs API (via CLI), no direct HTTP call from this story's own code beyond what `flyctl` performs internally.
