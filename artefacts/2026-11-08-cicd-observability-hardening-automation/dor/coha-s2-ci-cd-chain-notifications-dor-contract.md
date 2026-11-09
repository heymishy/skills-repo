# DoR Contract Proposal: CI/CD chain notifications (announce, status, auto-retry visibility)

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s2-ci-cd-chain-notifications.md
**Date:** 2026-11-09

---

**What will be built:**
A new shared module, `scripts/ci-chain-notify.js`, exporting three testable functions — `sendPatchAnnounce(commitInfo)`, `sendStatusNotification(outcome)`, `sendRetryNotification(evictionContext)` — each calling `coha-s1`'s `sendTeamsNotification`. Wired into `staging-deploy.yml` (announce before deploy, status at completion), `e2e.yml` (status at completion), and `deploy-group-auto-rerun.yml` (retry visibility, called only inside the existing `if: github.event.workflow_run.conclusion == 'cancelled'` gate, downstream of the existing, unmodified `isDeployGroupEviction()` call).

**What will NOT be built:**
Any change to `isDeployGroupEviction()`'s own decision logic — this story only adds a notification call downstream of its existing, unmodified result. Notification on PR-branch (non-master) CI runs.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test invoking `sendPatchAnnounce` directly; integration test simulating the merge-to-master trigger through to the mock webhook listener | unit / integration |
| AC2 | Unit tests for success and failure outcomes, asserting exactly one adapter call each; integration test confirming no double-fire across `staging-deploy.yml`/`e2e.yml`'s shared hook | unit / integration |
| AC3 | Unit test with a real `isDeployGroupEviction()`-shaped fixture (eviction=true); integration test running the real decision function end-to-end | unit / integration |
| AC4 | Unit test with eviction=false fixture, asserting zero adapter calls; integration test confirming the same via the real decision function | unit / integration |

**Assumptions:**
The exact filename `scripts/ci-chain-notify.js` is this contract's proposal, not fixed by the story itself — the story describes "the announce step's logic"/"the status-notification logic"/"the retry-notification logic" as independently testable units, which implies a shared module rather than inline YAML scripting, but the story does not pin an exact path. Assumed: `coha-s1` is merged (or at minimum its adapter module exists on the branch this story builds from) before this story's implementation begins, per the Dependencies block.

**Estimated touch points:**
Files: `scripts/ci-chain-notify.js` (new), `.github/workflows/staging-deploy.yml`, `.github/workflows/e2e.yml`, `.github/workflows/deploy-group-auto-rerun.yml` (wiring calls added, no change to existing trigger/gate logic). Services: none. APIs: none directly — calls through `coha-s1`'s adapter only.
