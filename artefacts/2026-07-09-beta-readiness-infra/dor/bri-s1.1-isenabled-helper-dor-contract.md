# Contract Proposal: Build the isEnabled() flag helper shared by API and UI

**Story reference:** artefacts/2026-07-09-beta-readiness-infra/stories/bri-s1.1-isenabled-helper.md
**Test plan reference:** artefacts/2026-07-09-beta-readiness-infra/test-plans/bri-s1.1-isenabled-helper-test-plan.md

---

## What will be built

- New module `src/web-ui/modules/posthog-flags.js` exporting:
  - `isEnabled(flagKey, context)` — async function. Calls the wired adapter's `evaluateFlag(flagKey, context)`, strips any token-shaped fields (e.g. `accessToken`) from `context` before forwarding it to the adapter, and returns the resolved boolean. If the adapter call throws or rejects (network error, timeout), the function catches this and resolves the documented safe default `false` — it never lets the rejection propagate to the caller.
  - `setPostHogFlagsAdapter(adapterImpl)` — the D37 injectable setter used to wire a real implementation (e.g. a thin wrapper around the `posthog-node` client) in `server.js`.
  - A default stub adapter, active until `setPostHogFlagsAdapter()` is called, whose `evaluateFlag` throws exactly: `Adapter not wired: posthogFlagsAdapter. Call setPostHogFlagsAdapter() before use.`
- A single shared module instance required identically from both route-handler call sites and UI-rendering call sites — no per-call-site copy.

## What will NOT be built (scope boundary)

- Caching/memoization of flag state across requests — each call reaches the adapter directly (or relies on the adapter's own SDK-level caching); a custom cache layer is out of scope per the story.
- Percentage-based or multivariate flag values — `isEnabled()` returns boolean state only.
- The real `posthog-node` client construction and wiring into `server.js` — per D37, this is a separate wiring task from this handler's implementation, not part of this story's build (see H-ADAPTER note below).
- Any environment-based (staging/prod) key selection (S1.2), tenant/group targeting (S1.4), or session-bootstrap integration (S1.3) — this story delivers only the shared primitive those stories build on.

## AC → test-approach table

| AC | Description | Test approach |
|----|--------------|----------------|
| AC1 | Returns `true` when adapter resolves `true` | Unit — 2 tests (true case + false-case guard against hardcoded truthy return) |
| AC2 | Throws documented D37 error when adapter unwired | Unit — 1 test, exact error message match |
| AC3 | Route call site and UI-render call site return identical result from the same implementation | Integration — 1 test, asserts same exported function reference across two `require()` call sites |
| AC4 | Adapter failure resolves safe default `false`, does not throw | Unit — 1 test, adapter rejection → resolved `false`, no unhandled rejection |

Plus one unit test and one NFR test covering the Security NFR (no token-shaped fields forwarded to the adapter) and one NFR test covering the 200ms performance budget.

## Assumptions

- Adapter interface shape is `{ evaluateFlag: async (flagKey, context) => boolean }` — this is what the test plan's mocks assume, and what the real `server.js` wiring (separate task) must conform to.
- Token-field stripping is implemented inside the helper itself (rather than relying purely on caller discipline), since that is the only way to guarantee the observable "no token reaches the adapter" contract regardless of what a caller passes.
- Module uses CommonJS (`require`/`module.exports`), consistent with existing `src/web-ui/` conventions.
- `posthog-node` is added as a new npm dependency — permitted per discovery.md's Constraints relaxation for web-ui work.

## Estimated touch points

- New: `src/web-ui/modules/posthog-flags.js`
- New: `tests/check-bri-s1.1-isenabled-helper.js`
- `package.json` / `package-lock.json` — add `posthog-node`
- No changes to `server.js` in this story — the real client wiring is a separate D37 task (see DoR checklist, H-ADAPTER)
