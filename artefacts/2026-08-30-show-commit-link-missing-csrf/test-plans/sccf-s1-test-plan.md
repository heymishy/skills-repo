## Test Plan: sccf-s1 — CSRF field on the live-injected gate-confirm form

**Story reference:** artefacts/2026-08-30-show-commit-link-missing-csrf/stories/sccf-s1-add-csrf-field-to-live-injected-gate-confirm-form.md

## Coverage table

| AC | Test | Type |
|----|------|------|
| AC1 | Rendered page's script block contains `var CSRF_TOKEN = "<token>";` matching the session's real csrfToken | Unit (`tests/check-sccf-s1-show-commit-link-csrf-field.js`) |
| AC2 | `showCommitLink` function's extracted source text references `CSRF_TOKEN` while building the `_csrf` hidden input in its injected form HTML | Unit (same file) |
| AC3 | Live click-through on `wuce-staging` after deploy: a brand-new journey's first stage (completed live) submits gate-confirm successfully | Manual (post-merge live validation, same method that found the bug) |
| AC4 | Existing suite re-run: `check-jgcc-s1-chat-gate-confirm-csrf-field.js` and the 5 chat-page-adjacent files | Integration (existing) |

## New test file: `tests/check-sccf-s1-show-commit-link-csrf-field.js`

Uses `freshSkillsRoutes()`/`journeyStore.createJourney(...)` per the `jgcc-s1`/`res-s4` precedent. Renders via `handleGetChatHtml` for a journey-linked, non-`definition-of-ready` session, and:
- AC1: regex-extracts `var CSRF_TOKEN = "([a-f0-9]+)";` from the response HTML; asserts it equals `req.session.csrfToken`.
- AC2: regex-extracts the `showCommitLink` function body (from `function showCommitLink()` to its matching closing, via balanced-brace or a documented up-to-the-next-named-function boundary) and asserts it contains a `name=\"_csrf\"` construction referencing `CSRF_TOKEN` (not a hardcoded/empty string).
- Negative check: asserts the OLD broken pattern (a `<form ... gate-confirm ...>` immediately followed by `<button` with no `_csrf` in between, inside the `showCommitLink` body specifically) is absent.

## Coverage gaps

AC3 is manual/live by nature — the actual bug only manifests when the browser executes the injected client-side JS against a real streaming response, which is not practical to simulate in a Node-only unit test without a full browser harness. This mirrors `jgcc-s1`'s own AC3's "not automatable" framing for its equivalent live-reproduction check. Handled via a documented manual verification step run against `wuce-staging` after merge and deploy, using the exact reproduction method (`e2e-test-*` feature, fresh journey, single click, zero idle wait) that found the bug.
