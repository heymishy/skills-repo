## Definition of Ready: The caption-sync E2E spec opens a playback page that exists, so it passes instead of failing to find a video

**Story reference:** artefacts/2026-11-21-fpd-s4-spec-repair/stories/fpsr-s1-playback-spec-real-feature.md
**Test plan reference:** artefacts/2026-11-21-fpd-s4-spec-repair/test-plans/fpsr-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-21
**Track:** short

## Contract Proposal
- `tests/e2e/fpd-s4-caption-sync.spec.js` (AC1, AC2): the `page.goto` URL becomes `/playback/2026-10-11-journey-cx-redesign`, with a comment saying why; nothing else changes.
- `tests/check-actr-s1-capture-target-derivation.js` (AC3): the one expected URL in the real-file test follows the spec.
- `tests/e2e/capability-matrix.json` (AC4): the `fpd-s4` entry moves from `quarantined` to `extended` with a rewritten reason, only after CI shows the spec passing.
- `decisions.md` and a DoD.
- Not built: no `src/` change, no fixture, no stubbed repository root, no spec retirement, no `core` move.

## Contract Review
Contract review passed. All 5 acceptance criteria map to a spec run, an existing check, a CI read or a recorded manual step. `check-actr-s1-capture-target-derivation.js` is a required touchpoint (AC3) and appears in no exclusion list; `src/` is excluded and no assertion targets it.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied. Test-only changes go through a pull request.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | developer or operator reading the E2E report |
| H2 | At least 3 ACs in Given / When / Then | Pass | 5 ACs |
| H3 | Every AC has a test | Pass | AC1 a spec run, AC2 and AC5 diff reads, AC3 existing checks, AC4 a CI read |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | |
| H6 | Complexity rated | Pass | 1, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | no schema change |
| H9 | Architecture Constraints populated | Pass | |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | no layout AC |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | no adapter |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | no UI |

**Hard blocks: all passed.**

## Warnings
| # | Status | Note |
|---|--------|------|
| W1 | Accepted | The spec now depends on the committed `jcx-s3` evidence under `artefacts/2026-10-11-journey-cx-redesign/playback/`; if it is moved the spec fails loudly (decisions D1). |
| W2 | Accepted | Local Chromium plays the WebM; CI uses its own browser build and is the authoritative measurement. |
| W3 | Accepted | The agent confirms a CI run exists on the final commit (including the matrix commit) before asking for the merge, checks master after it, and stages exact paths only. |
| W4 | Accepted | Local E2E runs create real `artefacts/*e2e*` and `workspace/journeys` entries; the agent works in a worktree and removes it afterwards (junction first). |

## Oversight level
**Low** - a one-line spec change and one expectation. The operator reviews the pull request and merges.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-21-fpd-s4-spec-repair/stories/fpsr-s1-playback-spec-real-feature.md
Test plan: artefacts/2026-11-21-fpd-s4-spec-repair/test-plans/fpsr-s1-test-plan.md
Goal: confirm the spec fails on master, change its goto URL to the real feature slug, update the one expectation in check-actr-s1-capture-target-derivation.js, run the spec 3 times and the two derivation checks, open a draft pull request; move the fpd-s4 matrix entry only after CI shows 1 of 1, then wait for CI on the final commit.
Constraints: the spec URL and comment, the one check expectation and the matrix only; no src/ change; preserve CRLF; stage exact paths.
```
