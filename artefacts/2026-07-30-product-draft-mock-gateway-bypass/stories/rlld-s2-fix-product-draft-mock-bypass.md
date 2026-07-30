## Story: Fix generateProductDraft bypassing the mock LLM gateway on staging

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path)
**Discovery reference:** None — short-track skips discovery
**Benefit-metric reference:** None — short-track skips benefit-metric

## User Story

As the **Platform operator**,
I want **the real-LLM-call leak identified by rlld-s1's diagnostic logging to be actually fixed**,
So that **the @mocked staging-deploy smoke test passes reliably and `promote-to-prod` can run again**.

## Background / Investigation

rlld-s1's diagnostic logging (merged, PR #641) revealed the exact leak on the very next staging-deploy run: `handlePostProductNew` (`routes/products.js:924`) calls `generateProductDraft` (`adapters/product-draft.js`), whose wired implementation (`server.js`, `psh-s3` D37 wiring, ~line 862) checked only whether `process.env.ANTHROPIC_API_KEY` was set — never `mockLlmGateway.isMockGatewayEnabled()`, unlike every skill-turn code path in this codebase. On `wuce-staging`, both `MOCK_LLM_GATEWAY=true` and a real `ANTHROPIC_API_KEY` are configured, so every product creation (including every `@mocked` E2E spec that creates a product — `bri-s3.2`, `bri-s3.3`, `bri-s3.4`, etc.) made a genuine, unconditional call to `api.anthropic.com`, incrementing the real-LLM-call counter every time. This is the leak `rlcc-s1` (2026-07-25) first documented and explicitly deferred finding.

A second wiring of the same adapter exists (`server.js` ~line 1405, "bri-s3.2: wire the real generateProductDraft adapter too") that always returns a blank draft with zero network calls — but that wiring only takes effect inside the local Playwright harness's own `webServer` startup path, never on a real deployed Fly app like `wuce-staging`. The first (buggy) wiring is unconditional and is the only one ever registered on real staging.

## Architecture Constraints

- Mirrors the existing, established pattern used by every skill-turn code path in this codebase (`skill-turn-executor.js`'s `if (meta.stage && isMockGatewayEnabled())`): check the mock gateway first, before any real-provider branch.
- No new mock-gateway fixture file needed — `generateProductDraft` is not a skill-turn (no `stage` concept), so a simple inline canned response is used when mocked, rather than routing through `mock-llm-gateway.js`'s stage/fixture-file system.
- Removes rlld-s1's temporary diagnostic logging (`console.warn` in the `https.request` wrapper) now that the real source is found and fixed, per that story's own stated intent.

## Dependencies

- **Upstream:** rlld-s1 (merged) — this fix was only possible once its diagnostic logging revealed the exact call site.
- **Downstream:** None. Should unblock `promote-to-prod` on the next staging-deploy run.

## Acceptance Criteria

**AC1:** Given `mockLlmGateway.isMockGatewayEnabled()` returns true, When `generateProductDraft` (the wired `server.js` implementation) is called, Then it returns a deterministic mock draft object (`mission`/`roadmap`/`techStack`/`constraints`/`architectureGuardrails`) without ever calling `https.request` to `api.anthropic.com`.

**AC2:** Given `mockLlmGateway.isMockGatewayEnabled()` returns false and `ANTHROPIC_API_KEY` is set, When `generateProductDraft` is called, Then it behaves exactly as before this fix — real call to `api.anthropic.com`, parses the response, returns the drafted sections.

**AC3:** Given `mockLlmGateway.isMockGatewayEnabled()` returns false and `ANTHROPIC_API_KEY` is not set, When `generateProductDraft` is called, Then it returns the existing blank-draft fallback, unchanged from before this fix.

**AC4 (regression guard):** Given rlld-s1's temporary diagnostic logging is removed, When the `https.request` wrapper is inspected, Then it still increments `_realLlmCallCount` on a real-provider hostname match (the counter itself is unaffected) — only the `console.warn` diagnostic line is removed.

## Out of Scope

- The always-safe local-harness wiring (`server.js` ~line 1405) — already correct, not touched.
- Any change to `mock-llm-gateway.js`'s stage/fixture-file system — not needed for this non-skill-turn adapter.
- Investigating whether other, similar adapters in this codebase have the same "checks only for an API key, never the mock gateway" gap — a natural follow-up audit, not scoped here given time already invested in this specific, confirmed leak.

## NFRs

- **Performance:** Not applicable — same call shape as before, just gated correctly.
- **Security:** No new surface — the mock branch returns static, non-sensitive placeholder text.
- **Accessibility:** Not applicable.
- **Audit:** No change to audit logging for product creation.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
