# Review: wfp.11a — Interactive allocation assignment UI: server routes and initiative-centric view

**Run:** 1
**Date:** 2026-05-27
**Reviewer:** Copilot /review skill
**Story artefact:** artefacts/2026-05-26-bsr-workforce-planner/stories/wfp.11a.md

---

## FINDINGS

**1-M1 — MEDIUM — H-E2E triggered: browser-rendered interactive UI requires Playwright E2E test coverage**

wfp.11a introduces `GET /workforce` which serves a full interactive HTML page. ACs 4, 5, 8, 9, 10, 11, 12, and 13 describe UI interactions (initiative list rendering, add/remove assignees, ranked candidate display, save flow, run-map button, unsaved-changes banner, draft badge, pre-population) that cannot be verified by unit tests alone — they require a browser to render DOM, execute inline JavaScript, and drive user interactions.

Per the H-E2E check in /definition-of-ready, a story that produces browser-rendered output must either include Playwright E2E tests or carry a RISK-ACCEPT with a manual smoke test script.

The test plan must include a Playwright spec file at `tests/e2e/wfp11a-assignment-ui.spec.js` covering the behavioral ACs (4, 5, 8, 9, 10, 11, 12, 13). The spec must start a test server (or use the existing Playwright `baseURL` config) before navigating to `GET /workforce`. CSS-layout-only aspects (1280px no-horizontal-scroll, colour variables) cannot be verified by behaviour tests and must be covered by RISK-ACCEPT per the B2 rule with a post-implementation manual smoke test step.

**1-L1 — LOW — AC10 spawn invocation path unspecified**

AC10 states the handler calls `child_process.spawn` to execute "the workforce-map script (wfp.3/wfp.4)" but does not specify the exact command (e.g., `node src/workforce/map.js`) or whether the script is invoked via the package `scripts` entry, a `bin/` entry, or a direct path. An implementer reading only the story cannot determine the exact `spawn()` arguments.

The DoR contract must specify the exact spawn command and working directory for the handler.

---

## SCORES

| Category | Score | Notes |
|----------|-------|-------|
| A — Traceability | 5 | Epic, discovery, and benefit-metric references all present and correct. M1 and M2 references accurate — mechanism sentences are specific (removing hand-authored JSON bottleneck, enabling full assignment-to-reconciliation loop). Split from wfp.11 is declared. |
| B — Scope integrity | 5 | Out-of-scope section is explicit and comprehensive: person/squad views, dashboards/workforce.html, auth beyond authGuard, download, multi-user, SSE streaming, localStorage, OVER_ALLOCATION_THRESHOLD UI control, portfolio writes. Each exclusion is clearly bounded to a Phase 2 or wfp.11b concern. |
| C — AC quality | 5 | 12 ACs all in GWT format. Exact route patterns quoted (`else if (pathname === '/workforce' && req.method === 'GET')`). Exact JSON response shapes specified (AC3, AC10). Atomic write sequence specified (AC3). Path traversal allowlist regex specified (AC14). AC15 explicitly requires first-class `else if` branch — prevents a common implementation shortcut. |
| D — Completeness | 4 | All template fields populated. Named persona (Head of Engineering). Complexity 3 with rationale. NFRs present in the architecture constraints block. One gap: no explicit NFRs section separate from architecture constraints — the DoR will surface this under W1. Minor deduction only as the constraints are functionally equivalent to NFRs for this story. |
| E — Architecture compliance | 5 | CommonJS, no new deps, authGuard wrapping, inline HTML/JS/CSS, atomic write, path traversal protection, child_process.spawn (not require) — all consistent with architecture-guardrails.md and the established web-ui patterns in the repo. Explicit constraint that dashboards/workforce.html is not modified. Four-route pattern matches existing server.js structure. |

**Overall score: 4.8**

---

## VERDICT: PASS

1 MEDIUM finding (1-M1 — H-E2E trigger; Playwright E2E tests required in test plan) and 1 LOW finding (1-L1 — exact spawn command must be specified in DoR contract). No HIGH findings. Story does not require rework before test planning.

**Notes for /test-plan:**
- Route handler unit tests (AC1, AC2, AC3, AC14, AC15) should use a lightweight HTTP request mock (create an IncomingMessage-like object with the required properties) — no need to start a full server for unit coverage. Inject a mock `authGuard` that calls its callback immediately. This pattern is consistent with other web-ui route tests in the repo.
- AC2 has several sub-cases: all files present; `initiative-map.json` absent (null); `allocation-input.json` absent (null); portfolio directory contains a file whose slug contains `../` (omitted with warning). Each sub-case should be a separate test row.
- AC3 needs three distinct tests: valid JSON → 200 + atomic write confirmed; invalid JSON → 400; disk write failure → 500.
- AC14 path traversal test must assert both: no file read attempted (use a spy on `fs.readFileSync`) AND the warning log was written to stderr. Test the slug `../secrets/token` and the slug `/etc/passwd`.
- Playwright E2E tests (AC4, AC5, AC8, AC9, AC10, AC11, AC12, AC13) must run against a live test server. Add a `globalSetup` fixture that starts `src/web-ui/server.js` on a test port with a seeded `workforce/` directory of fixture files. Tear down after the suite.
- For AC8 candidate ranking: the test server fixture must include a portfolio slug JSON with `requiredTags` set and a roster with members whose skills partially overlap — verify that the UI renders candidates in descending score order.
- AC10 (run-map): in the E2E test, the actual `workforce-map` script may not be present in the test environment. Use a test-double: set an environment variable `WORKFORCE_MAP_CMD` that the handler reads instead of the hardcoded path, or mock the child_process response in the test server fixture.
- AC12 (draft flag): the fixture `allocation-input.json` for this test must have `_autoderived: true` at the root level. Verify the badge text contains "Draft" or "needs review" (exact string to be confirmed from implementation).
