# Design: Live Test — Playback-Evidence Capture Mechanism

**Feature:** 2026-10-25-ppc-capture-live-test
**Status:** Approved — design skipped (backend-only verification exercise)
**Date:** 2026-10-25

---

## Design decision

This feature involves no new code, no new UI, and no architectural decisions. The playback-evidence capture mechanism (ppc-s1/s2/s3) is already built, unit-tested, and deployed to production. This feature is a verification-only exercise: run a live production session against the existing mechanism and confirm end-to-end function.

**Design is not applicable.** Proceed directly to `/definition`.

---

## Solution architecture

**Not applicable.** No new services, components, or data flows are introduced. The existing capture pipeline is the subject of verification, not design.

For reference — the existing mechanism under test:
- User action in the live web UI triggers the capture pipeline
- The pipeline writes a PNG screenshot to a GitHub repository storage path (via the GitHub Contents API, using the authenticated user's OAuth token per ADR-020)
- The record is retrievable via the tenant-scoped screenshot route in the web UI

## UX / interaction design

**Not applicable.** No user-facing flows are added or modified.

## Decisions and open questions

None. All decisions were made during ppc-s1/s2/s3 delivery. No deferred decisions, no blocking open questions.

---