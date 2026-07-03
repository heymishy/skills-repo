# Definition of Ready: pla-s1 — Extend posthog-server.js with identify, groupIdentify, captureException, and $groups support

**Date:** 2026-07-04
**Outcome:** PROCEED
**Oversight:** Low
**Signed by:** Hamish King — Platform operator / product owner — 2026-07-04

---

## Artefact references

| Artefact | Path |
|----------|------|
| Story | artefacts/2026-07-04-posthog-llm-analytics/stories/pla-s1.md |
| Review | artefacts/2026-07-04-posthog-llm-analytics/review/pla-s1-review-1.md |
| Test plan | artefacts/2026-07-04-posthog-llm-analytics/test-plans/pla-s1-test-plan.md |
| Verification script | artefacts/2026-07-04-posthog-llm-analytics/verification-scripts/pla-s1-verification.md |
| DoR contract | artefacts/2026-07-04-posthog-llm-analytics/dor/pla-s1-dor-contract.md |
| NFR profile | artefacts/2026-07-04-posthog-llm-analytics/nfr-profile.md |

---

## Hard block results

| # | Check | Result |
|---|-------|--------|
| H1 | User story As/Want/So + named persona | ✅ PASS |
| H2 | ≥3 ACs in Given/When/Then | ✅ PASS |
| H3 | Every AC has ≥1 test | ✅ PASS |
| H4 | Out-of-scope populated | ✅ PASS |
| H5 | Benefit linkage references named metric | ✅ PASS — M1, M4 |
| H6 | Complexity rated | ✅ PASS — Rating 1, Stable |
| H7 | No unresolved HIGH findings | ✅ PASS — 0 HIGH |
| H8 | No uncovered ACs in test plan | ✅ PASS — 7/7 covered |
| H8-ext | Cross-story schema dependency | ✅ PASS — N/A (no upstream deps) |
| H9 | Architecture Constraints populated | ✅ PASS — ADR-011, zero npm, CommonJS, hand-rolled HTTP, PRIVACY_MODE env |
| H-E2E | No CSS-layout-dependent ACs | ✅ PASS — N/A |
| H-NFR | NFR profile exists | ✅ PASS |
| H-NFR2 | No compliance NFR with regulatory clause | ✅ PASS — not regulated |
| H-NFR3 | Data classification not blank | ✅ PASS — Internal |
| H-NFR-profile | NFR profile present (story has NFR section) | ✅ PASS |
| H-GOV | Discovery Approved By has ≥1 named non-engineering entry | ✅ PASS — Hamish King (Platform operator / product owner) |
| H-ADAPTER | No injectable adapters introduced | ✅ PASS — N/A |
| H-INF | No hasInfraTrack | ✅ PASS — skip |
| H-MIG | No hasMigrationTrack | ✅ PASS — skip |

**All 19 hard blocks passed.**

---

## Warnings

| # | Warning | Disposition |
|---|---------|-------------|
| W3 | MEDIUM finding 1-M1 (AC "When" clause) | Resolved at test-plan time — all test cases use explicit When-trigger structure. No RISK-ACCEPT needed. |
| W4 | Verification script reviewed by domain expert | Acknowledged — solo-operator repo; Hamish King is both operator and domain expert. Self-verified. |

---

## Coding Agent Instructions

**Story:** pla-s1 — Extend posthog-server.js with identify, groupIdentify, captureException, and $groups support
**Feature slug:** 2026-07-04-posthog-llm-analytics
**Upstream dependency:** None — implement immediately.

### What to implement

Modify `src/web-ui/modules/posthog-server.js` only. Do not touch any route, server, or test files other than the ones specified below.

**1. Add `identify(distinctId, props)` function**

Follow the identical structure to the existing `capture()` function:
- Check `process.env.POSTHOG_KEY` — if absent, return immediately (no-op)
- Build JSON body: `{ api_key: key, event: '$identify', distinct_id: distinctId, properties: Object.assign({ $lib: 'posthog-node-manual' }, props || {}) }`
- Note: the `$set` key is passed by the caller inside `props` — do not wrap it again
- Fire HTTPS POST to `us.i.posthog.com /capture/` with `req.on('error', function() {})`
- Export as `module.exports.identify`

**2. Add `groupIdentify(groupType, groupKey, groupProps)` function**

- Same no-op guard on POSTHOG_KEY
- Body: `{ api_key: key, event: '$groupidentify', distinct_id: groupType + '_' + groupKey, properties: { $lib: 'posthog-node-manual', $group_type: groupType, $group_key: groupKey, $group_set: groupProps || {} } }`
- Same fire-and-forget HTTPS POST
- Export as `module.exports.groupIdentify`

**3. Add `captureException(err, distinctId, extraProps)` function**

- Same no-op guard on POSTHOG_KEY
- Body properties: `{ $lib: 'posthog-node-manual', $exception_type: (err && err.constructor && err.constructor.name) || 'Error', $exception_message: (err && err.message) || String(err), $exception_stack_trace_raw: (err && err.stack) || '' }` merged with `extraProps || {}`
- Event name: `'$exception'`, distinct_id: `distinctId`
- Same fire-and-forget HTTPS POST
- Export as `module.exports.captureException`

**4. Update `capture(distinctId, event, properties, groups)` — add optional 4th param**

- Signature change: `function capture(distinctId, event, properties, groups) {`
- When building the body `properties` object, add: `if (groups) { merged.$groups = groups; }` — only when `groups` argument is truthy
- Must not mutate the `properties` argument passed in — use `Object.assign({}, ...)` or equivalent
- Backward compatibility: callers passing 3 args must produce identical output to before

**5. Add `PRIVACY_MODE` constant**

At the top of the module (after `'use strict'`):
```js
var PRIVACY_MODE = process.env.POSTHOG_PRIVACY_MODE === 'true';
```
Add to `module.exports`: `module.exports.PRIVACY_MODE = PRIVACY_MODE;`

**6. Update `module.exports`**

```js
module.exports = { capture, identify, groupIdentify, captureException, PRIVACY_MODE };
```

### Test file to create

Create `tests/check-pla-s1-posthog-module.js` following the test plan at `artefacts/2026-07-04-posthog-llm-analytics/test-plans/pla-s1-test-plan.md`.

Use the standard `test()` harness pattern from this repo (see `tests/check-arl-s3-admin-credits.js` as a reference for the harness structure, mock injection pattern, and pass/fail output format).

Add to `package.json` `scripts.test`: append `&& node tests/check-pla-s1-posthog-module.js` to the end of the `test` string.

### Constraints

- **Zero new npm dependencies.** No require statements for packages not already in `package.json`.
- **CommonJS only.** Use `var`/`function` and `require()` — no `import`, no `const` at module boundary.
- **Hand-rolled HTTP only.** All new methods use Node.js built-in `https` module exactly as `capture()` does.
- **No mutation of input arguments.** The `properties` and `extraProps` objects passed in must not be modified.
- **No throws in production.** All methods must catch/swallow errors — the `req.on('error', function() {})` pattern is the standard.
- **Conflict marker scan.** After any merge or rebase, run `grep -n "<<<\|===\|>>>" src/web-ui/modules/posthog-server.js` before staging.

### Verification

After implementation, run:

```bash
node tests/check-pla-s1-posthog-module.js
```

All 16 tests must print `[PASS]`. Then run the full suite:

```bash
npm test
```

No regressions in existing tests. The `check-pla-s1-posthog-module.js` test must be the last file added to the test chain in `package.json`.

After passing: run `/verify-completion` to walk through the AC verification script before opening the PR.
