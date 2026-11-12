# Review Report: Production error capture to PostHog with tenant text scrubbed — Run 3

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s5-posthog-error-capture-and-scrub.md
**Story slug:** coha-s5
**Date:** 2026-11-13
**Categories run:** A, B, C, D, E (F, G, H N/A)
**Outcome:** PASS

Reviewer note: same agent as the author, third pass. The kept-property list was checked against a real SDK event from the proof of concept rather than from the story's description; that check found two keys missing (`$is_server`, `$geoip_disable`), which were added before this report was finalised.

---

## Review Diff — Run 3 vs Run 2

### Resolved since last run
✅ 2-H1 — `route` and `distinct_id` carried identifiers — RESOLVED: `route` is the matched pattern, `distinct_id` a fixed label with person processing off, both asserted in AC3.
✅ 2-M1 — kept SDK properties not named — RESOLVED: constraint lists them by name (including `$is_server` and `$geoip_disable`, observed on a real event); AC1 asserts exactly those keys.
✅ 2-M2 — "shape not seen in any fixture" untestable — RESOLVED: AC3 requires identifiers generated fresh on every run.
✅ 2-L1 — compound AC5 — RESOLVED: split into AC5, AC6 and AC7; wiring AC is now AC9.

### New findings this run
None HIGH or MEDIUM. One LOW below.

---

## HIGH findings — must resolve before /test-plan

None.

## MEDIUM findings — resolve or acknowledge in /decisions

None.

## LOW findings — note for retrospective

- **[3-L1]** E — The `before_send` hook was proved against a local sink with the installed `posthog-node` 5.40.0; the `Authorization`-style delivery to the real PostHog project and PostHog's own server-side processing (for example whether it adds person properties from the fixed `distinct_id`) are not exercised until the live check in coha-s6 and the first deployed run. DoD should record AC3 as `integration-real-code`, not `live-verified`.

---

## Score

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS |
| Scope integrity | 4 | PASS |
| AC quality | 4 | PASS |
| Completeness | 4 | PASS |

## Summary

0 HIGH, 0 MEDIUM, 1 LOW across 1 story.
**Outcome:** PASS — no HIGH findings remain. Open item that is not a review finding: the operator recalls that staging and production share one PostHog key (unverified); the story already treats the `environment` property as the separation.
