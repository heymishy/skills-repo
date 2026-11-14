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

---
**2026-11-13 | RISK-ACCEPT | definition-of-ready — coha-s6 (bridge) W3 and W4 acknowledged**
**Decision:** Acknowledge, rather than resolve, two DoR warnings for the reinstated coha-s6 bridge: W3 (review run 5's MEDIUM findings 5-M1 and 5-M2 were fixed in the same session by the agent that wrote the story, not independently checked) and W4 (the verification script has no domain-expert review). This supersedes, for the bridge, the two entries of the same day written for the abandoned native-destination design.
**Alternatives considered:** (A) Block until a second person reviews — rejected, no second contributor exists. (B) Count the operator's own check as the review — rejected, the operator is the author and owner. (C, chosen) Acknowledge as open risks.
**Rationale:** Same root cause as the earlier W4 entries. The risk is limited by 37 automated tests, seven of them against a real database, and two live scenarios that read real service state.
**Made by:** Claude Sonnet 5.5, confirmed by Hamish King (Platform Owner), 2026-11-13
**Revisit trigger:** If a second contributor joins, have them review the coha-s6 verification script and the bridge's failure handling before the bridge's rules next change.
---

---
**2026-11-13 | RISK-ACCEPT | definition-of-ready — coha-s6 (bridge) AC9, first real production error opens one issue, may not be observed before merge**
**Decision:** Accept that AC9, a `production-observed` check (verification script scenario 9), cannot be produced on demand and may be absent at merge. The DoD records coha-s6 as COMPLETE WITH DEVIATIONS until a real production error opens exactly one issue, repeats open none, and the real event is shown to fill every field of the webhook body including `environment`. A post-merge action in `workspace/state.json` names the operator as the person who confirms it. This supersedes the AC6 entry written for the native-destination design.
**Alternatives considered:** (A) Cause a deliberate production error — rejected, it would put a fake error into production data and the public issue list. (B) Hold the story open — rejected, the rest is complete and coha-s7 depends on it. (C, chosen) Merge with the deviation recorded and a named follow-up.
**Rationale:** Duplicate suppression and field rendering on a real event cannot be exercised without a real new error issue in production. Residual risk: a template that works on the sample but renders empty fields on a real event would drop real errors until the first one occurs. The bridge logs the names of empty fields and a distinct line for a missing environment, so the failure is visible in the app log after the first real error.
**Made by:** Claude Sonnet 5.5, confirmed by Hamish King (Platform Owner), 2026-11-13
**Revisit trigger:** If a production error produces two issues, none, or a log line naming empty fields, fix the template or the bridge before relying on it.
---

---
**2026-11-13 | ARCH | coha-s6 — bridge uses a fine-grained personal access token limited to issues on one repo**
**Decision:** The bridge opens issues with a fine-grained personal access token scoped to `heymishy/skills-repo` only, with Issues read and write and nothing else, a 90-day expiry and a calendar reminder to rotate it, held as the Fly secret `ERROR_BRIDGE_GITHUB_TOKEN`. The operator creates it and sets it without printing it.
**Alternatives considered:** (B) An issues-only GitHub App owned by the operator — not chosen: bot identity and short-lived tokens, but it needs a private key and a signing step in the app, which is more code and a more valuable secret for little gain at this scale. (C) PostHog's GitHub App — rejected earlier the same day (permissions cannot be narrowed).
**Rationale:** The token's worst case is spam issues in a public repo, not code or secret access. Cost accepted: issues appear authored by the operator's account, not a bot, so coha-s7's author check identifies the operator's login.
**Made by:** Claude Sonnet 5.5, confirmed by Hamish King (Platform Owner), 2026-11-13
**Revisit trigger:** If a second contributor joins, if the 90-day rotation is missed once, or if bot-authored issues are wanted, move to an issues-only GitHub App.
---

---
**2026-11-13 | DEFERRAL | coha-s6 — database-backed bridge tests are local evidence, not a CI gate**
**Decision:** The seven real-Postgres tests (P1 to P7) of coha-s6 run locally against a throwaway container at `/verify-completion` and their output goes in the DoD as `integration-real-code` evidence. A Postgres service in `.github/workflows/pr-checks.yml` is deferred; it is a platform change that would need its own story. The always-run suite (30 tests) still covers every branch through a fake pool and runs in CI.
**Alternatives considered:** (A) Add a CI Postgres service now — deferred, separate platform change. (B) Treat the gated tests as a RISK-ACCEPT — rejected: they are real evidence when run, and the repo's rule is to get real evidence where only infrastructure friction blocks it.
**Rationale:** Atomicity of two simultaneous deliveries cannot be shown with a fake; a local container shows it. If Docker is unavailable at verify time, that is a stated blocker, not a pass.
**Made by:** Claude Sonnet 5.5, confirmed by Hamish King (Platform Owner), 2026-11-13
**Revisit trigger:** If the bridge's duplicate logic changes after merge, or a second contributor joins, add the CI Postgres service so the atomicity tests gate every PR.
---

---
**2026-11-13 | ARCH | coha-s7 — incident record reaches the repository through a pull request per record (replaces option A)**
**Decision:** The workflow that creates an incident record opens a pull request containing the record instead of pushing to `master`; the operator merges each one. This replaces the 2026-11-13 option A (workflow pushes under a path bypass). Review `coha-s7-review-2.md` (finding 2-H1) showed the `master` ruleset has no file-path rule and its only bypass is the repository admin role, so the premise of option A, a path-scoped bypass, does not exist.
**Alternatives considered:** (1) Give the Actions app a blanket bypass on `master` — rejected: any workflow with `contents: write` could then push anything, including workflow files. (3) Write records to an unguarded branch — not chosen, it moves where the triage feature reads records from. (4) The bridge writes the file through the Contents API with a one-file token — not chosen, it adds a repository write to the app that was deliberately kept out.
**Rationale:** No ruleset change, `master` stays guarded, and a short delay before a record appears is acceptable because the incident already has an open GitHub issue. Cost accepted: one pull request to merge per incident and the status checks must pass on it.
**Made by:** Claude Sonnet 5.5 (recommended), confirmed by Hamish King (Platform Owner), 2026-11-13
**Revisit trigger:** If incident volume makes merging a pull request per record a burden, revisit option 3 or a batched record. A separate follow-up, not part of this decision: the "path-based bypass" operator note in CLAUDE.md is inaccurate and needs a corrected note through its own story.
---

---
**2026-11-14 | RISK-ACCEPT | coha-s6 branch-setup — baseline of 5 pre-existing test failures acknowledged**
**Decision:** coha-s6 proceeds past a baseline with 5 failing files (851 run, master fdea433e6): scripts/check-pipeline-state-integrity.js (tfhc-s1 is merged with testPlan.passing 4 of 5, because the fifth test fails on accepted product bug GitHub issue #1042), tests/check-pcr-s1-test-runner.js (per-file timing 773-782 ms against a 749.8 ms limit set from a 2026-07-11 baseline on another machine), tests/check-p4-enf-second-line.js and tests/check-rtvap-s1-archived-test-plan-coverage.js (bash on PATH resolves to the WSL launcher; both pass with Git Bash first on PATH), tests/check-p3.5-validate-trace.js (Windows PowerShell 5 in the full run).
**Rationale:** None touches the bridge. Three are environmental, one is a stale machine-specific threshold, one is an accurate record of an accepted defect; the passing count was not falsified.
**Made by:** Claude Sonnet 5.5 (recommended), acknowledged by Hamish King (Platform Owner), 2026-11-14
**Revisit trigger:** fix #1042 or add an integrity-check exception for tfhc-s1; re-baseline the pcr-s1 threshold through a short-track story. Verification runs with Git Bash first on PATH.
---

---
**2026-11-14 | DESIGN | coha-s6 — the claim is released after a definite GitHub failure (amends the in-flight rule)**
**Decision:** When the bridge's GitHub call fails definitely (the search or the create throws an error that is not a timeout), the bridge makes a best-effort update that backdates the row's claim time, so the next delivery of the same PostHog issue takes over at once (after searching GitHub for the marker line, so no duplicate). A timeout does not release the claim, and neither does a failed store update after the issue was created (a later takeover recovers that issue by its marker). The signed-off rule that a duplicate delivery inside the 2-minute window gets 200 is unchanged.
**Context:** The Task 5 concurrency review (coha-s6 subagent-execution) found that a failed delivery leaves its row pending, so a PostHog retry inside the window gets 200 in-flight; PostHog treats that as delivered, the alert fires only once per new error issue, and the issue is never created.
**Alternatives considered:** (b+a) also answer in-flight duplicates with 503 so PostHog keeps retrying: rejected for now because it changes the signed-off AC2 and test U6 and PostHog's retry behaviour on 5xx is unverified; leave as designed with a RISK-ACCEPT: rejected, the loss is silent.
**Made by:** Claude Sonnet 5.5 (recommended), chosen by Hamish King (Platform Owner), 2026-11-14.
**Tests added:** U22b (failure then immediate retry opens one issue), U21b (timeout does not release), U20b (store failure after create is logged with the issue number and does not release), release-failure-swallowed, and store release tests.
---
**2026-11-14 | RISK-ACCEPT | coha-s6 — a retry that arrives while the first attempt is still running gets 200 in-flight and the issue can be lost**
**Decision:** Accepted residual risk. If PostHog's own webhook timeout is shorter than the bridge's worst case (about 8 seconds, or about 16 seconds on a takeover) and it retries while the first attempt is still running, the retry gets 200 in-flight; if the first attempt then fails, no further delivery arrives for that error issue. The claim release above does not help in that sequence because the retry has already been answered.
**Why accepted:** Needs PostHog to time out and retry before our attempt finishes and then GitHub to fail; PostHog's webhook timeout and retry schedule are undocumented, and the first real production error (AC9) is the check. Mitigation if it is ever seen: answer in-flight duplicates with 503 (the rejected alternative above) through an amended story.
**Made by:** Claude Sonnet 5.5 (recommended), accepted by Hamish King (Platform Owner), 2026-11-14 (accepted by choosing the recommended option, which left this residual risk in place).
**Revisit trigger:** A missing issue for a production error PostHog shows as alerted; or PostHog documenting its webhook timeout and retry schedule.
---

---
**2026-11-14 | DESIGN | coha-s6 — where the line between a definite and an ambiguous GitHub failure sits (refines the release-claim decision)**
**Decision:** The claim is released (so a PostHog retry takes over at once) in two cases only: any failure of the marker search (no create was attempted in that request), and a failed create that the adapter marks `definite`, meaning GitHub answered with an HTTP error status other than 408, or the connection failed before any request byte was sent. A timeout, a connection reset after the request was sent, an unparseable or number-less success, and a failed store update after a create all keep the claim, because the issue may exist and a later takeover recovers it by its marker line.
**Context:** The quality review of the first release-claim commit showed that releasing after any non-timeout error can create a duplicate public issue when the error came after GitHub created the issue and a quick retry's marker search misses it; the first implementation also treated a plain HTTP 5xx as ambiguous only because the adapter did not exist yet.
**Rationale:** An HTTP error response means GitHub answered and refused or failed; creation followed by an error response is rare, a rare duplicate is visible and closable, and a lost alert is silent, so HTTP error statuses (including 5xx) count as definite. The marker search uses the repository's issue list (read-your-writes in practice), not the search API, which lags.
**Residual risks accepted:** (1) an HTTP 5xx after GitHub already created the issue can produce one duplicate if the list also lags; (2) an ambiguous create (timeout, reset after sending) followed by a PostHog retry inside the 2-minute window gets 200 in-flight, and the issue is created later only by a further delivery, which PostHog does not send for the same error issue, so that issue can be lost; the marker search recovers an existing issue only when another delivery arrives. Both are visible at the first real production error (AC9).
**Made by:** Claude Sonnet 5.5 (recommended), within the operator's 2026-11-14 choice to release the claim on a definite failure; the operator is told of this boundary in the session and may overrule it.
**Revisit trigger:** a duplicate or a missing issue for an alerted production error.
---

---
**2026-11-14 | DESIGN | coha-s6 — tests/check-coha-s6-error-bridge.js stays in the normal concurrent test pool (not added to SEQUENTIAL_EXCLUSIVE_LIST)**
**Decision:** The new check file is not added to SEQUENTIAL_EXCLUSIVE_LIST in scripts/run-all-tests.js.
**Evidence (measured 2026-11-14, Windows, processes pinned to 2 cores by processor affinity):** (1) Full suite with the pool sized as on a 2-CPU runner (one slot): 852 files, 2 failed, both on the acknowledged baseline (the tfhc-s1 integrity check and the pcr-s1 timing test); the new file and tests/check-cat-s1-core-trace-builder.js passed. (2) Full suite with a two-slot pool on 2 real cores: 852 files, 3 failed: the same two plus tests/check-rb-s3-harness-agnostic-instructions.js, whose only failing assertion is its 2-second overhead timing test; it passes alone. (3) Controlled experiment, that timing test run six times each pinned to 2 cores: alone 0 of 6 failures (about 16.5 s), beside the new file 0 of 6 (about 17.0 s, roughly 3 percent slower), beside tests/check-coha-s5-error-capture.js (the file that is already exclusive) 5 of 6 failures (about 22 s).
**Rationale:** The new file does not starve timing-sensitive tests, unlike coha-s5, so the exclusive list is not needed. The rb-s3 timing failure in the two-slot full run is the existing sensitivity of that test to CPU load and is not attributed to this story; it is recorded here in case it recurs in CI.
**Revisit trigger:** a timing-sensitive test failing in CI on a run that includes this file while passing without it.
**Made by:** Claude Sonnet 5.5 (measured), 2026-11-14.
---
**2026-11-14 | NOTE | coha-s6 final review observations accepted without code change**
**Observations:** (1) If the bridge's GitHub adapter is not wired when an alert arrives (the token or repo secret is missing or invalid), the first delivery claims a row and does not release it, so a PostHog retry within 2 minutes gets 200 in-flight. Nothing can have been created on that path, so releasing would be harmless, but the practical effect equals the already accepted lost-alert risk: an alert that arrives while the bridge is misconfigured is not recovered unless a further delivery arrives after the 2-minute window. The operator prerequisites (set the three Fly secrets before enabling the PostHog destination) are what prevent this; the app logs "Error bridge GitHub adapter NOT wired" at startup. (2) The takeover marker search lists only the 100 most recent issues carrying the production-error label (any state). If the label was not applied to an issue (the label must exist in the repository before the first run, DoR assumption 3), was later removed, or more than 100 labelled issues have been created since, a takeover search misses an existing issue and a duplicate can be opened. Unlikely inside a 2-minute window; the live test run (AC6) checks that the created issue actually carries the label.
**Made by:** Claude Sonnet 5.5, 2026-11-14.
---

---
**2026-11-14 | SCOPE | coha-s6 verify-completion: additions beyond the plan text**
**Context:** Step 3 of /verify-completion compares the branch commits with the DoR ACs and the implementation plan. Everything maps to a plan task, a review fix, or an earlier 2026-11-14 decision, except the following small additions made during execution, which are logged here and will be listed in the pull request description.
**Additions:** (1) An always-run test W1 that starts the real server.js in a child process without a database and checks over real HTTP that the new route exists, rejects a wrong secret (401) and wrong method (405), answers 503 "not wired" for a valid delivery and 200 for a staging delivery: this gives CI a wiring check that does not need Postgres (the plan's wiring tests P6 and P7 need a database and do not run in CI). (2) Configuration checks in createGithubAdapter at wiring time (the repository name must look like owner/name and not contain path tricks, the token must be non-empty, the API base must be https unless it is a loopback host and must not carry a query, fragment or user info), with server.js leaving the throwing stub in place if the check fails: from a quality review that an operator typo in ERROR_BRIDGE_REPO could otherwise aim the bearer token's writes at a different API path. (3) Test-only safety: the real-database tests refuse to run against a non-local database unless COHA_S6_ALLOW_REMOTE_DB=1 is set, because they drop the production_error_issues table. (4) The missing-environment log line names (never shows) other empty fields, from the final review, so that if a real PostHog event renders several properties empty together the first real production error (AC9) can be diagnosed from the log. (5) Hardening of field validation beyond the plan: the PostHog link tail, first_seen and code character sets, from the Task 3 review. None adds a user-visible capability or touches a file outside the six named files.
**Made by:** Claude Sonnet 5.5, 2026-11-14 (recommended from reviews; the operator can ask for any to be removed in the pull request).
---

---
**2026-11-14 | DESIGN | coha-s7 test plan: four findings to settle at /definition-of-ready**
**Context:** Writing the coha-s7 test plan against the merged coha-s6 code and the repository's existing incident tooling surfaced four points where the reviewed story is silent, wrong, or leaves a gap. None blocks the test plan; each needs the operator's decision at DoR (or a recorded RISK-ACCEPT).
**Findings:** (1) The story's single concurrency group serialises two simultaneous runs, but GitHub Actions keeps one running and one pending run per group and cancels an older pending run when another arrives, so three issues opened at once would lose a record. Recommended: a group per issue number with cancel-in-progress false (test W3); each issue builds its own branch from the current master anyway, and the idempotency check covers a duplicate run for one issue. (2) The path that matters, the real branch push and pull request creation by the workflow's own token, has no automated test and no acceptance criterion (AC8 is a dry run). Recommended: keep the optional live scenario 9 in the verification script and have the operator choose at DoR between adding it as an AC or a RISK-ACCEPT with a post-merge action. (3) The bridge author comparison is exact and fails closed: the workflow variable must hold the login in GitHub's exact case; an unset variable recognises nothing (tests U7, U8). (4) The pull request title and body show the error code only inside inline code formatting with backticks neutralised, so a hostile code cannot ping anyone (test U13); this slightly tightens the story's wording.
**Also noted:** The producer contract is now fixed in merged code (title is the code; label production-error; body First seen / Environment / PostHog / blank line / "PostHog issue id: <uuid>"), and the test plan builds its fixtures with the real producer function so a format drift fails the test.
**Made by:** Claude Sonnet 5.5 (recommended), awaiting operator decision at DoR.
---

---
**2026-11-14 | DESIGN | coha-s7 definition of ready: three refinements accepted and written into the story**
**Decision:** (a) The workflow uses one concurrency group per issue number with cancel-in-progress false instead of a single shared group; (b) the bridge author login is compared exactly, letter case included, and an unset or empty variable recognises nothing; (c) the pull request title and body show the error code only inside inline code formatting on one line with any backtick replaced.
**Rationale:** (a) GitHub keeps at most one running and one pending run per group and cancels an older pending run, so a shared group loses a record when three issues arrive together; each issue builds its own branch from the current master and the idempotency check covers a repeat run, so runs for different issues need no serialising. (b) fails closed on a misconfigured variable. (c) a hostile or odd code cannot notify anyone or render as markup.
**Made by:** Claude Sonnet 5.5 (recommended), accepted by Hamish King (Platform Owner), 2026-11-14. The story's constraints and a "DoR amendments" section carry the text; review runs 4 and 5 cover them.
---
**2026-11-14 | SCOPE | coha-s7 gains a ninth acceptance criterion: a live non-dry run on a test issue**
**Decision:** AC9 is added: a live, non-dry run by hand on a test issue opened by the bridge account creates exactly one branch and one data-only pull request, a repeat creates nothing, and the operator then closes the pull request unmerged, deletes the branch and closes the issue. It is live-verified evidence and needs the operator's approval immediately before the run.
**Context:** No test and no other acceptance criterion exercises the real branch push and pull request creation by the workflow's token (AC8 is a dry run). I recommended a RISK-ACCEPT plus an optional post-merge run; the operator chose to make it an acceptance criterion instead.
**Consequence:** The story was amended and re-reviewed (review run 4 failed on one HIGH, the live check set-up order, which was fixed; run 5 passed); the verification script's scenario 9 is now required; the definition of done for coha-s7 cannot be complete until the AC8 and AC9 live evidence exists, in the same way as coha-s6's AC6.
**Made by:** Hamish King (Platform Owner), 2026-11-14.
---
**2026-11-14 | RISK-ACCEPT | coha-s7: one workflow file instead of the two ADR-009 asks for**
**Decision:** The recognise job and the record job live in one workflow file, with job-level permissions (the recognise job reads contents only; the record job has contents write and pull-requests write and no issues permission). This deviates from ADR-009 (evaluation and write-back workflows as separate triggers with separate permission scopes).
**Rationale:** ADR-009 exists to prevent a write-back workflow re-triggering its own evaluation. Here the trigger is an issue being opened, and a branch push or pull request made with the workflow's own token starts no other workflow, so the loop cannot occur; the permission separation ADR-009 wants is achieved with two jobs, and one file is simpler to test (tests W2, W3, W6).
**Revisit trigger:** a personal access token or app token is ever used to open the pull request (that would start other workflows), or a second trigger is added to the file.
**Made by:** Claude Sonnet 5.5 (recommended), accepted by Hamish King (Platform Owner), 2026-11-14.
---
**2026-11-14 | DECISION | coha-s7: Actions may create pull requests, and each record pull request is merged by the operator with the admin bypass**
**Decision:** The repository setting that lets GitHub Actions create pull requests stays on (read from GitHub on 2026-11-13 and 2026-11-14: can_approve_pull_request_reviews true, default workflow permission read). The operator accepts merging each record pull request personally with the admin bypass, because GitHub does not run the three required checks (Run assurance gate, Scenario A and B end to end) on a pull request created with a workflow's own token.
**Revisit trigger:** incident volume makes a conscious bypass merge per record a burden; then consider a batched record or a token that triggers the checks.
**Made by:** Hamish King (Platform Owner), 2026-11-14.
---

---
**2026-11-14 | RISK-ACCEPT | coha-s7 definition of ready: W3 (MEDIUM review findings) and W4 (verification script not reviewed by a domain expert)**
**Decision:** (W3) The MEDIUM findings of review runs 3 (3-M1, 3-M2) and 4 (4-M1 to 4-M4) were fixed in the story by the agent that authored it before the next run; review run 5 was written by an independent reviewer agent and found 0 MEDIUM. Acknowledged. (W4) The verification script has not been reviewed by a domain expert; the operator is the only reviewer in this repo. Acknowledged as a RISK-ACCEPT: the 39 automated tests, which include real git, the real record creation and the real product page handler, and the two live scenarios (AC8 and AC9) limit what an unreviewed script can get wrong. This is not an independent review.
**Made by:** Claude Sonnet 5.5 (recommended), acknowledged by Hamish King (Platform Owner), 2026-11-14.
**Revisit trigger:** a live scenario (8 or 9) failing for a reason the script did not anticipate.
---

---
**2026-11-14 | RISK-ACCEPT | coha-s7 branch-setup: baseline of 3 pre-existing test failures acknowledged**
**Decision:** coha-s7 proceeds past a baseline with 3 failing files (852 run, master 4d3d1e351, Git Bash first on PATH, PowerShell 7): scripts/check-pipeline-state-integrity.js (tfhc-s1 is merged with testPlan.passing 4 of 5 because its fifth test fails on accepted product bug GitHub issue 1042), tests/check-pcr-s1-test-runner.js (per-file timing against a limit set from a 2026-07-11 baseline on another machine) and tests/check-p3.5-validate-trace.js (a PowerShell child process killed under full-suite load: "validate-trace.ps1 --ci exited null"; it passed 3 of 3 runs alone and in both of the last two full runs). All three were already in the set acknowledged for coha-s6 on 2026-11-14.
**Rationale:** None touches the incident record workflow, script or tests. One is an accurate record of an accepted defect, one a stale machine-specific threshold, one an intermittent load-induced timeout.
**Made by:** Claude Sonnet 5.5 (recommended), acknowledged by Hamish King (Platform Owner), 2026-11-14.
**Revisit trigger:** as for coha-s6: fix issue 1042 or add an integrity-check exception for tfhc-s1; re-baseline the pcr-s1 threshold; make the p3.5 PowerShell test tolerant of a slow start. Verification runs with Git Bash first on PATH.
---

---
**2026-11-14 | NOTE | coha-s7 implementation plan: every incident record will be linked to every earlier one by the triage drafter**
**Observation:** Each record carries the tags `production-error` and `posthog:<id>` (story AC1). The triage drafter scores prior incidents by tag overlap (Jaccard) against a provisional threshold of 0.3. Two such records share one of three distinct tags, a score of about 0.33, so every new record will be linked to every earlier production error record. That is acceptable now (they are all production errors and the threshold is provisional) but it will matter when the threshold is calibrated against real data, which is one of the stated reasons this story exists. No change is made here.
**Also noted:** The plan makes four small clarifications to the test plan so the plan and the tests agree: a marker line with trailing text declines as `id` (not `marker`); the N1 canary is not placed in the title because a dry run prints the title as the record summary by design; the workflow-file test allows only github.repository, github.run_id and runner.temp inside run blocks; the hand start reads current labels (recorded in the story).
**Made by:** Claude Sonnet 5.5, 2026-11-14.
---

## Architecture Decision Records

<!-- None yet for this feature. -->
