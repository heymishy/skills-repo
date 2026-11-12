# Review Report: Production error capture to PostHog with tenant text scrubbed — Run 2

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s5-posthog-error-capture-and-scrub.md
**Story slug:** coha-s5
**Date:** 2026-11-13
**Categories run:** A, B, C, D, E (F, G, H N/A: no journey.js, skills.js or journeys.js test file in scope)
**Outcome:** FAIL

Reviewer note: the same agent drafted the story, fixed it after run 1, and ran this review. The self-review failure mode (confirming rather than testing) applies, so each run 1 fix was re-read against the code and the proof-of-concept behaviour rather than against the author's description.

---

## Review Diff — Run 2 vs Run 1

### Resolved since last run
✅ 1-H1 — privacy rule unspecified — RESOLVED in form (allow-list, four fixture shapes, fail-closed hook); but see new finding 2-H1 for fields the allow-list still lets through.
✅ 1-H2 — test traffic and environment separation — RESOLVED (constraint plus AC5).
✅ 1-M1 — scope contradiction with discovery and epic — RESOLVED (scope note cited; discovery out-of-scope text and epic goal amended).
✅ 1-M2 — Metric 4 and coverage matrix stale — RESOLVED (both revised; the linkage says the metric moves only when coha-s6 ships).
✅ 1-M3 — wiring path unspecified — RESOLVED (dedicated module, throwing stub, caught by caller, wiring AC7).
✅ 1-M4 — NFR with no AC, vague AC4 — RESOLVED (AC6; AC4 defines the code).
✅ 1-L1, 1-L2, 1-L3 — RESOLVED (AC2 reworded; open decision moved to Out of Scope; ADR-011 cited).

### New findings this run
🆕 2-H1, 2-M1, 2-M2, 2-L1 (below).

### Progress summary
Seven of nine run 1 findings fully resolved, two resolved in form; 1 HIGH, 2 MEDIUM, 1 LOW new.

---

## HIGH findings — must resolve before /test-plan

- **[2-H1]** C — AC quality (two fields outside the scrubbed message still carry identifying data). (a) The `route` property is allow-listed, and the proof of concept set it to the raw request URL (`route: rq.url`). Real URLs in this app carry identifiers (for example `/products/:id` with a real product or tenant slug), so an allow-listed raw URL defeats AC3. (b) The event's `distinct_id` is not a property and the story never says what it is; `captureException(err, distinctId, ...)` in the existing code takes a caller-supplied id, which in this app can be a person or tenant identifier, and an identified id can create a person profile in PostHog.
  Fix: state that `route` is the matched route pattern (for example `/products/:id`) or a fixed label, never the raw URL or query string, and that `distinct_id` is a fixed server label (for example `server-error-capture`) with person processing off. Add both to AC3's assertion: a request to a URL containing a fixture tenant slug leaves that slug out of every field, including `route` and `distinct_id`.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[2-M1]** C — AC quality. The scrub rule drops "every extra property other than an allow-listed few (`environment`, `route`, `code`)" but does not name the properties the SDK needs for the event to be an issue (`$exception_list`, `$exception_level`, `$exception_fingerprint` if present, `$lib`, `$lib_version`). Read literally, the rule removes them and grouping breaks; read loosely, it becomes the deny-list the run 1 fix replaced.
  Risk if proceeding: either events that do not group in PostHog, or an allow-list that quietly widens.
  To acknowledge: list the kept SDK properties by name in the constraint and assert in AC1 that the sink payload has exactly those keys plus the three allow-listed ones.

- **[2-M2]** C — AC quality. AC3 requires "a shape not seen in any fixture", which cannot be tested as written: a fixture is by definition seen.
  Risk if proceeding: the clause is dropped at test-plan time and the weaker four-shape test remains.
  To acknowledge: require generated values (random identifiers inserted into message, properties, route and URL on each run) so the test cannot depend on the author's list.

---

## LOW findings — note for retrospective

- **[2-L1]** C — AC5 packs three separate Given/When/Then cases into one AC (e2e identity, unset key, staging run); the pipeline's own standard is one case per AC. Split on the next edit.

---

## Score

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS |
| Scope integrity | 4 | PASS |
| AC quality | 2 | FAIL (2-H1: route and distinct_id carry identifiers past the allow-list) |
| Completeness | 4 | PASS |

## Summary

1 HIGH, 2 MEDIUM, 1 LOW across 1 story.
**Outcome:** FAIL — one HIGH finding (identifying data can leave through the `route` property and the `distinct_id`) must be resolved before /test-plan.
