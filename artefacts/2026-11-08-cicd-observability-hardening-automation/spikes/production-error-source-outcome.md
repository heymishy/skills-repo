# Spike Outcome: Which observability approach fits this app's production error detection?

**Opened:** 2026-11-12 | **Scope:** thorough | **Steps taken:** 9 of 10 planned (step 8 skipped by agreement; step 10 is this document)
**Done condition met:** Partially — the comparison covers all seven candidates against all six criteria, but two candidates rest on documentation only (the Fly HTTP Logs API was never tested, and PostHog alert delivery is unstated), and vendor figures conflict in places.
**Artefact path:** `artefacts/2026-11-08-cicd-observability-hardening-automation/spikes/production-error-source-outcome.md`
**Brief:** `production-error-source-brief.md`. **Evidence:** `production-error-source-working-notes.md`.

---

## Outcome: REDESIGN

Polling the platform's logs is ruled out. The app should record known errors itself when they happen, and the redesigned coha-s4 (the Production Log Scan story) becomes a small job that reads those records. Whether the records are written to the app's own database table or sent as OpenTelemetry (OTel) logs to PostHog is a choice between two workable routes; this outcome recommends the database table first, written through a thin recording function that can later also emit OTel.

### What was found

- **Fly CLI:** `fly logs --no-tail` returned exactly 100 lines spanning about one second of production traffic (measured 2026-11-12). It has no `--since` flag. It cannot detect anything on a 6-hour interval.
- **Fly HTTP Logs API:** documented with about 7 days of history and `next_token` paging, but described by Fly as not officially supported for external use. Untested: the one attempt failed and exposed a token, and the test was then skipped.
- **Fly NATS stream:** live only, no retention, experimental.
- **PostHog exceptions:** 3 `$exception` events in 30 days, all from explicit `captureException` calls. The known case, `tenant_admin_bootstrap_failed`, is logged at warn level with `_logger.warn` (`auth.js:131`) and `console.warn` (`auth-email.js:91`) and never reaches PostHog.
- **PostHog Logs:** accepts OTLP (OpenTelemetry's wire format) at a documented endpoint with the project token the app already holds; 50 GB per month free; retention 7 or 14 days (sources conflict). Production read on 2026-11-13: zero log entries in the last 7 days and no services listed, so nothing is sent today. Alert delivery, scheduled querying and PII scrubbing are not described in the documentation.
- **OTel for pino:** five to six packages plus an init file loaded before the app, or one package (`pino-opentelemetry-transport`). Output to Fly's stdout continues unchanged. `console.warn` call sites would need moving to pino to be forwarded.
- **Grafana Cloud:** 50 GB, 14 days, drops data over the limit. **Honeycomb:** 20M events, 2 triggers, logs over OTLP unconfirmed.
- **The app can write to its own database:** it already creates tables at boot (`credit_audit_log`, `sync_log` and others). `workspace/incidents.json` is a repo file the running app cannot write.
- **Teams is not in use**, and `TEAMS_WEBHOOK_URL` is empty.

### Comparison

Reliability = whether an error can be detected within one scan interval without being missed. Standards = OTel and portability. Footprint = new dependencies and operator setup. Cost = per month plus upkeep. Privacy = tenant data kept out or a third party acceptable. Delivery = how a detection reaches a person without Teams and whether it can create an incident record.

| Candidate | Reliability | Standards | Footprint | Cost | Privacy | Delivery without Teams |
|---|---|---|---|---|---|---|
| 1. Fly CLI polled | Fails: 1-second buffer, measured | None | None | Free | No third party | Needs a poller and a destination |
| 2. Fly HTTP Logs API paged | Unknown: about 7 days documented, untested; unsupported externally | None | A Fly token with read access in CI | Free | No third party | Needs a poller and a destination |
| 3. pino transport or recorder writing known errors to the app's database | Good: written at the moment of the error, held until read; misses only errors never routed through the recorder | Not OTel by itself; a recorder function can later also emit OTel | No new package; one table and one function; no new operator setup | Free (existing database) | Stays inside systems already run; the recorder chooses the fields so tenant data can be left out | A job (or admin route) reads the table and creates the incident record; no Teams needed |
| 4. Explicit PostHog exception capture at known failure points | Good for the points chosen; same coverage rule as 3 | PostHog-specific | None (already depends on `posthog-node`) | Free tier | Event properties already go to PostHog today | Reading it back needs a PostHog personal API key in CI |
| 5. OTel logs to PostHog | Good once wired and verified; batching can lose the last batch on shutdown | Yes | 5 to 6 packages and an init file; project token already held | Free up to 50 GB | Whole log lines go to a third party; PII scrubbing undescribed | Alert delivery unstated; needs the query API plus a job |
| 6. OTel logs to Grafana Cloud or Honeycomb | Same as 5 | Yes | As 5 plus a new vendor account | Free tier; Honeycomb logs fit unconfirmed | New third party and review | Alert routes exist but need an account and setup |
| 7. Fly log shipper to an external service | Good from the moment it connects; no backfill | Via the sink | A shipper app on Fly plus a sink account | Shipper app cost plus sink | Everything leaves, including tenant data | As 6 |

### Reasoning

Candidates 1 and 2 fail or are unproven on the one thing that matters, and 2 additionally depends on an unsupported interface. Candidates 5 to 7 send whole log lines to a third party, which is a privacy question for an app that carries tenant data, and their alert delivery without Teams is not established. Candidates 3 and 4 detect at the moment of the error and keep the data inside systems already run, and 3 has the smallest footprint, so it fits the "close to zero cost, solo operator" case best. Candidate 3 does not use OTel by itself, so portability is weaker; but the recorder is a single function, and adding an OTel emit inside it later does not change its callers, so the choice does not lock the door.

Every option still needs the same last step, a job that turns a detection into an incident record and tells a person, because the incident store is a repo file and Teams is off. That step is the real content of the redesigned story.

---

## If REDESIGN

**What needs to change:** coha-s4 stops being "scan Fly logs with a CLI" and becomes two parts. First, a recorder in the app: a function called at known failure points (starting with `tenant_admin_bootstrap_failed` in both `auth.js` and `auth-email.js`) that writes a row to a new table created at boot. Second, a reader: a scheduled job or admin route that reads new rows and creates incident records through the existing incident store, with a destination other than Teams for the notification.
**Suggested direction:**
- Recorder into the app's database, fields chosen to exclude tenant data. Tests must call the real route handler with a real failure and read the row back, not mock the logger.
- The reader runs where it can write incidents: either a GitHub Actions job that calls an authenticated admin endpoint (the repo file `incidents.json` is written by the job, not the app), or an admin page. The destination without Teams could be a GitHub issue or the existing incident record plus the product page that already renders it.
- Leave OTel as a later addition inside the recorder, and check PostHog Logs retention, alerting and PII scrubbing then, before sending anything there.
- Do not repair or re-enable the old script. `gh workflow disable "Production Log Scan"` is still outstanding and is the operator's action.
**Return to:** `/definition` for the revised coha-s4 (a new story replacing it, with its own benefit-metric link), then `/review`, `/test-plan`, `/definition-of-ready`. Teams-dependent stories (coha-s2, coha-s3) stay on hold.

---

## What remains unknown

- Whether the Fly HTTP Logs API works with the existing `FLY_API_TOKEN` and how far back it goes. Not needed for this outcome; it matters only if log polling is ever reconsidered.
- PostHog Logs: whether it is enabled for the project, retention (7 or 14 days), alert triggering and delivery, scheduled querying, and what PII scrubbing does. Needed before choosing route 5 later.
- Vendor prices and limits are from vendor pages and search summaries that disagree; re-check before relying on them.
- Which other error patterns should be recorded beyond `tenant_admin_bootstrap_failed` (out of scope here), and what row volume a recorder produces.
- How a detection should reach a person without Teams: a GitHub issue, an email, or only the product page. This is a design choice for the story.
- The exposed Fly auth token: the operator was advised to revoke or rotate it; not confirmed done.

---

## Discovery fields resolved

| Discovery field | Changed? | Updated value / clarification |
|-----------------|----------|-------------------------------|
| Problem statement | No | Production errors are noticed by luck; confirmed, with the root causes of the failed scan now measured. |
| MVP scope | Yes | Log scanning is replaced by app-side recording plus a reader job. |
| Assumptions | Yes | "Polling the platform's logs is the right detection method" is invalidated by the 1-second buffer. |
| Known risks | Yes | Adds: recorder coverage depends on which failure points call it; the incident store is not writable from the app. |
| Technical constraints | Yes | Running app cannot write `workspace/incidents.json`; Teams unavailable; Fly API unsupported externally. |

**Discovery re-run needed?**
- [x] No — findings clarify details within the existing framing
- [ ] Yes

---

## Decision log reference

To be recorded in `artefacts/2026-11-08-cicd-observability-hardening-automation/decisions.md` once the operator confirms this outcome.
