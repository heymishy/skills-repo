# Decisions: Deploy Config Safety Net

## RESOLVED — hardcoded flags in a wrapper script, not a documented convention (2026-07-25)

**Context:** The recurring incident (twice on 2026-07-24) was caused by a human/agent running a bare `flyctl deploy --app wuce-staging` from memory, without `--config fly.staging.toml`. Documentation alone (CLAUDE.md's own earlier note "any manual flyctl deploy MUST include --config fly.staging.toml") had already been tried and had already failed to prevent the second occurrence.
**Decision:** `scripts/deploy-staging.js` hardcodes the correct flags with no CLI arg or env var override -- the mistake becomes structurally impossible once this is the path used, rather than relying on remembering documentation correctly every time.
**Rationale:** A documented convention that already failed once should not be trusted to hold on its own a second time; removing the choice entirely is more robust than a stronger reminder.
**Accepted by:** Hamish King, Founder/Operator, 2026-07-25.

## RESOLVED — post-deploy verification lives in the same script as the deploy itself (2026-07-25)

**Context:** Both incidents were only caught by a human noticing anomalous Anthropic API-call warnings in live logs, up to ~1h18m after the bad deploy.
**Decision:** `deployAndVerify()` runs `flyctl config show` immediately after a successful deploy and asserts `MOCK_LLM_GATEWAY === "true"` in the same function call -- not a separate, optional, or manually-triggered check.
**Rationale:** A safety check that isn't part of the deploy path itself will eventually be skipped under time pressure. Bundling it into the one command everyone (CI and manual) already has to run makes the check unavoidable.
**Accepted by:** Hamish King, Founder/Operator, 2026-07-25.
