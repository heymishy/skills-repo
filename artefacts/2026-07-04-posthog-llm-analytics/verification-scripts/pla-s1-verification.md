# AC Verification Script: pla-s1 — Extend posthog-server.js

**Story:** Extend posthog-server.js with identify, groupIdentify, captureException, and $groups support
**For:** Pre-code sign-off (confirm the described behaviour is correct) · Post-merge smoke test · Delivery review
**Date:** 2026-07-04

---

## Setup

This story adds server-side methods to an internal Node.js module. All verification is done by running the automated test suite — there is no UI to interact with and no browser required.

**Before you begin:**

1. Confirm `POSTHOG_KEY` is set in your `.env` file (or Fly.io secrets for production). The tests use a synthetic key and do not need a real value.
2. If verifying after deploy: confirm `POSTHOG_KEY` is set in Fly.io (`fly secrets list` — confirm `POSTHOG_KEY` appears).
3. Run the test suite:

```powershell
# PowerShell
node tests/check-pla-s1-posthog-module.js
```

```bash
# bash/zsh
node tests/check-pla-s1-posthog-module.js
```

All 16 tests should print `[PASS]`. Any `[FAIL]` line indicates a broken AC — the AC name in the failure message tells you which one.

---

## Scenario 1 — identify() sends the right PostHog event (AC1)

**What to check:** When a user logs in, the server should send a `$identify` event to PostHog that links their login name, tenant, and role.

**How to verify:** The automated tests (A1, A2) confirm this. Optionally verify manually in PostHog:
1. Start a skill session as a logged-in user after this story ships.
2. In PostHog → People, search for the user's GitHub login.
3. The person record should show `login`, `tenantId`, and `role` as properties.

**What broken looks like:** The person record exists but has no `login`, `tenantId`, or `role` properties — or the person record is missing entirely.

---

## Scenario 2 — groupIdentify() links the tenant as a PostHog Group (AC2)

**What to check:** When a tenant uses the platform, PostHog should create or update a "company" group record for that tenant.

**How to verify:** Automated tests B1, B2 confirm the correct HTTP body shape. Optionally:
1. After deploy, in PostHog → Groups → filter by type "company".
2. The tenant's GitHub org login should appear as a group key.
3. The group should have a `name` property equal to the tenant ID.

**What broken looks like:** No group records appear in PostHog, or the group type is wrong (not "company").

---

## Scenario 3 — captureException() records errors correctly (AC3)

**What to check:** When the server catches an error, PostHog receives a `$exception` event with the error type, message, stack trace, and any additional context.

**How to verify:** Automated tests C1, C2, C3 confirm. No manual PostHog check is needed pre-deploy. Post-deploy: if an LLM error occurs (you can trigger one by using an invalid skill name), check PostHog → Live Events for a `$exception` event. It should show `$exception_type: "Error"` and a non-empty `$exception_stack_trace_raw`.

**What broken looks like:** The `$exception` event is missing, or it shows up with no stack trace, or the additional context (e.g. `skillName`) is absent.

---

## Scenario 4 — capture() with groups adds $groups to the event (AC4)

**What to check:** When a caller passes a fourth `groups` argument to `posthog.capture()`, the PostHog event body includes `$groups: { company: tenantId }`. This is what makes events show up under the correct tenant group in PostHog.

**How to verify:** Automated test D1 confirms. No manual step needed pre-deploy.

Post-deploy: In PostHog → Group analytics → filter events by company group. If events are attributed to the correct tenant, the `$groups` field is wired correctly.

**What broken looks like:** Events appear in PostHog but are not attributed to any group. The group analytics page shows no events.

---

## Scenario 5 — existing callers still work (AC5)

**What to check:** Before this story, `posthog.capture()` takes 3 arguments. After this story adds a 4th optional `groups` argument, all existing call sites (which pass only 3 arguments) must still work exactly as before — no `$groups` key added to their events.

**How to verify:** Automated test E1 confirms. No manual step needed.

**Why this matters:** If the existing `stage_completed`, `skill_turn`, and `journey_created` events suddenly gain a `$groups` key when they shouldn't, PostHog attribution will be incorrect.

---

## Scenario 6 — PRIVACY_MODE constant is correct (AC6)

**What to check:** When `POSTHOG_PRIVACY_MODE=true` is set in the environment, the module exports a truthy constant that other code can check before deciding whether to include prompt content in PostHog events.

**How to verify:** Automated tests F1, F2 confirm. No manual step needed pre-deploy.

Post-deploy: Confirm via `fly secrets list` whether `POSTHOG_PRIVACY_MODE` is set. The default (absent) means privacy mode is OFF — prompt content may be sent to PostHog. If this is not desired, set `fly secrets set POSTHOG_PRIVACY_MODE=true`.

---

## Scenario 7 — no-op when PostHog key is absent (AC7)

**What to check:** If `POSTHOG_KEY` is not set (e.g. in a local dev environment), all four PostHog methods must silently do nothing — no errors, no crashes.

**How to verify:** Automated tests G1–G4 confirm. No manual step needed.

**What broken looks like:** Starting the server without `POSTHOG_KEY` causes a crash or error in the console when any PostHog method is called.

---

## Reset instructions

Each automated test resets its own state. No server restart or database reset is needed between scenarios. If running the manual PostHog checks, they are read-only (you're observing existing data, not creating state).

---

## Sign-off (pre-code)

> I have read the scenarios above and confirm the described behaviours are correct and complete for this story.
>
> Signed: _________________________ Date: _____________
