# Decision Log: cicd-observability-hardening-automation

**Feature:** CI/CD, Observability & Hardening Automation
**Discovery reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/discovery.md
**Last updated:** 2026-11-08

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-11-08 | ASSUMPTION | discovery (/clarify)**
**Decision:** Build a new outbound Teams notification mechanism (an Incoming Webhook URL plus new code) for the chat-notification adapter, rather than reusing `approval-channel`'s existing HMAC/dispatch pattern.
**Alternatives considered:** Assumed reuse of the existing inbound HMAC/dispatch pattern (`src/approval-channel/adapters/teams-adapter.js`) would work for outbound sending too — this was the discovery draft's original assumption before /clarify.
**Rationale:** Read `teams-adapter.js` directly during /clarify. `TEAMS_WEBHOOK_SECRET` authenticates *inbound* requests (verifies a signature on an incoming webhook) — it has no outbound-send capability and no credential usable for sending. Posting a message to a Teams channel requires a different mechanism (a channel Incoming Webhook URL, or the Graph API with OAuth app registration), which needs its own secret (per `product/constraints.md` #12, stored in a secrets store, never the agent's environment) and new code.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /clarify session, 2026-11-08
**Revisit trigger:** If Microsoft Teams later exposes a way to send messages using the same credential/mechanism as the existing inbound webhook (considered unlikely), or if this initiative's chat target changes from Teams to Slack/email.
---
**2026-11-08 | RISK-ACCEPT | discovery (/clarify) — retroactively logged 2026-11-08**
**Decision:** Accept the critical `dompurify` finding surfaced by `npm audit --audit-level=high` as a known, currently-unaddressed vulnerability, independent of this discovery — fixing it is out of this initiative's scope, which builds the vulnerability-check step itself (story 3), not a remediation workflow.
**Alternatives considered:** Fix `dompurify` now, inline with this discovery session, since `fixAvailable: true` was confirmed. Rejected — this discovery's job is to confirm the audit step's real noise rate (1 actionable finding, not a flood), not to perform ad-hoc remediation outside any story's test plan or review.
**Rationale:** Running `npm audit --audit-level=high` against this repo during /clarify surfaced exactly 1 critical finding (`dompurify`, fix available) among 3 total vulnerable packages — already noted in this feature's own discovery.md Assumptions and Risks as "worth a RISK-ACCEPT or fix outside this initiative's own scope." That note was never actually logged as a decision until a later cross-tranche consistency audit (2026-11-08) found it missing — this entry closes that gap.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner) — flagged during /clarify 2026-11-08, logged retroactively the same day after an audit found the flagged note was never formalized.
**Revisit trigger:** When story 3 (the vulnerability-check CI step) ships, this finding should be the first real finding it surfaces — confirm it still reproduces, and either fix it then (via the short-track pipeline) or re-confirm the RISK-ACCEPT with a fresh rationale if it's still deliberately deferred.
---

---
**2026-11-09 | RISK-ACCEPT | benefit-metric**
**Decision:** Metric owner on `benefit-metric.md` is self-assigned to Hamish King (Platform Owner). Reviewers remains `[Pending]` rather than self-assigned.
**Alternatives considered:** (A) Self-assign Hamish King as both owner and reviewer — rejected, since the point of an independent reviewer is a second perspective on whether a metric is honest and measurable, which self-review cannot provide. (B) Fabricate a placeholder reviewer role to satisfy the skill's completion check — rejected, contradicts this pipeline's "never invent" discipline for unfilled fields.
**Rationale:** Metric owner is a genuine accountability role this operator already holds across every delivery artefact in this repo; self-assigning it reflects reality rather than inventing a role. The Reviewers field is left honestly unfilled because no second contributor exists in this personal-scope team to fill it.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), 2026-11-09
**Revisit trigger:** If a second contributor ever joins this project, assign them as Reviewer on this and every other open benefit-metric artefact rather than continuing to leave the field pending.
---

---

---
**2026-11-09 | RISK-ACCEPT | definition-of-ready — dompurify finding re-confirmed (coha-s3 Tier 3 DoR gate)**
**Decision:** Re-confirm, rather than resolve, the `dompurify` RISK-ACCEPT (originally logged 2026-11-08) ahead of `coha-s3`'s DoR sign-off, per the Tier 3 metric's explicit "Sign-off required at DoR: Yes."
**Alternatives considered:** (A) Fix it now, inline with this DoR check, since `npm audit fix` is available — rejected: fixing a dependency is an implementation action with its own test/PR cycle, not a DoR activity, and `coha-s3` (the story that will make this finding visible by CI) has not been implemented yet; fixing it out-of-band here would bypass this epic's own test plan for detecting exactly this kind of finding. (B, chosen) Re-run `npm audit --audit-level=high` directly against this repo at DoR time, confirm the finding still reproduces with the same shape, and re-confirm the RISK-ACCEPT with fresh rationale rather than silently reusing the stale 2026-11-08 entry.
**Rationale:** Ran `npm audit --audit-level=high` on 2026-11-09: `dompurify` <=3.4.16 still critical, fix still available via `npm audit fix` (5 CVEs, same package). Two additional non-critical findings also present (`katex` moderate, `mermaid` low, both via `katex`) — unchanged from the original /clarify-time audit's "3 total vulnerable packages, 1 critical" framing, not a new or worsened finding. The finding is confirmed still real and still unresolved, exactly matching the condition the Tier 3 metric's DoR gate exists to catch.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /definition-of-ready for coha-s3, 2026-11-09
**Revisit trigger:** Unchanged from the original entry — once `coha-s3` ships and its first real CI run surfaces this finding via the new vulnerability-check step, fix it then (short-track pipeline) rather than carrying a third RISK-ACCEPT forward.
---

---
**2026-11-09 | RISK-ACCEPT | definition-of-ready — W4 verification-script domain-expert review (all 4 stories)**
**Decision:** Acknowledge, rather than resolve, DoR Warning W4 ("verification script reviewed by a domain expert") for all 4 stories in this feature (coha-s1, coha-s2, coha-s3, coha-s4) with a single shared entry, rather than four duplicate ones.
**Alternatives considered:** (A) Block DoR sign-off on all 4 stories until a second person reviews each verification script — rejected, no second contributor exists in this personal-scope project to perform that review. (B) Have the story author (also the Platform Owner) self-review each script as if an independent check — rejected as not genuinely satisfying the warning's intent; self-review of one's own drafting is exactly the risk W4 exists to catch, not a resolution of it. (C, chosen) Acknowledge explicitly as an open risk, accepted once for the whole feature, with a concrete revisit trigger.
**Rationale:** Hamish King, as story author and Platform Owner, is the only available reviewer in this personal-scope project — the same structural gap already acknowledged for the metric-owner/reviewer split in this feature's benefit-metric.md (2026-11-09 RISK-ACCEPT). Logging once for all 4 stories avoids four near-identical entries for the same root cause.
**Made by:** Claude Sonnet 5, confirmed by Hamish King (Platform Owner), during /definition-of-ready, 2026-11-09
**Revisit trigger:** If a second contributor joins this project, have them formally review these 4 verification scripts before the next time any of these stories' scope changes (not retroactively, unless a defect traced to an unreviewed scenario is found first).
---

---
**2026-11-13 | ARCH | spike outcome — production error detection is app-side recording, not log polling**
**Decision:** Production error detection will be redesigned (spike outcome REDESIGN): the app records known errors itself when they happen, into a new table in its own database through a thin recording function, and a separate reader job turns new rows into incident records. The Production Log Scan approach (coha-s4 as built) is abandoned and not repaired.
**Alternatives considered:** (A) Fly CLI polled — rejected, the measured buffer is 100 lines spanning about one second. (B) Fly HTTP Logs API paged — rejected for now, untested and unsupported for external use. (C) Explicit PostHog exception capture — viable, but reading it back needs a PostHog read key in CI and it is PostHog-specific. (D) OpenTelemetry (OTel) logs to PostHog, Grafana Cloud or Honeycomb, or a Fly log shipper — deferred, they send whole log lines to a third party (tenant data), and alert delivery without Teams is not established; PostHog Logs held 0 entries in the last 7 days because the app sends none. (E, chosen) App-side recorder plus reader job.
**Rationale:** Smallest footprint, zero cost, detection at the moment of the error, tenant data stays inside systems already run, works without Teams. OTel can be added later inside the recorder without changing its callers. Light production traffic does not change the choice: it makes the recorder cheaper, and the PostHog result was caused by nothing being sent, not by low activity. Evidence: `spikes/production-error-source-outcome.md` and `spikes/production-error-source-working-notes.md`.
**Made by:** Claude Sonnet 5.5, confirmed by Hamish King (Platform Owner), 2026-11-13
**Revisit trigger:** If the recorder cannot cover the failure patterns that matter, or a second tenant-facing team needs searchable logs, re-open the OTel route and check PostHog Logs retention, alert delivery and PII scrubbing first. If the Fly HTTP Logs API is ever needed, test it with an operator-prepared token that cannot echo.
---

---
**2026-11-13 | ARCH | amends the entry above — production error detection uses PostHog error capture plus a bridge, not a custom database recorder**
**Decision:** Replace the hand-built database recorder with PostHog Error Tracking, fed by the app's existing `posthog-node` client: exception autocapture, one `captureException` at the single catch point in `createApp()`, explicit capture for warn-level cases such as `tenant_admin_bootstrap_failed`, and a `before_send` scrubber that rewrites tenant text and removes stack-frame source lines. A PostHog new-issue alert (webhook destination) calls a bridge in the app that opens a GitHub issue and, subject to the open question in the story, creates the incident record. The old Production Log Scan approach stays abandoned.
**Alternatives considered:** (A) Custom database recorder — rejected: would rebuild grouping, counts, alert rules and delivery that PostHog already provides. (B) Sentry free plan — rejected: new vendor and privacy review, 5,000 errors per month, and GitHub issue sync appears to be on paid plans. (C) Grafana Cloud — kept as a later portability target through OTel, not now: new vendor and privacy review, free webhook alerts unconfirmed. (D) OTel logs to PostHog — deferred: whole log lines would leave the app and PostHog's scrubbing for logs is undescribed.
**Rationale:** No new vendor or secret; the app already holds the project token and a client. Local proof of concept (2026-11-13, installed `posthog-node` 5.40.0 against a local sink) showed a thrown request error captured at the one catch point, an unhandled rejection captured by autocapture, warn lines not captured without an explicit call, tenant text removable from the message and stack-frame source lines through `before_send`, and that the app has no Express so `setupExpressErrorHandler` does not apply. Documentation shows the webhook destination accepts custom headers; the live round trip is the story's first acceptance test. Free allowance of 100,000 exceptions per month is far above this app's volume. Light production traffic does not affect the choice.
**Made by:** Claude Sonnet 5.5, confirmed by Hamish King (Platform Owner), 2026-11-13
**Revisit trigger:** If the live webhook check (AC3 of coha-s6) fails or cannot carry a secret header, fall back to a scheduled job reading PostHog's API. If metrics or tracing are wanted, add OTel through the same client, or move to Grafana Cloud, without changing the capture calls. If PostHog retention for exceptions proves shorter than a month, re-check.
---

---
**2026-11-13 | ARCH | coha-s7 — incident record is written by a GitHub Actions workflow (option A)**
**Decision:** The incident record for each production error GitHub issue is created by a workflow triggered when an issue labelled `production-error` is opened, running the existing incident store from `scripts/`, not by the running app writing through the GitHub Contents API.
**Alternatives considered:** (B) The app writes the record through the Contents API as the pipeline-state writer does — rejected: `scripts/` is not in the image, so the store's rules would be re-implemented in `src/`, and the app would gain a repository write it does not otherwise perform.
**Rationale:** Reuses the store and its tests unchanged and keeps the app out of repository writes. Cost: committing to the default branch needs the repo ruleset to allow the bookkeeping path (`workspace/**`), which is an operator action recorded as a coha-s7 DoR prerequisite.
**Made by:** Claude Sonnet 5.5, chosen by Hamish King (Platform Owner), 2026-11-13
**Revisit trigger:** If the ruleset bypass cannot be granted, fall back to option B or to a pull request opened by the workflow.
---

---
**2026-11-13 | RISK-ACCEPT | definition-of-ready — W4 verification-script domain-expert review extended to coha-s5, coha-s6, coha-s7**
**Decision:** Extend the 2026-11-09 shared W4 acknowledgement ("verification script reviewed by a domain expert") from coha-s1 to coha-s4 to the three stories added on 2026-11-13: coha-s5 (capture and scrub), coha-s6 (alert-to-GitHub-issue bridge) and coha-s7 (incident record).
**Alternatives considered:** (A) Block each story's DoR until a second person reviews its verification script — rejected, no second contributor exists. (B) Treat the operator's own check as the domain-expert review — rejected, the operator is the author and owner, the same reasoning as the 2026-11-09 entry. (C, chosen) Acknowledge explicitly as an open risk with a revisit trigger.
**Rationale:** Same root cause as the 2026-11-09 entry. The operator stated on 2026-11-13 that they verified the scripts; that statement is recorded here but is not counted as independent review. Only coha-s5 has a verification script today; coha-s6 and coha-s7 will get theirs at /test-plan, so for those two this entry is an advance acknowledgement and is re-checked at their DoR.
**Made by:** Claude Sonnet 5.5, confirmed by Hamish King (Platform Owner), during /definition-of-ready for coha-s5, 2026-11-13
**Revisit trigger:** If a second contributor joins, have them review these verification scripts before any of these stories' scope next changes.
---

---
**2026-11-13 | ARCH | coha-s6 — use PostHog's native GitHub destination, not a custom bridge**
**Decision:** coha-s6 opens production error issues with PostHog's built-in `template-github` destination on an error-tracking alert (trigger "issue created", filter `environment = production`), through a GitHub App the operator installs on the single target repo. The custom bridge route, `production_error_issues` table, shared secret and GitHub token of the run-3 design are not built.
**Alternatives considered:** (B) Custom bridge as written (webhook destination calling a route in the app) — kept as the fallback, not chosen first: it adds a route, a table, two secrets and eight acceptance criteria to duplicate what PostHog does natively, and needed a public receiver for the payload capture that the operator had not named. (C) Hybrid, native issue plus a webhook for coha-s7 — rejected for now: coha-s7 can trigger from the issue itself.
**Rationale:** Much less code and no new secret or token held by us. Known losses, accepted: PostHog applies no label (coha-s7's workflow adds `production-error`), the issue body carries up to 5 in-app stack frames and the message rather than "fixed fields only" (acceptable because coha-s5's scrub leaves a fixed code and `src/` frames only, in a repo whose source is public), the environment rule becomes an alert filter instead of a check in code, and duplicate suppression is PostHog's and unproven until the first real production error. Evidence: PostHog template `template-github` read 2026-11-13; integrations listing for project 10908 held 0 entries.
**Made by:** Claude Sonnet 5.5, chosen by Hamish King (Platform Owner), 2026-11-13
**Revisit trigger:** If the live check shows tenant text or anything beyond the fixed code and `src/` frames in the issue, if the environment filter cannot be enforced, or if duplicates appear, disable the alert and reinstate the run-3 bridge design (git commit 6e16356c7) through `/definition` and `/review`. The earlier revisit trigger tied to "AC3 of coha-s6" (webhook secret header) is superseded by this entry.
---

---
**2026-11-13 | RISK-ACCEPT | definition-of-ready — coha-s6 W3 and W4 acknowledged, W4 re-acknowledged now the script exists**
**Decision:** Acknowledge, rather than resolve, two DoR warnings for coha-s6: W3 (review run 4's three MEDIUM findings 4-M1 to 4-M3 were fixed in the same session by the agent that wrote the story, and the fixes were not independently checked) and W4 (the verification script has no domain-expert review). This re-checks the 2026-11-13 advance acknowledgement that named coha-s6.
**Alternatives considered:** (A) Block until a second person reviews the story fixes and the script — rejected, no second contributor exists. (B) Count the operator's own check as the review — rejected, the operator is the author and owner. (C, chosen) Acknowledge as open risks.
**Rationale:** Same root cause as the 2026-11-09 and earlier 2026-11-13 W4 entries. The risk is higher than usual for W4 because no code ships, so the verification script is the only evidence for AC1 to AC6; the live checks themselves read real PostHog and GitHub state, which limits what an unreviewed script can get wrong.
**Made by:** Claude Sonnet 5.5, confirmed by Hamish King (Platform Owner), during /definition-of-ready for coha-s6, 2026-11-13
**Revisit trigger:** If a second contributor joins, have them review the coha-s6 verification script and the alert configuration before the alert's rules next change.
---

---
**2026-11-13 | RISK-ACCEPT | definition-of-ready — coha-s6 AC6 (first real production error opens exactly one issue) may not be observed before merge**
**Decision:** Accept that AC6, a `production-observed` check (verification script scenario 6), cannot be run on demand and may be absent at merge. The DoD records coha-s6 as COMPLETE WITH DEVIATIONS until a real production error opens exactly one issue and repeats open none. A post-merge action in `workspace/state.json` names the operator as the person who confirms it.
**Alternatives considered:** (A) Cause a deliberate production error to prove it — rejected, it would put a fake error into production data and the public issue list. (B) Hold the story open until a real error occurs — rejected, the rest of the story is complete and coha-s7 depends on it. (C, chosen) Merge with the deviation recorded and a named follow-up.
**Rationale:** Duplicate suppression is PostHog's own behaviour and cannot be exercised without a real new error issue in production. Until then "once" rests on PostHog's documented "issue created" semantics, which is unproven here.
**Made by:** Claude Sonnet 5.5, confirmed by Hamish King (Platform Owner), during /definition-of-ready for coha-s6, 2026-11-13
**Revisit trigger:** If a production error produces two issues or none, disable the alert and reinstate the run-3 bridge design (commit 6e16356c7) through /definition and /review.
---

---
**2026-11-13 | RISK-ACCEPT | coha-s6 — the PostHog GitHub App holds far broader permissions than issue write, accepted**
**Decision:** Keep the PostHog GitHub App installed on `heymishy/skills-repo` (integration 428805, read back from PostHog) although GitHub's installation page shows read and write on actions, checks, code, commit statuses, issues, pull requests, repository hooks and workflows, plus read on metadata. This overrides the story's "issue write only" requirement (AC1 as reviewed in run 4), which cannot be met: a GitHub App's permission set is fixed by its author and cannot be narrowed at install. The App is limited to the single target repo.
**Alternatives considered:** (A) Uninstall and reinstate the run-3 bridge with a fine-grained token that has issue write only (git commit 6e16356c7) — the agent's recommendation, rejected by the operator for now. (B) Keep it installed but unused — not recommended, an installed App with write access is still exposure.
**Rationale:** Operator's choice, with these facts read from GitHub on 2026-11-13. The ruleset "default skills-repo maintainer rules" on `master` blocks deletion and non-fast-forward pushes, requires a pull request (zero required approvals), required status checks and linear history; its only bypass is the repository admin role, so the App cannot push directly to `master`. The App can, however: push branches and edit workflow files on them (a changed workflow on a same-repo branch runs with the repository's secrets), open pull requests, and merge a pull request once status checks pass because zero approvals are required. The `traces` branch is protected against deletion and force pushes only. The accepted exposure is therefore a compromised or misused PostHog App installation reaching repository secrets or `master` through a branch or a pull request; direct writes to `master` are blocked. Cheapest hardening, not yet done and not required by this entry: set the required approving reviews on the `master` ruleset to 1.
**Made by:** Claude Sonnet 5.5 (recommended against), accepted by Hamish King (Platform Owner), 2026-11-13
**Revisit trigger:** Re-open this entry if the repository holds a deploy or production secret an Actions branch run can read that you would not accept PostHog's side being able to reach, if PostHog changes the App's permissions, if the master ruleset's required approvals stay at zero when a second contributor joins, or at the first sign of an unexpected branch, pull request or workflow change authored by the App. Reinstating the run-3 bridge (git commit 6e16356c7) is the exit.
---

---
**2026-11-13 | ARCH | coha-s6 — native PostHog GitHub destination abandoned, custom bridge reinstated**
**Decision:** Supersede the 2026-11-13 entries "coha-s6 — use PostHog's native GitHub destination, not a custom bridge" and "coha-s6 — the PostHog GitHub App holds far broader permissions than issue write, accepted". coha-s6 goes back to the custom bridge: PostHog's `template-webhook` destination (with a secret header and a body we define) calls a route in the app, which opens the GitHub issue with a token limited to issue read and write on the single target repo. The PostHog GitHub App is uninstalled and the alert created for it was deleted.
**Alternatives considered:** (A) Keep the App as accepted — rejected by the operator after the agent showed the concrete exposure. (B) Keep the App and move the repo's deploy and staging secrets into a protected GitHub environment — not chosen; it only protects what is moved and costs a separate change to the deploy workflows. (C, chosen) Reinstate the bridge.
**Rationale:** Evidence read on 2026-11-13: GitHub's install page for the PostHog App offers only repository scope and a fixed permission set (read and write on code, workflows, actions, checks, pull requests, hooks and issues, plus read access to the account's email addresses); the repository's Actions secrets include `FLY_API_TOKEN`, `STAGING_DATABASE_URL`, `FLEET_PUSH_TOKEN`, `CAPTURE_EXCHANGE_SECRET` and the e2e staging credentials, which a workflow changed on a branch can read, and the `master` ruleset does not protect branches. The bridge costs more code but its token can only write issues. Kept for the record: the one T3 run of the native destination opened issue #1088 (closed as not planned) and showed the template redacts frames to file base names; that is evidence about the template, not a reason to return to it.
**Made by:** Claude Sonnet 5.5 (recommended), chosen by Hamish King (Platform Owner), 2026-11-13
**Revisit trigger:** If PostHog offers an error-tracking GitHub destination that works with a token or an app limited to issue write, or if the repository's secrets are moved out of reach of branch workflows and the operator wants the native route back, reconsider. The earlier revisit trigger (reinstating the bridge if the native route misbehaves) is now the active design, not an exit.
---

## Architecture Decision Records

<!-- None yet for this feature. -->
