# Decisions: Auto Capture Target Resolution

## 2026-10-28 — ARCHITECTURE: reuse existing selector-derivation logic and existing adapter, no new adapter

**Context:** Operator flagged that `playback-evidence.js`'s capture-target entry requires a manually typed URL and CSS selector for every AC. A selector-derivation mechanism (`deriveSelectorFromSpec`/`buildCaptureList`, `scripts/playback-capture.js`, story `rpca-s2`) already exists and is unit-tested, but is dead code — never called from any real path (`runCaptureForFeature` still hardcodes its target; the only caller of `buildCaptureList` anywhere in the repo is its own test file).

**Decision:** Extend the existing `rpca-s2` logic (add URL derivation alongside the existing selector derivation) and relocate it to a shared, pure, adapter-agnostic module (`actr-s1`), rather than writing a new derivation mechanism from scratch. Wire it into the web-ui via the existing `fetchArtefact` adapter already required into `playback-evidence.js` (`actr-s2`/`actr-s3`), rather than introducing a new adapter.

**Rationale:** Avoids duplicating already-tested regex-based parsing logic. No new D37 adapter is needed — `fetchArtefact` already covers "read a file from the tenant's connected repo," the exact capability auto-resolution needs (reading the story's `test-plan.md` and the named E2E spec file). Keeps this short-track scope bounded: 3 stories extend and wire existing capability rather than build new infrastructure.

## 2026-10-28 — SECURITY: spec-derived URLs must be validated as same-origin relative paths

**Context:** A spec-derived URL feeds a real, session-authenticated Playwright `page.goto()` call (via `dispatchCaptureWorkflow` → `.github/scripts/ppc-capture-worker.js`). If a spec file's `page.goto(...)` call ever named an absolute external URL (accidentally, or via a compromised dependency/PR), blindly trusting that string would let an attacker-controlled page receive a real tenant session cookie.

**Decision:** `actr-s1`'s derivation function (AC3) rejects any `goto` value that is not a same-origin relative path (starting with `/`, not protocol-relative `//`) and returns `url: null` instead — falling through to manual entry rather than ever passing an unsafe value downstream.

**Rationale:** Matches this feature's own existing ADR-018 "real session only" constraint — an authenticated session navigating to an attacker-controlled host under this feature's existing trust model is a real risk, not a hypothetical one, so the derivation layer must fail closed.

## 2026-10-28 — CORRECTION: goto-scan direction was wrong in the first draft of actr-s1, caught before implementation

**Context:** `actr-s1`'s original AC2 ("derive the URL") was drafted assuming a story's E2E spec places `page.goto(...)` *before* the AC's own tag comment (e.g. via a shared `beforeEach`), so the derivation function would scan backward from the tag to find it. Before writing the implementation plan, 3 real spec files were read to confirm this (`tests/e2e/fpd-s4-caption-sync.spec.js`, `tests/e2e/jcx-s3-emotion-curve.spec.js`, `tests/e2e/ppc-s5-video-lazy-load.spec.js`). All 3 disproved the assumption: `fpd-s4`'s tag is in a header comment, with `goto` and `locator` both appearing *after* it, in that order — the same direction the existing (already-shipped) selector-derivation logic already scans.

**Decision:** Corrected AC2 to scan forward from the tag (same direction as the existing selector logic), added AC2b (bound the forward scan to the AC's own section, so a later AC's `goto` in a multi-AC file is never misattributed — the same class of bug `rpca-s2-hotfix1` already fixed for the selector side of this exact scan), and added a dedicated regression test (`doesNotFindUrlWhenGotoPrecedesTag`) asserting the old, wrong direction is never used. Story, test plan, review, and DoR artefacts were all updated to match before `/implementation-plan` was written.

**Rationale:** This is exactly the class of mistake CLAUDE.md's "Mock-shape verification" rule warns about for mocks — here applied to fixture/design assumptions instead: a plausible-sounding design detail that was never checked against real repo content would have produced a feature whose unit tests pass but that never actually resolves anything against real spec files in production. Caught at zero cost (pre-implementation, artefact-only edit) by reading real fixtures before locking in the algorithm.

## 2026-10-28 — GAP: no discovery/governance-approval chain exists for this short-track feature

**Context:** Per `CLAUDE.md`'s short-track definition, this feature skips `/discovery` through `/review` (steps 1-4) and starts directly at `/test-plan`. There is therefore no `discovery.md` artefact and no `## Approved By` section for `/definition-of-ready`'s H-GOV check to read.

**Decision:** Logged as a known H-GOV gap at DoR for all three stories (`actr-s1`, `actr-s2`, `actr-s3`), same precedent already established for `pcr-s1`/`tst-s1`/`jlc-s1`/`cfg-s1` — short-track stories proceed on direct operator sign-off in the DoR artefact itself rather than a discovery-stage approval.

**Rationale:** Consistent with this repo's own established short-track precedent; not a new exception.
