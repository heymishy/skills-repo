# Review Report: Alert-to-GitHub-issue bridge for new production error issues — Run 1

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s6-alert-to-github-issue-bridge.md
**Story slug:** coha-s6
**Date:** 2026-11-13
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance (F, G, H N/A: no journey.js, skills.js or journeys.js test file in scope)
**Outcome:** FAIL

Facts checked against the repo before reviewing: the image is built from `src/`, `skills/`, `product/`, `artefacts/` and `.github/` only (`Dockerfile` lines 18 to 59), so `scripts/` is not in the running app; `scripts/lib/incident-store.js` is the incident store; an unauthenticated inbound POST route with its own verification already exists (`/webhook/stripe`, `server.js:4236`, with a database idempotency table `stripe_events`); existing GitHub writes in the app use a per-session user token (`pipeline-state-github-writer.js`, `context.token`), not a server-owned one; the target repo `heymishy/skills-repo` is PUBLIC (checked with `gh repo view`). Reviewer note: the same agent drafted the story, so the checks above were run against the code, not the story's description.

---

## HIGH findings — must resolve before /test-plan

- **[1-H1]** C — AC quality (where duplicate state lives is not specified, so AC2 is not meaningfully testable). AC2 says "the same PostHog issue id arrives again ... no second issue is opened", and the NFR says "a failure to reach GitHub is logged and returned as a retryable error". The story does not say where the "already seen" record is kept. An in-memory set fails across a restart or a second Fly machine, and PostHog's retry behaviour is undocumented, so a retry after a timeout can open a second issue. Two near-simultaneous deliveries can also both pass a check-then-create.
  Fix: choose the store and say so. The repo's own precedent is a database table with a unique key (the `stripe_events` idempotency table behind `/webhook/stripe`); alternatively a search of existing GitHub issues for a marker with the PostHog issue id. Rewrite AC2 to include a restart (a fresh handler instance sees the earlier id) and two simultaneous deliveries producing one issue.

- **[1-H2]** C — AC quality (AC4 requires a mechanism the running app cannot use). AC4 says the incident record is created "through the existing incident store". The store is `scripts/lib/incident-store.js`, and `scripts/` is not copied into the image (the same constraint recorded in ddft-s5's DoD, where `products.js` inlined a rule for this reason). The story acknowledges that the app cannot write `workspace/incidents.json`, but AC4 as written is still unimplementable and its fallback ("split into its own story if undecided at DoR") leaves an AC in the story that cannot pass.
  Fix: remove AC4 from this story now and create its own story (for example coha-s7) with the write-path decision made explicit: the app writes through the GitHub Contents API, or a workflow triggered from the issue creates the record using the store. Keep this story to issue creation only.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** D — Completeness (environment filter missing). coha-s5 states that staging and production share one PostHog key, so a staging error appears in the same Error Tracking list and its new-issue alert would call this bridge. coha-s6 has no AC about it, so a staging error would open a production GitHub issue.
  Risk if proceeding: noise issues from every staging and E2E failure, in a public repo.
  To acknowledge: add an AC: given a payload whose `environment` is not `production` (or is missing), the bridge opens nothing and returns 200; and state whether the filter is also set in the PostHog alert.

- **[1-M2]** E — Architecture compliance (route security not specified). The new POST route has no user session and must not sit behind the CSRF guard that mutating routes use; the story says only "shared-secret authentication". The existing `/webhook/stripe` route is the pattern to follow (own verification, no session, idempotency table) and is not cited. It also does not say how the route is registered in `server.js` (the wiring AC the injectable adapter rule needs) or how a payload size limit is enforced before parsing.
  Risk if proceeding: either a route rejected by the CSRF guard in production, or an unauthenticated route with no body limit.
  To acknowledge: cite the Stripe webhook route as the pattern, state the CSRF exemption and body limit, and add the D37 wiring AC for the issue-creating adapter.

- **[1-M3]** A — Traceability / sequencing (the real payload is needed before the tests can be planned). The mock-shape constraint requires the AC1 fixture to come from a real PostHog payload, but the only planned way to get one is AC3, the live check, which runs after the bridge exists. The test plan cannot be written against a fixture that does not exist yet.
  Risk if proceeding: a test plan written against an invented payload, the exact failure the mock-shape rule exists to prevent.
  To acknowledge: add a first, small task before `/test-plan`: capture one real sample payload from PostHog's destination test function into a throwaway receiver, and commit the (scrubbed) sample as the fixture.

- **[1-M4]** B — Scope (public repository and target not specified). The target repo is public, so an issue body is public. The story says the body is built from PostHog's already-scrubbed fields but does not state the exact fields, nor how the target repo is chosen (hard-coded name or configuration).
  Risk if proceeding: a stack trace, file path or message appearing in a public issue.
  To acknowledge: list the exact issue fields (title as the fixed code, first seen, count, the PostHog link), forbid message and stack content in the issue body, and read the target from configuration rather than code.

---

## LOW findings — note for retrospective

- **[1-L1]** C — AC1 says "exactly one GitHub issue is opened in this repo" with no label or title convention; add labels (for example `production-error`) so later automation and the coha-s7 incident link can find them.
- **[1-L2]** D — The NFR "returned as a retryable error" depends on PostHog retrying, which is undocumented; say what the bridge returns on a GitHub failure (for example 503) and record that retry behaviour is unverified.

---

## Score

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 3 | PASS (1-M3 addressable without rework) |
| Scope integrity | 3 | PASS (1-M4) |
| AC quality | 2 | FAIL (1-H1 duplicate state unspecified; 1-H2 AC4 unimplementable) |
| Completeness | 3 | PASS (1-M1, 1-M2) |

## Summary

2 HIGH, 4 MEDIUM, 2 LOW across 1 story.
**Outcome:** FAIL — two HIGH findings (where duplicate state is kept, and an AC that needs a mechanism not present in the running app) must be resolved before /test-plan.
