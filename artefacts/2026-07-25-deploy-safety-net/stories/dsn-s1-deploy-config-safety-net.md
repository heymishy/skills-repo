## Story: A single deploy-to-staging entry point that can't silently use the wrong Fly config

**Short-track:** infra reliability fix -- a recurring incident (happened twice in one day, 2026-07-24) found via capture-log review.

## User Story

As **Hamish King (Founder/Operator)**,
I want **one single, correct way to deploy to `wuce-staging` that verifies its own result**,
So that **a bare `flyctl deploy` (missing `--config fly.staging.toml`) can never again silently overwrite staging with production's config, wasting real Anthropic API cost and breaking every E2E check until someone notices hours later**.

## Background / Investigation

Confirmed via `workspace/capture-log.md`: this exact incident happened twice on 2026-07-24, ~2.5 hours apart. Both times, a manual `flyctl deploy --app wuce-staging` (without `--config fly.staging.toml`) silently deployed using the root `fly.toml` (production config) instead, dropping `MOCK_LLM_GATEWAY=true` -- the flag that keeps staging's E2E specs from making real, billed Anthropic API calls. Both times, the only way this was caught was a human noticing "Unexpected Anthropic response format" warnings in the live server logs, up to ~1h18m after the bad deploy. `flyctl config show --app wuce-staging` was the manual diagnostic each time -- there is no automated check today that a deploy actually resulted in the intended config.

The GitHub Actions workflow (`staging-deploy.yml`) already correctly hardcodes `--config fly.staging.toml` -- the risk is specifically manual/ad hoc `flyctl deploy` invocations (by an operator or an agent) that bypass the workflow, which happens whenever `FLY_API_TOKEN` is broken (as it was for ~2 days) or whenever someone wants to deploy without waiting for CI.

## Architecture Constraints

- **One wrapper script, one source of truth.** Add `scripts/deploy-staging.js`, hardcoding `flyctl deploy --remote-only --config fly.staging.toml --app wuce-staging` -- the correct invocation can never be typed wrong once this exists, because nobody needs to type the flags again.
- **Verify after deploying, not just before.** After the deploy command succeeds, the script runs `flyctl config show --app wuce-staging --json` and asserts `MOCK_LLM_GATEWAY` is present with value `"true"` in the returned env block. If it's missing, the script prints a loud, actionable error and exits non-zero -- so a bad deploy is caught in seconds, not hours.
- **Update `staging-deploy.yml` to call this same script**, not a duplicated inline `flyctl deploy` command -- so CI and manual deploys share exactly one code path, and any future safety check added to the script protects both automatically.
- **Add a `package.json` script** (`"deploy:staging": "node scripts/deploy-staging.js"`) so the correct command is also the path of least resistance from the command line.
- **Do not touch `fly.toml`/`fly.staging.toml` themselves** -- this story is about the deploy *invocation*, not the config files' own content.

## Dependencies

- **Upstream:** None.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `scripts/deploy-staging.js` is run, When it executes, Then it invokes `flyctl deploy` with exactly `--remote-only --config fly.staging.toml --app wuce-staging` -- these flags are not configurable via CLI args or env vars (hardcoded, by design, so they can't be overridden into the wrong config either).

**AC2:** Given the deploy command succeeds, When the script then checks the live config, Then it calls `flyctl config show --app wuce-staging --json` (or equivalent) and asserts the returned env block contains `MOCK_LLM_GATEWAY: "true"`.

**AC3:** Given the post-deploy check finds `MOCK_LLM_GATEWAY` missing or not `"true"`, When the script evaluates this, Then it prints a clear, actionable error message (naming the exact problem and the exact fix) and exits with a non-zero status code.

**AC4:** Given the post-deploy check finds `MOCK_LLM_GATEWAY: "true"` present, When the script evaluates this, Then it prints a success confirmation and exits 0.

**AC5:** Given `.github/workflows/staging-deploy.yml`'s `deploy-staging` job, When it runs, Then it invokes `node scripts/deploy-staging.js` instead of a raw inline `flyctl deploy` command -- CI now exercises the exact same safety-checked path a manual deploy would use.

**AC6:** Given `package.json`, When inspected, Then it has a `"deploy:staging"` script running `node scripts/deploy-staging.js`.

## Out of Scope

- Any change to `fly.toml` or `fly.staging.toml`'s own content.
- Deploying to production (`skills-framework`) -- this script is staging-only; production deploys remain a separate, manually-gated process per `bri-s2.6`.
- Automatically rolling back a bad deploy -- the script only detects and reports; recovery (re-running with the correct config) is still a manual/CI-retriggered step.

## NFRs

- **Reliability:** This is the entire point of the story -- convert a silent, multi-hour-undetected config regression into an immediate, loud failure.
- **Simplicity:** No new dependencies -- `flyctl` is already a prerequisite for any staging deploy; the script just wraps two existing CLI invocations plus a JSON parse.

## Complexity Rating

**Rating:** 1 -- a thin wrapper script around two existing `flyctl` commands, plus updating one workflow line to call it.
**Scope stability:** Stable.
