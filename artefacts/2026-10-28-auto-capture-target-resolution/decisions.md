# Decisions: Auto Capture Target Resolution

## 2026-10-28 — ARCHITECTURE: reuse existing selector-derivation logic and existing adapter, no new adapter

**Context:** Operator flagged that `playback-evidence.js`'s capture-target entry requires a manually typed URL and CSS selector for every AC. A selector-derivation mechanism (`deriveSelectorFromSpec`/`buildCaptureList`, `scripts/playback-capture.js`, story `rpca-s2`) already exists and is unit-tested, but is dead code — never called from any real path (`runCaptureForFeature` still hardcodes its target; the only caller of `buildCaptureList` anywhere in the repo is its own test file).

**Decision:** Extend the existing `rpca-s2` logic (add URL derivation alongside the existing selector derivation) and relocate it to a shared, pure, adapter-agnostic module (`actr-s1`), rather than writing a new derivation mechanism from scratch. Wire it into the web-ui via the existing `fetchArtefact` adapter already required into `playback-evidence.js` (`actr-s2`/`actr-s3`), rather than introducing a new adapter.

**Rationale:** Avoids duplicating already-tested regex-based parsing logic. No new D37 adapter is needed — `fetchArtefact` already covers "read a file from the tenant's connected repo," the exact capability auto-resolution needs (reading the story's `test-plan.md` and the named E2E spec file). Keeps this short-track scope bounded: 3 stories extend and wire existing capability rather than build new infrastructure.

## 2026-10-28 — SECURITY: spec-derived URLs must be validated as same-origin relative paths

**Context:** A spec-derived URL feeds a real, session-authenticated Playwright `page.goto()` call (via `dispatchCaptureWorkflow` → `.github/scripts/ppc-capture-worker.js`). If a spec file's `page.goto(...)` call ever named an absolute external URL (accidentally, or via a compromised dependency/PR), blindly trusting that string would let an attacker-controlled page receive a real tenant session cookie.

**Decision:** `actr-s1`'s derivation function (AC3) rejects any `goto` value that is not a same-origin relative path (starting with `/`, not protocol-relative `//`) and returns `url: null` instead — falling through to manual entry rather than ever passing an unsafe value downstream.

## 2026-10-28 — SECURITY FINDING (closed): tab/newline-obscured protocol-relative URL bypassed the AC3 guard's literal string check

**Context:** Task 4's spec-compliance review found that `_validateRelativeUrl`'s first implementation checked `rawUrl.startsWith('//')` literally. A value with an embedded ASCII tab between the leading `/` and a second `/` (e.g. `/\t/evil.com`) does not literally start with `//`, so it passed the guard — but any real WHATWG-URL-spec-compliant navigator (including Playwright's Chromium, which drives the actual downstream `page.goto()` call) strips ASCII tab/newline/carriage-return before parsing a URL, so the *actual* navigation still treats this as protocol-relative and changes host. Confirmed independently by the orchestrator with Node's own `URL` (same resolution algorithm): `new URL('/\t/evil.com', 'https://example.com').host === 'evil.com'`. Reachable from real spec-file content, not just theoretical — `_firstGotoIn`'s extraction regex captures these characters from a `page.goto('...')` call's quoted argument without issue.

**Decision:** `_validateRelativeUrl` now strips ASCII tab/newline/carriage-return from a working copy of `rawUrl` before running its `startsWith` checks (mirroring the WHATWG URL spec's own input-sanitization step), while still returning the *original* `rawUrl` string when validation passes (never a silently-rewritten value). A dedicated regression test (`rejects a tab-obscured protocol-relative goto URL`) was added.

**Rationale:** This guard's entire purpose is to judge a string the way a real navigator will actually parse it, not the way a naive literal string comparison sees it — a validator that reasons about different bytes than the thing it's protecting is not actually a validator. General lesson for this kind of "is this string safe to pass to a URL-consuming API" check: always sanitize/normalize to match the actual downstream parser's own rules before comparing, never assume the raw bytes are what gets interpreted.

## 2026-10-28 — SECURITY FINDING (closed): backslash-as-slash normalization bypassed the AC3 guard, same class of bug as the tab finding above

**Context:** A follow-up review of the tab-bypass fix (above) deliberately probed for sibling bypasses of the same shape and found a second one, empirically confirmed against the actual function (not just theory): `/\evil.com` (one leading slash, then a single literal backslash, then a host-looking string) passed `_validateRelativeUrl` and was returned as a trusted `url`. Per the WHATWG URL spec, for "special" schemes (http/https/ws/wss/ftp/file) a backslash is parsed identically to a forward slash — so to any real navigator (including Playwright's Chromium, which drives the actual downstream `page.goto()`), `/\evil.com` IS `//evil.com`: protocol-relative, host-changing. Confirmed with Node's own `URL` (same algorithm): `new URL('/\evil.com', 'https://origin.example/some/page').host === 'evil.com'`.

**Decision:** `_validateRelativeUrl` now also normalizes backslash to forward slash (alongside the existing tab/newline/CR stripping) in its working `sanitized` copy before the `startsWith` checks, while still returning the original, unmodified `rawUrl` when validation passes. A dedicated regression test was added alongside the tab-bypass one.

**Rationale:** Same lesson as the tab finding, restated because it generalized rather than being a one-off: this guard must sanitize into the SAME shape a real WHATWG-URL-spec parser will actually see before judging the string, for every character class a real parser normalizes — not just the first one found. The review process that found this (deliberately probing for siblings of a just-fixed bug, with empirical verification rather than accepting the first fix as sufficient) is itself the control worth keeping for any future "is this input safe" fix in this codebase.

**Rationale:** Matches this feature's own existing ADR-018 "real session only" constraint — an authenticated session navigating to an attacker-controlled host under this feature's existing trust model is a real risk, not a hypothetical one, so the derivation layer must fail closed.

## 2026-10-28 — CORRECTION: goto-scan direction was wrong in the first draft of actr-s1, caught before implementation

**Context:** `actr-s1`'s original AC2 ("derive the URL") was drafted assuming a story's E2E spec places `page.goto(...)` *before* the AC's own tag comment (e.g. via a shared `beforeEach`), so the derivation function would scan backward from the tag to find it. Before writing the implementation plan, 3 real spec files were read to confirm this (`tests/e2e/fpd-s4-caption-sync.spec.js`, `tests/e2e/jcx-s3-emotion-curve.spec.js`, `tests/e2e/ppc-s5-video-lazy-load.spec.js`). All 3 disproved the assumption: `fpd-s4`'s tag is in a header comment, with `goto` and `locator` both appearing *after* it, in that order — the same direction the existing (already-shipped) selector-derivation logic already scans.

**Decision:** Corrected AC2 to scan forward from the tag (same direction as the existing selector logic), added AC2b (bound the forward scan to the AC's own section, so a later AC's `goto` in a multi-AC file is never misattributed — the same class of bug `rpca-s2-hotfix1` already fixed for the selector side of this exact scan), and added a dedicated regression test (`doesNotFindUrlWhenGotoPrecedesTag`) asserting the old, wrong direction is never used. Story, test plan, review, and DoR artefacts were all updated to match before `/implementation-plan` was written.

**Rationale:** This is exactly the class of mistake CLAUDE.md's "Mock-shape verification" rule warns about for mocks — here applied to fixture/design assumptions instead: a plausible-sounding design detail that was never checked against real repo content would have produced a feature whose unit tests pass but that never actually resolves anything against real spec files in production. Caught at zero cost (pre-implementation, artefact-only edit) by reading real fixtures before locking in the algorithm.

## 2026-10-28 — CORRECTION: Task 1's own AC1 test fixture was coupled to Task 2's not-yet-built capability

**Context:** During subagent-execution, Task 1's implementer built `deriveCaptureTargetFromSpec` and a test asserting selector parity. A code-quality review strengthened that test to assert the full `{acId, url, selector}` object (correctly, catching a weak assertion). The fixture used for that test happened to contain a `page.goto('/playback/actr-fixture')` call — harmless under Task 1's own stub (`url` always `null`), but about to become a real, resolvable `url` the moment Task 2's goto-scanning landed, which would break Task 1's own `url: null` assertion as an unintended side effect of a *later* task's correct new behaviour.

**Decision:** Caught by the orchestrator before dispatching Task 2 (by re-reading Task 2's planned fixtures against what was already committed for Task 1), not discovered as a confusing CI failure mid-Task-2. Removed the `goto` call from Task 1's AC1 fixture so its `url: null` assertion holds on its own terms (no goto present at all), independent of any later task's capability. Amended into the same (not-yet-pushed) task commit.

**Rationale:** A test fixture that passes only because a capability doesn't exist *yet* is a latent coupling, not a stable assertion — the same root-cause shape as this story's earlier `decisions.md` CORRECTION entry (an assumption never checked against what the next task would actually do). Worth a standing habit in multi-task plans: before dispatching task N, check whether any fixture already committed in task N-1 would change meaning once task N's new capability is applied to it.

## 2026-10-28 — GAP: no discovery/governance-approval chain exists for this short-track feature

**Context:** Per `CLAUDE.md`'s short-track definition, this feature skips `/discovery` through `/review` (steps 1-4) and starts directly at `/test-plan`. There is therefore no `discovery.md` artefact and no `## Approved By` section for `/definition-of-ready`'s H-GOV check to read.

**Decision:** Logged as a known H-GOV gap at DoR for all three stories (`actr-s1`, `actr-s2`, `actr-s3`), same precedent already established for `pcr-s1`/`tst-s1`/`jlc-s1`/`cfg-s1` — short-track stories proceed on direct operator sign-off in the DoR artefact itself rather than a discovery-stage approval.

**Rationale:** Consistent with this repo's own established short-track precedent; not a new exception.
