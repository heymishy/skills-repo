## Contract Proposal — Wire the agent-driven mode into CI against real staging

**What will be built:**
A new CI job in `.github/workflows/e2e.yml` (e.g. `rubber-duck-review-staging`), matching the established `scenario-a-staging-e2e`/`scenario-b-staging-e2e` shape exactly: same opt-in flag pattern in `context.yml`, same `E2E_STAGING_*` secrets, same `mgar-s1` force-on step before any real LLM call, same `deploy-group` concurrency guard, same `timeout-minutes: 10` budget. Runs Story 3's validated agent-driven mechanism against a small, explicitly-named curated set of real staging scenarios.

**What will NOT be built:**
Expansion of the curated scenario set beyond the initial small list. Automatic story/PR creation from findings. The human-narrated mode.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Workflow-structure integration test + manual real-CI-run confirmation post-merge | Integration + Manual |
| AC2 | Unit test on secrets/identity reuse | Unit |
| AC3 | Unit test on step ordering (force-on before review) | Unit |
| AC4 | Unit test on findings-output destination | Unit |
| AC5 | Unit test on opt-in flag gating | Unit |

**Assumptions:**
- Story 3's agent-driven mechanism is available and its AC3 minimum detection rate is confirmed met by the time this story is implemented (per the Dependencies block).
- The curated scenario set for the initial version is the same landing-page hero features already used as `rdrc-s3`'s own fixtures (`gtcl-s1`/`lcdf-s1` areas), extendable later — not a blocking decision for this story's own scope.

**Estimated touch points:**
Files: `.github/workflows/e2e.yml` (new job), `.github/context.yml` (new opt-in flag), `tests/check-rdrc-s4-*.js` (new). Services: real wuce-staging, the existing `e2e-test-admin` identity, `mgar-s1`'s force-on script.

---

## Contract review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs. All concrete infrastructure claims in this story (job names, secret names, timeout value, force-on step) were independently verified against the real `.github/workflows/e2e.yml` at review time — not assumed.
