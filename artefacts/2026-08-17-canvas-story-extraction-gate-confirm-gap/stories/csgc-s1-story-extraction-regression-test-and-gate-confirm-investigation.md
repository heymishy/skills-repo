## Story: Add a regression test for /definition story-extraction and investigate the unexplained gate-confirm 400

**Epic reference:** None — short-track, closing a self-documented gap from `r-canvas-render-and-story-extraction-fix` (`2026-07-26-canvas-render-and-story-extraction-fix`, AC3)
**Discovery reference:** None — short-track
**Benefit-metric reference:** None — short-track
**Domain:** [web-ui]

## User Story

As a **platform maintainer**,
I want **`/definition`'s story-extraction logic to have real automated regression coverage, and the unexplained `gate-confirm` 400 error either root-caused or ruled out**,
So that **a future change can't silently break story extraction (which the existing auto-skip-to-review logic depends on) without a test catching it, and a possible real production bug isn't left permanently unconfirmed**.

## Benefit Linkage

**Metric moved:** None formally tracked (short-track gap-closure, no benefit-metric artefact) — directly closes AC3 of `r-canvas-render-and-story-extraction-fix`, which its own story artefact self-documented as `NEEDS-TESTS` at merge time (2026-07-26) and was never followed up.
**How:** A real regression test on `extractStoryIdsFromDefinitionArtefact()` prevents a silent break; investigating the 400 either confirms a real bug (fix it) or rules it out (close the uncertainty).

## Architecture Constraints

- Reuse the existing manual verification already done: the original investigation confirmed `extractStoryIdsFromDefinitionArtefact()` correctly finds `["mock-fixture.1"]` against the corrected fixture — turn that into a real `tests/check-*.js` assertion, do not re-derive the fixture from scratch.
- The `gate-confirm` 400 was observed on `POST /api/journey/:id/gate-confirm` immediately after a real (not JSON-API-driven) `/definition` turn — reproduce via the same real streaming path, not a JSON-API shortcut, since the original note specifically flags that the JSON-API path may not reproduce it.
- Follow `.github/architecture-guardrails.md`'s existing patterns for any fix — no new patterns without checking for an existing one first (ADR-026).

## Dependencies

- **Upstream:** `r-canvas-render-and-story-extraction-fix` (merged, PR #613) — this story closes a gap that story's own artefact self-documented as open.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `/definition`'s story-extraction logic (`extractStoryIdsFromDefinitionArtefact`), When run against the corrected fixture already used in the original investigation, Then a new automated test in `tests/check-*.js` asserts it returns `["mock-fixture.1"]` — codifying the manual verification already done, not re-deriving it.

**AC2:** Given the existing auto-skip-to-review logic (`dtra-s1`/`dsda-s1`) that consumes story-extraction output, When the new regression test runs, Then it also asserts that logic can act correctly on the extracted story list (closing the original AC3's full scope, not just the extraction function in isolation).

**AC3:** Given a real (non-JSON-API) `/definition` turn followed immediately by `POST /api/journey/:id/gate-confirm`, When reproduced under the same conditions as the original observation, Then the investigation concludes with one of two outcomes, both acceptable: (a) the 400 is confirmed as a real bug, root-caused, and fixed, or (b) the 400 is confirmed as an artifact of the original debug script's own construction and does not occur in the real production request path — either outcome closes the "NOT confirmed either way" uncertainty explicitly.

## Out of Scope

- Any change to the diagram-rendering behaviour itself (AC1/AC2 of the original story) — already confirmed working via real E2E tests, not touched by this story.
- Broader story-extraction feature work beyond closing this specific gap — if the investigation surfaces a larger redesign need, that's a separate discovery, not bundled here.

## NFRs

- **Performance:** None identified.
- **Security:** None identified.
- **Accessibility:** Not applicable.
- **Audit:** None new.

## Complexity Rating

**Rating:** 2 — the regression test (AC1/AC2) is straightforward; the gate-confirm investigation (AC3) has a genuine unknown outcome (could be quick, could require real debugging).
**Scope stability:** Unstable — AC3's investigation could reveal it needs more scope once started; if so, re-scope rather than force a fix into this story's original bounds.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
