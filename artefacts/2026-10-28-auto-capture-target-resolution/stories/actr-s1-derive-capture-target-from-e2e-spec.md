## Story: Derive capture target (URL + selector) from a story's own E2E spec

**Track:** Short-track (`/test-plan -> /definition-of-ready -> coding agent`)

## Background

During the `ppc-self-service-capture` epic's own post-merge review, the operator flagged that the playback-evidence capture flow requires typing a URL and CSS selector by hand for every AC (`handlePostCaptureTarget`, `src/web-ui/routes/playback-evidence.js:816`) before any evidence capture can run — unnecessary friction, since both values usually already exist in the story's own E2E coverage.

A selector-derivation mechanism already exists and is unit-tested — `deriveSelectorFromSpec`/`buildCaptureList` in `scripts/playback-capture.js` (story `rpca-s2`) — but it was never wired into any real call path. Confirmed directly: `scripts/playback-capture.js`'s own CLI entrypoint (`runCaptureForFeature`) still uses a hardcoded URL/selector pair (lines 429-434) rather than calling `buildCaptureList`, and the only place `buildCaptureList` is called anywhere in this repo is its own test file (`tests/check-rpca-s2-selector-derivation-from-e2e-specs.js`). This capability was built and tested but is dead code.

This story extends that dormant logic to also derive the **URL**, and relocates it to a shared, pure, adapter-agnostic module so both the CLI script and the web-ui route (`actr-s2`, `actr-s3`) can reuse it without duplicating the regex-based parsing.

## User Story

As a **product owner capturing DoD evidence for a merged story**,
I want **the AC's capture URL and CSS selector derived automatically from the story's own E2E spec**,
So that **I don't have to hand-type values that already exist in the codebase before I can capture evidence**.

## Benefit Linkage

**Metric moved:** `m1` — Self-service DoD validation adoption (the `production-playback-capture` feature's own benefit metric). Removing a manual-entry step that blocks every first capture attempt directly reduces the friction `m1` measures.
**How:** Confirmed with the operator (2026-10-28) as a direct UX-friction follow-up to the `ppc-self-service-capture` epic.

## Architecture Constraints

- Pure parsing logic only — no I/O, no adapter, no network/file access in this story. Reads come from `actr-s2`/`actr-s3`.
- Must not weaken the existing manual-fallback path (`loadManualFallback`/`selectors-manual.json`) — this story adds a new, higher-priority source in front of it, never removes it.
- The derived `url` must be validated as a same-origin relative path (starting with `/`) before being returned — never pass an absolute external URL straight through from spec text, since that string later feeds a real Playwright `page.goto()` call (via `dispatchCaptureWorkflow`/`.github/scripts/ppc-capture-worker.js`) authenticated with the tenant's own real session. Treat this the same as any other untrusted-content boundary in this feature (ADR-018's "real session only" constraint makes an attacker-controlled off-site `goto` target under an authenticated session a real risk, not a hypothetical one).
- Module must be reusable from both `scripts/playback-capture.js` (Node `fs` CLI context) and `src/web-ui/routes/playback-evidence.js` (adapter-fed string content) — the function signature takes raw spec text as a string, never a file path, so both callers can supply content from whichever source they have.

## Dependencies

- **Upstream:** `rpca-s2` (merged) — the existing `deriveSelectorFromSpec` this story extends.
- **Downstream:** `actr-s2`, `actr-s3`.

## Acceptance Criteria

**AC1:** Given spec text containing an AC-tagged comment (`(storySlug AC_n)`) followed by a `page.locator('<sel>')` call, When the new function runs, Then it returns the same `selector` value `deriveSelectorFromSpec` already returns today (no regression).

**AC2:** Given spec text containing a `page.goto('/relative/path')` call that precedes the AC's own tagged locator anywhere earlier in the file (not necessarily immediately before it — matching how `beforeEach`/shared setup actually places `goto`), When the function runs, Then it returns that `goto` path as `url`.

**AC3:** Given spec text where the nearest preceding `goto` call is an absolute URL (`https://...`) or any other non-relative value, When the function runs, Then it returns `url: null` for that AC rather than passing the value through — the attempted derivation is skipped, not silently trusted.

**AC4:** Given spec text with no AC tag match at all (AC not covered by any spec), When the function runs, Then it returns `null` (unchanged behaviour from today's `deriveSelectorFromSpec`), not a thrown error.

**AC5:** Given the relocated function, When `scripts/playback-capture.js`'s own existing `buildCaptureList`/`tests/check-rpca-s2-selector-derivation-from-e2e-specs.js` suite runs against the new shared module, Then all existing `rpca-s2` tests still pass unchanged (pure relocation, no behavioural regression on the selector half).

## Out of Scope

- Wiring this function into any real route or CLI call path — `actr-s2` wires the web-ui path. The CLI's own dead hardcoded path in `runCaptureForFeature` is not touched by this story; flagged as a smaller, non-blocking follow-up in `decisions.md`.
- Changing the manual-fallback file format (`selectors-manual.json`).
- Any change to `.github/scripts/ppc-capture-worker.js` — unaffected, it only ever receives already-resolved targets.

## NFRs

- **Security:** AC3 is the control that matters — a spec-derived URL must be rejected unless it is a same-origin relative path.
- **Performance:** Pure string/regex parsing on already-in-memory text — no meaningful cost.
- **Accessibility:** Not applicable.
- **Audit:** None beyond existing logging.

## Complexity Rating

**Rating:** 1 — the selector-half logic already exists and is tested; the only new work is the symmetric `goto`-scan, the relocation, and the relative-path guard.
**Scope stability:** Stable.
