# coha-s6 fixture: a real issue opened by PostHog's GitHub destination

**Story:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s6-alert-to-github-issue-bridge.md (AC3, check T3)
**Consumed by:** coha-s7 (artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s7-incident-record-from-production-error-issue.md), whose recognition rule is written from this note, not from PostHog's documentation.
**Captured:** 2026-11-13, one approved run of the alert's test function (mock switched off) against project 10908, with a clearly labelled sample event (message `coha_s6_t3_test_sample`, one frame in `src/web-ui/routes/auth.js`), not a real scrubbed production event.
**Resulting issue:** https://github.com/heymishy/skills-repo/issues/1088 (opened 2026-11-13T06:44:20Z). It is a test issue, not an incident; it must be closed by the operator and must never produce an incident record.

## What GitHub reports about the issue (read through the API, not the web page)

| Field | Observed |
|-------|----------|
| `user.login` | `posthog[bot]` |
| `user.type` | `Bot` |
| `author_association` | `NONE` |
| `performed_via_github_app` | null (so recognise by `user`, not by this field) |
| `labels` | none (PostHog applies no label) |
| `comments` | 0 |
| `state` | open |

GitHub reserves the `[bot]` suffix for GitHub Apps, so a human account cannot be given the login `posthog[bot]`. The `gh` command line shows the same account as `app/posthog`; the API login above is the value an Actions workflow receives in the event payload as `github.event.issue.user.login`.

## Title and body, exactly as produced

Title: `Error: coha_s6_t3_test_sample` (shape: exception type, a colon and a space, then the exception message).

Body (between the markers):
```
```
coha_s6_t3_test_sample
```


```
  File "auth.js", line: 131, in: handleBootstrap
```

[View in PostHog](https://us.posthog.com/project/10908/error-tracking/00000000-0000-4000-8000-0000c0a56003)
```

Shape: the message in a code fence; then a code fence with up to 5 frame lines, each `File "<file base name only>", line: <n>, in: <function name>` (the sample frame was `src/web-ui/routes/auth.js`, shown as `auth.js`, so no directory path appears); then a blank line and a link `[View in PostHog](https://us.posthog.com/project/10908/error-tracking/<issue id>)` where `<issue id>` is a UUID.

## What this means for coha-s7's recognition rule

- Author: `user.login` equals exactly `posthog[bot]` and `user.type` equals `Bot`.
- Link: the body contains `https://us.posthog.com/project/10908/error-tracking/` followed by a UUID (`[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}`); the UUID is the PostHog issue id for the idempotency tag.
- Title: do not use it for recognition. Take the fixed code from the part after `<type>: ` only after the author and link checks pass.
- The body holds no first-seen time, count or environment, as the revised story says.
- This sample's issue id is a made-up all-zero-prefixed UUID. coha-s7 tests must use it only as a fixture, and the dry run must be able to run against issue 1088 without writing to the real incident file.

## Observations for coha-s6 AC3 and AC4

- Exactly one issue was created by the one run. A second look a few minutes later is recorded in the DoD.
- The frame line shows the file base name only, which is narrower than the story expected (`src/` or `node_modules/` paths). The "no source lines, no tenant text" part of AC3 is met for this sample; whether a real scrubbed event is clean is the question AC4 exists for.
