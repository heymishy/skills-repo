# Definition: Live Verification Test — Definition/Review Splitter Bugfix

**Status:** Complete
**Date:** 2026-09-14
**Feature slug:** 2026-09-14-test-asf-s1-live-verification-throwaway

## Epics

### E1: Placeholder Epic — Artefact Splitter Test Context

**Description:** A single, minimal epic containing one trivial story to exercise the web UI's artefact splitter code path in a live session environment.

**Stories:** [asf-s1]

---

## Stories

### asf-s1 — Add Placeholder Comment to Test File

**User story:**
As a developer
I want to add a placeholder file with a test comment
So that the definition/review artefact splitter can be verified in a live session

**Acceptance Criteria:**

1. File `src/test-placeholder.js` exists with exactly this content:
   ```
   // Placeholder file for artefact splitter test — 2026-09-14
   ```

2. No other code, logic, or imports are added to the file

3. The file is committed to the feature branch and merged to master

4. No test coverage required — this is a throwaway artefact

**Why this story:**
Provides minimal, valid feature context to exercise the web UI's definition → review → DoR parsing without functional noise. The artefact splitter must correctly parse both definition.md and review.md; this story verifies that parsing works in a live session.

**Complexity:** 1 — trivial, no ambiguity
**Scope stability:** Stable
**Surface type:** git-native
**Human oversight:** Low

---

## Architecture Notes

No architectural decisions. Use existing patterns. No design system, no security review, no compliance check required.

---

## Non-Functional Requirements

None. This is a throwaway test feature.

---

## Dependencies

None. Standalone test feature.