# Discovery — Minimal Smoke Test Fixture

**Status:** Draft
**Date:** 2026-03-29
**Feature:** smoke-test-feature

## Problem statement
Workshop facilitators cannot export session results to CSV. They currently copy data manually, which takes 20 minutes per session and introduces errors.

## Who it affects
Internal facilitators (named persona: Alex, workshop lead)

## Why now
15 facilitators onboarded last quarter. The manual step blocks same-day reporting.

## MVP scope
Add a CSV export button to the results view. Export includes card title, axis values, and timestamp.

## Out of scope
- PDF export
- Scheduled/automated exports
- Export of archived sessions

## Success indicators
Facilitators can export a session result in under 30 seconds without manual copy.

## Assumptions
- The results data is available client-side (no server round-trip needed for export)
- Browser download API is available in all supported environments

## Constraints
- No PII stored — export contains only card content entered by facilitators
- Session-based only — no persistence layer
