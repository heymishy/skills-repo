# Definition of Ready: pla-s2 — Emit $ai_generation events after Anthropic calls and wire identity and group analytics

**Date:** 2026-07-04
**Outcome:** PROCEED (after pla-s1 is DoD-complete)
**Oversight:** Low
**Signed by:** Hamish King — Platform operator / product owner — 2026-07-04

---

## Artefact references

| Artefact | Path |
|----------|------|
| Story | artefacts/2026-07-04-posthog-llm-analytics/stories/pla-s2.md |
| Review | artefacts/2026-07-04-posthog-llm-analytics/review/pla-s2-review-1.md |
| Test plan | artefacts/2026-07-04-posthog-llm-analytics/test-plans/pla-s2-test-plan.md |
| Verification script | artefacts/2026-07-04-posthog-llm-analytics/verification-scripts/pla-s2-verification.md |
| DoR contract | artefacts/2026-07-04-posthog-llm-analytics/dor/pla-s2-dor-contract.md |
| NFR profile | artefacts/2026-07-04-posthog-llm-analytics/nfr-profile.md |

---

## Hard block results

| # | Check | Result |
|---|-------|--------|
| H1 | User story As/Want/So + named persona | ✅ PASS |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS — 8 ACs |
| H3 | Every AC has ≥1 test | ✅ PASS — all 8 ACs covered |
| H4 | Out-of-scope populated | ✅ PASS — 6 explicit exclusions |
| H5 | Benefit linkage references named metric | ✅ PASS — M1, M2, M3, M4 |
| H6 | Complexity rated | ✅ PASS — Rating 2, Stable |
| H7 | No unresolved HIGH findings | ✅ PASS — 0 HIGH |
| H8 | No uncovered ACs in test plan | ✅ PASS — all 8 covered |
| H8-ext | Cross-story schema dependency | ✅ PASS — upstream story listed (pla-s1); dependency is code-level (module functions), not pipeline-state schema fields; schemaDepends: [] |
| H9 | Architecture Constraints populated | ✅ PASS — ADR-011, zero npm, CommonJS, req.session.login canonical, _computeCostUsd() authoritative, $ai_session_id strategy (Decision 2), pla-s1 dependency |
| H-E2E | No CSS-layout-dependent ACs | ✅ PASS — N/A |
| H-NFR | NFR profile exists | ✅ PASS |
| H-NFR2 | No compliance NFR with regulatory clause | ✅ PASS — not regulated |
| H-NFR3 | Data classification not blank | ✅ PASS — Internal |
| H-NFR-profile | NFR profile present | ✅ PASS |
| H-GOV | Discovery Approved By has ≥1 named non-engineering entry | ✅ PASS — Hamish King (Platform operator / product owner) |
| H-ADAPTER | No injectable adapters introduced in production code | ✅ PASS — posthog mock is test-only (require cache injection); no setX() functions added to production modules |
| H-INF | No hasInfraTrack | ✅ PASS — skip |
| H-MIG | No hasMigrationTrack | ✅ PASS — skip |

**All 19 hard blocks passed.**

---

## Warnings

| # | Warning | Disposition |
|---|---------|-------------|
| W3 | MEDIUM findings 1-M1, 1-M2, 1-M3 | Resolved at test-plan time: (a) all test cases use explicit When-trigger structure; (b) AC3/AC4 decomposed into 5/4 sub-groups; (c) AC8 split into 4 separate tests (G1–G4). No RISK-ACCEPT needed. |
| W4 | Verification script reviewed by domain expert | Acknowledged — solo-operator repo; Hamish King is both operator and domain expert. Self-verified. |

---

## Sequencing constraint

**pla-s2 MUST NOT begin implementation until pla-s1 is DoD-complete.** pla-s2 calls `posthog.identify()`, `posthog.groupIdentify()`, and the updated `posthog.capture()` with groups param — all of which are added by pla-s1. Coding agent: check that pla-s1 PR is merged before starting this story.

---

## Coding Agent Instructions

**Story:** pla-s2 — Emit $ai_generation events after Anthropic calls and wire identity and group analytics
**Feature slug:** 2026-07-04-posthog-llm-analytics
**Upstream dependency:** pla-s1 must be DoD-complete. Verify `posthog-server.js` exports `identify`, `groupIdentify`, `captureException`, `PRIVACY_MODE`, and updated `capture()` before writing any code.

### Pre-flight check

Before writing any code, run:
```bash
node -e "var p = require('./src/web-ui/modules/posthog-server'); console.log(Object.keys(p))"
```
Expected output includes: `capture, identify, groupIdentify, captureException, PRIVACY_MODE`

If any is missing, pla-s1 is not complete — do not start pla-s2.

### What to implement

**File 1: `src/modules/skill-turn-executor.js`**

Locate `_callAnthropic`. Currently it resolves with just `content` (the text string). Change the `resolve(content)` call to `resolve({ text: content, usage: { input_tokens: parsed.usage && parsed.usage.input_tokens || 0, output_tokens: parsed.usage && parsed.usage.output_tokens || 0, cache_read_tokens: parsed.usage && parsed.usage.cache_read_input_tokens || 0, cache_creation_tokens: parsed.usage && parsed.usage.cache_creation_input_tokens || 0, model: model } })`.

The caller (`skillTurnExecutor`) must be updated to extract `.text` from the resolved value when constructing its own return value.

**File 2: `src/web-ui/routes/skills.js` — streaming handler (`handlePostTurnStreamHtml`)**

After the streaming executor resolves (after `var result = await _phStream.capture...` area, around line 4141):

1. Add `$ai_trace_id: session.journeyId || sessionId` to the existing `skill_turn` capture call properties (AC2).

2. After the `skill_turn` capture, add a `$ai_generation` event:

```js
var _aiGenProps = {
  $ai_trace_id: session.journeyId || sessionId,
  $ai_span_id: require('crypto').randomUUID(),
  $ai_session_id: (req.session.login || sessionId) + '-' + (session.journeyId || sessionId),
  $ai_model: streamResult.usage && streamResult.usage.model || 'claude-sonnet-4.6',
  $ai_provider: 'anthropic',
  $ai_input_tokens: streamResult.usage && streamResult.usage.input_tokens || 0,
  $ai_output_tokens: streamResult.usage && streamResult.usage.output_tokens || 0,
  $ai_cache_read_input_tokens: streamResult.usage && streamResult.usage.cache_read_tokens || 0,
  $ai_cache_creation_input_tokens: streamResult.usage && streamResult.usage.cache_creation_tokens || 0,
  $ai_latency: (Date.now() - _streamStart) / 1000,
  $ai_time_to_first_token: _ttfb / 1000,
  $ai_stream: true,
  $ai_total_cost_usd: _computeCostUsd(streamResult.usage || {}),
  role: req.session.role || 'user'
};
if (!require('../modules/posthog-server').PRIVACY_MODE) {
  // $ai_input and $ai_output_choices are omitted by default unless content capture is explicitly enabled
  // (leave blank for now — they are optional PostHog fields)
}
_phStream.capture(req.session.login || sessionId, '$ai_generation', _aiGenProps, { company: req.session.tenantId });
```

Note on timing variables: `_streamStart` and `_ttfb` must be captured at the right points. `_streamStart = Date.now()` before the streaming executor call. `_ttfb` is set in the `onFirstChunk` callback.

**File 3: `src/web-ui/routes/skills.js` — non-streaming handler (`handlePostTurnHtml`)**

After the non-streaming executor resolves (around line 3679):

1. Extract `usage` from the resolved result (which is now `{ text, usage }` after the `_callAnthropic` change).
2. Add `$ai_generation` event — same as streaming but: no `$ai_time_to_first_token`, `$ai_stream: false`, token counts from `usage`.
3. Gate `PRIVACY_MODE` same as streaming path.

**File 4: `src/web-ui/routes/journey.js` — POST /api/journey handler**

After the journey is created and `req.session.login` is confirmed set (after existing `_posthog.capture(login, 'journey_created', ...)` call around line 353):

```js
if (req.session.login) {
  _posthog.identify(req.session.login, { $set: { login: req.session.login, tenantId: req.session.tenantId, role: req.session.role || 'user' } });
  _posthog.groupIdentify('company', req.session.tenantId, { name: req.session.tenantId });
}
```

**File 4 continued: all journey lifecycle `_posthog.capture()` calls**

Add the `groups` 4th argument to each existing `_posthog.capture()` call that emits `journey_created`, `stage_started`, `stage_completed`, `journey_completed`. Use `{ company: req.session.tenantId || (journey && journey.tenantId) }` as the groups argument, picking whichever source provides the tenantId at that call site.

Before changing each call, verify that `_posthog.capture()` is the updated version from pla-s1 (accepting 4th arg). Do not change the 3-arg call signature if posthog is an older version.

### Test file to create

Create `tests/check-pla-s2-posthog-wiring.js` following the test plan at `artefacts/2026-07-04-posthog-llm-analytics/test-plans/pla-s2-test-plan.md`.

Before writing: read `tests/check-wusl1-chat-streaming.js` and `tests/check-mfc1-model-first-chat-session.js` to identify existing `skill_turn` assertions and confirm the `$ai_trace_id` addition is purely additive (NFR-COMPAT / N3).

Add to `package.json` `scripts.test`: append `&& node tests/check-pla-s2-posthog-wiring.js` to the end of the `test` string.

### Constraints

- **Zero new npm dependencies.** No new require statements for packages not in `package.json`.
- **`_computeCostUsd()` is authoritative.** Do not compute cost inline. Call `_computeCostUsd(usage)` from `skills.js`. The usage object must have `model` and token count fields.
- **`req.session.login` is the canonical `distinct_id`.** All authenticated PostHog events use `req.session.login`. Fallback: `req.session.tenantId || req.session.userId || 'anonymous'`.
- **`$ai_session_id` = `login + '-' + journeyId`.** Do NOT use `tenantId` as `$ai_session_id` — see decisions.md Decision 2.
- **Fire-and-forget.** All PostHog calls must not be `await`ed. Errors must not propagate.
- **Conflict marker scan.** After any merge or rebase on all modified files, run: `grep -n "<<<\|===\|>>>" <file>` before staging.

### Verification

After implementation, run:

```bash
node tests/check-pla-s2-posthog-wiring.js
```

All 27 tests must print `[PASS]`. Then run the full suite:

```bash
npm test
```

No regressions in existing tests. Walk through the AC verification script (`artefacts/2026-07-04-posthog-llm-analytics/verification-scripts/pla-s2-verification.md`) before opening the PR.

After the PR merges, confirm in PostHog Live Events within 24 hours that `$ai_generation` events appear with `$ai_total_cost_usd` and `$groups.company` — per the M1 measurement method in the benefit-metric artefact.
