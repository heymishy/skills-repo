# Definition: Live Verification Test — Definition/Review Splitter Bugfix

**Status:** Complete
**Date:** 2026-09-14
**Feature slug:** 2026-09-14-test-asf-s1-live-verification-throwaway

## Epics

### E1: Placeholder Epic — Artefact Splitter Test Context

**Description:** A single, minimal epic containing one trivial story to exercise the web UI's artefact splitter code path in a live session environment. No functional value — purely for test coverage.

**Stories:** [asf-s1]

---

## Stories

### asf-s1 — Add Placeholder Comment to Test File

**Acceptance Criteria:**
1. A new file `src/test-placeholder.js` is created with a single-line comment: `// Placeholder file for artefact splitter test — 2026-09-14`
2. No other code or logic is added to the file
3. The file is committed to master

**Why this story:**
Provides a minimal, valid feature context that exercises the definition → review → DoR → coding loop without adding real functionality. The artefact splitter in the web UI must correctly parse definition and review artefacts; this story's minimal scope lets us verify that parsing works in a live session without noise.

**Complexity:** 1 — well understood, zero ambiguity
**Scope stability:** Stable
**Surface type:** git-native
**Human oversight:** Low

---

## Metrics

**Metric M1 — Placeholder Verification Signal**
- **Baseline:** Artefact splitter unverified in live environment
- **Target:** Web UI session completes without splitter error
- **Feedback loop:** Manual observation — operator runs session, observes no parse error in browser console

---

## Constraints and Dependencies

- **Out of scope:** Any real product functionality, design review, security/compliance audit
- **Dependencies:** None — standalone test feature
- **Tech stack:** Node.js, git, no external libraries

---

## Architecture Notes

No architectural decisions required. This is a throwaway feature — use existing patterns and conventions.