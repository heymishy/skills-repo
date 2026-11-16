# sub-s1 verify-completion evidence

Date: 2026-11-16. Branch: `feature/sub-s1-retire-answer` (red tests 760272c7a, then the implementation commit).

## Result

5 of 6 acceptance criteria (AC) verified by automated tests that have run. AC6 (live: one signed-in POST to `/api/skills/discovery/sessions/00000000-0000-0000-0000-000000000000/answer` on production answers 410 and opens no new GitHub issue) can only be observed after deploy.

## Tests

- `tests/check-sub-s1-answer-route-retired.js`: 6 passed, 0 failed. Written first and run red: T1 answered 500, T2 saw the legacy adapter called, T3 answered 303 (a stub from T2 leaked into it; the test now restores the throwing default after T2), T6 found no `handleAnswerRetiredHtml`; T4 (anonymous POST answers the same as another guarded route) and T5 (the legacy handler behaves as before when called directly with a stub) passed before the change as invariants. Mapping: T1 AC1, T2 AC2, T3 AC3, T4 AC4, T5 AC5, T6 the never-throws NFR.
- T3 sends skill and session segments `%22%3E%3Cimg%20src%3Dx%20onerror%3D1%3E`: the handler decodes them for display and escapes them, so no raw `<img` reaches the page, and the chat link is `encodeURIComponent`-built.
- **No existing test was edited.** Existing tests that touch the route or handler pass unchanged: `check-wuce24-guided-question-form`, `check-vrne-s2-skill-session-gate`, `check-cmtt-s1-chat-message-text-truncation-fix`, `check-p4-spike-d`, `skill-launcher.test.js`.
- Behaviour note for review: a signed-in viewer-role user who posts to this route now gets the 410 page instead of the viewer write-block's 403; the route does nothing in either case, and `check-vrne-s2-skill-session-gate` passes.

## Full suite (local, Windows)

870 files, 6 failed, the same six as the `bfl-s1` and `ciw-s2` runs and none related to this change: `scripts/check-pipeline-state-integrity.js` (C3, tfhc-s1; also fails in CI and is in the baseline), `tests/check-pcr-s1-test-runner.js`, `tests/check-p4-enf-second-line.js`, `tests/check-p3.5-validate-trace.js` and `tests/check-rtvap-s1-archived-test-plan-coverage.js` (these four fail on this machine because `bash` and `sh` do not work; they pass in CI), and `tests/check-cat-s1-core-trace-builder.js` (best of 7 walks 67.1 ms this time, while other commands ran in parallel on this machine; passes alone). The suite side effect on `artefacts/test-slug/ideate.md` was reverted and the stub files it writes under `artefacts/` were not staged.

## Open

- AC6 live: after merge and deploy, one POST from a signed-in production tab; expect 410 and no new GitHub issue within a few minutes. Then the operator can close issue #1121 and incident PR #1122.
- Follow-ups (not in this story): remove the dead question-flow code and its tests; the chat page's fallback form action still points at the retired route.
- `pws-s1` (wiring smoke test): remove this route from its known-defects list when this merges.

## AC6 observed on staging (2026-11-16, build 4dfe7d6, agent-run, signed-in staging tab)

`POST /api/skills/discovery/sessions/00000000-0000-0000-0000-000000000000/answer` with a form body on `wuce-staging` answered **410** with the retired-form page (27 KB shell page, no error text). The same request before the change answered 500 "Adapter not wired: submitAnswer" (20 of 20 on staging, and the production request that opened issue #1121).

Not yet observed on production: production still runs `eed6b0f` (#1119) until the operator promotes the staging build. After promotion, one signed-in POST from a production tab should answer 410 and open no new issue; then the operator can close issue #1121. Staging does not feed the issue bridge, so only a production request can show "no new issue".
