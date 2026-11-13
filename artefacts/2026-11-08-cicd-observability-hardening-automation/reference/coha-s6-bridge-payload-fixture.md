# coha-s6 bridge payload fixture (rendered by PostHog, outgoing request simulated)

**Story:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s6-alert-to-github-issue-bridge.md (first task)
**Captured:** 2026-11-13 through PostHog's test invocation of a disabled `template-webhook` destination on project 10908, with the outgoing request simulated (PostHog logged the request it would have made; nothing was sent anywhere, no receiver, no secret).
**Draft destination (disabled, placeholder URL, never enabled):** id `01a1d3ce-ad2c-0000-64b2-d32e9b55609b`. It is repointed to the real bridge at AC6 or deleted.

This is a rendering of the body template we wrote, from a sample created-event we supplied (an all-zero-prefixed issue id and the fixed code `tenant_admin_bootstrap_failed`). It proves the template and the route agree with each other. It does not prove a real `$error_tracking_issue_created` event fills the template's fields; only AC9 shows that.

## Body template (the `body` input of the destination)

```json
{
  "schema": "coha-s6/v1",
  "posthog_issue_id": "{event.properties.$exception_issue_id}",
  "code": "{event.properties.$exception_values[1]}",
  "environment": "{event.properties.environment}",
  "first_seen": "{event.properties.exception_timestamp}",
  "posthog_issue_url": "{project.url}/error-tracking/{event.properties.$exception_issue_id}"
}
```

## Request PostHog would send (as logged by the simulation)

Method: `POST`. Headers: `Content-Type: application/json` (plus, at AC6, the secret header added through the destination's secret-headers input, which is encrypted and never logged). Body:

```json
{
  "schema": "coha-s6/v1",
  "posthog_issue_id": "00000000-0000-4000-8000-0000c0a56005",
  "code": "tenant_admin_bootstrap_failed",
  "environment": "production",
  "first_seen": "2026-11-13T07:30:00.000Z",
  "posthog_issue_url": "https://us.posthog.com/project/10908/error-tracking/00000000-0000-4000-8000-0000c0a56005"
}
```

## Notes the test plan relies on

- All six body fields are strings. A field whose expression is empty on a real event renders as an empty string, not as a missing key; the bridge must treat empty and missing alike and log the field name (the story's Audit NFR).
- `Content-Type` must be set explicitly in the destination's headers input; an unset headers input sends no header (the draft showed `headers: null`).
- `posthog_issue_url` is built by PostHog from the project URL and the issue id; the bridge must not trust it blindly and must check it starts with `https://us.posthog.com/project/` before putting it in a public issue.
- The `schema` value lets the bridge reject a body from any other source with 400.
- No count and no message beyond `code` is carried, matching the story's fixed fields.
