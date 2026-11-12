# Discovery: CI/CD, Observability & Hardening Automation

**Status:** Approved
**Created:** 2026-11-08
**Approved by:** Hamish King — Platform Owner — 2026-11-08
**Author:** Claude Sonnet 5 (conversational discovery session with operator)

---

## EA Registry Check

`architecture.ea_registry_authoritative: true` in `.github/context.yml`. No EA registry entry exists for `.github/workflows/`, `src/approval-channel/`, or the broader CI/CD surface this initiative extends — proceeding without blast-radius data. This does not block discovery.

---

## Problem Statement

The patch lifecycle has three layers, and none of them have the awareness/detection layer this initiative needs to add:

1. **CI/CD chain (exists, but silent).** Patch build, test, and deploy already run as automation (`staging-deploy.yml`, `e2e.yml`, `deploy-group-auto-rerun.yml`), but nothing announces a patch before it ships, nothing notifies when a step completes or fails, and nothing surfaces when self-healing (auto-retry) already fired. An engineer who just merged has to actively poll GitHub Actions.
2. **Production-defect detection (doesn't exist at all).** No instrumentation/log/error-tracking integration exists anywhere in `src/` — confirmed: zero incident/alerting code, PostHog is wired for analytics/flags only, not error tracking. A production defect is found only when a human happens to notice (this session's own `tenant_admin_bootstrap_failed` SQL bug, still unfixed, found this way). Fly.io's platform does provide real log access via `flyctl logs` (confirmed — already demonstrated live in this session), and built-in Prometheus-compatible metrics with managed Grafana — but nothing reads or acts on either today. (Note: Fly.io does **not** offer a customer-facing ELK/Elasticsearch product, despite that being a reasonable assumption to check — its internal pipeline uses Elasticsearch, but that's Fly's own backend architecture, not a feature customers get. See `fly.io/monitoring` and `fly.io/blog/fly-behind-the-scenes-fresh-logging`.)
3. **Vulnerability/patching-hardening data (doesn't exist at all).** No Dependabot config, no `npm audit`/Snyk step anywhere in CI. Dependency vulnerabilities and available patches are entirely invisible today — nobody is told when a dependency needs patching.

All three layers need the same shape of thing: a triggered, bounded check (a CI job, a webhook, a scheduled check) that reads the relevant signal and announces it via chat — never a standing watch process (per `product/mission.md`'s "not a persistent agent runtime" constraint). The boundary with the separate incident-triage-and-respond initiative: this initiative covers everything through **detection and alerting** ("something needs attention, here's what"); incident-triage-and-respond covers the **human-facing response** once alerted (triage against prior incidents/fixes, draft a summary, post to the incident channel, human approves production promotion).

Who experiences it, daily: the engineer who just merged, blind to the CI/CD chain; whoever discovers production defects only by accident today (e.g. the `tenant_admin_bootstrap_failed` bug); and whoever would otherwise need to manually track dependency vulnerabilities, which nobody currently does at all.

Cost when unresolved: delayed awareness across all three layers, continued manual toil for known-recoverable CI failures, production defects that persist until someone happens to notice, and unpatched vulnerabilities that are never surfaced because nothing watches for them.

## Who It Affects

**The delivery engineer** — merges code, and in the same role, is the intended recipient of CI/CD status, production-defect alerts, and dependency-vulnerability signals once they exist. Today blind to all three — has to actively poll GitHub Actions, has no log/error visibility, and nobody runs `npm audit`. Trying to accomplish: one place to learn what's happening and what needs attention, instead of three separate manual checks (or, in the vulnerability case, a check that doesn't happen at all). (Given `context.yml`'s `meta.scope: personal`, this is deliberately one persona, not an invented larger cast.)

## Why Now

Three things converge:

1. **Platform readiness, just reached** — same precondition as the unified-visibility initiative: `inner-loop-cycle-efficiency` just completed, hardening CI/pipeline reliability. That's what makes it safe to layer notification/detection on top now.
2. **This session alone produced four concrete, recent examples of the cost of not having this**: the `actr-s1/s2/s3` CI-cancellation pattern needing repeated manual `gh run rerun`; the `ubuntu26.04-x64`/Playwright CI break, found only because a human happened to compare two PRs' results; the `tenant_admin_bootstrap_failed` production SQL bug, still unfixed, found by accident; and the simple fact that dependency vulnerabilities are never checked at all. This isn't a hypothetical trigger — it's a pattern that just kept recurring in real, recent work.
3. **Sequencing with the other initiatives fits, though it's not a hard dependency.** The unified-visibility surface (initiative 1, approved) is built artefact-source-agnostic specifically so it can render whatever this initiative produces (alert/retry records) without a redesign. Incident-triage-and-respond (initiative 4) would benefit from real, automated alerts to triage against, rather than only manually-logged incidents (the current precedent — see `productionErrorInvestigation` in `workspace/state.json`) — but it isn't blocked on this initiative existing first; it could still start from manual incident records if sequencing changes.

## MVP Scope

A 4-story MVP, each piece cheap and grounded in existing scaffolding — no new vendor decisions, no standing watch process:

1. **Outbound chat notification adapter** — extends `approval-channel`'s existing inbound-only pattern (HMAC-verified dispatch) to also send outbound.
2. **CI/CD chain notifications** — patch-announce before build, build/test/deploy status on completion, and auto-retry visibility (when `deploy-group-auto-rerun.yml` fires).
3. **Vulnerability-check step** — `npm audit --audit-level=high` (or equivalent) added as a CI step, notify on findings via the same adapter.
4. **Bounded production-log scan** — a triggered (not standing) check running `flyctl logs --since <window>`, grepping known error patterns, notifying via the same adapter if found.

All four route through the same notification adapter (story 1), so it's built once and reused three times — the real economy of scale in this MVP. Everything here respects `product/mission.md`'s "not a persistent agent runtime" constraint: every check is CI-job- or schedule-triggered, bounded, and exits — never a standing watcher.

## Out of Scope

- **Production-defect triage, write-up, and response** — once this initiative detects and alerts, deciding what it means, drafting a summary, and approving production promotion belongs to the separate incident-triage-and-respond initiative (discovery 4). This initiative stops at "something needs attention, here's what."
- **Full observability platform (APM, distributed tracing, custom metrics dashboards)** — `flyctl logs` plus existing PostHog analytics are sufficient inputs for this MVP; no new observability vendor or instrumentation layer. SUPERSEDED IN PART 2026-11-13: the production-error-source spike measured `flyctl logs` at about 100 lines (roughly one second of traffic), so it is not a sufficient input. Error capture now uses PostHog, the vendor already in use, through its existing SDK (see `decisions.md`, 2026-11-13). Full APM, tracing and metrics dashboards remain out of scope.
- **OS/infrastructure-level monitoring beyond what Fly.io's platform already exposes** — no custom infra agent, no new metrics collector.
- **Automatic vulnerability remediation** — this MVP detects and notifies on `npm audit` findings; it does not auto-upgrade dependencies or auto-merge Dependabot-style PRs.
- **Slack as a notification target** — only Teams has real scaffolding to extend (`teams-adapter.js`); despite the original brainstorm naming both, Slack support isn't guaranteed by this MVP and would need its own adapter.

## Assumptions and Risks

[ASSUMPTION — RESOLVED 2026-11-08 via /clarify, verified in code — CORRECTED, not confirmed] The outbound adapter does **not** reuse `approval-channel`'s HMAC/dispatch pattern — that pattern (`teams-adapter.js`) only verifies inbound signatures. Outbound send needs a genuinely different mechanism (a Teams Incoming Webhook URL, stored as a new secret per `product/constraints.md` #12) and new code. This is real, slightly larger scope for story 1 than originally assumed — not a redesign, but worth flagging at `/definition` time as more than a trivial extension.

[ASSUMPTION — RESOLVED 2026-11-08 via /clarify, verified via Fly.io docs and `flyctl status`] 7-day log retention applies regardless of tier (confirmed: this app is on the `personal` org). A triggered scan with an hours-to-a-day lookback window is comfortably within that — no retention risk for the intended use. Sources: fly.io/docs/monitoring/logging-overview/, fly.io/docs/monitoring/search-logs/.

[ASSUMPTION — RESOLVED 2026-11-08 via /clarify, verified with real data] `npm audit --audit-level=high` run against this repo right now surfaces exactly 1 finding (critical, `dompurify`, fix available) out of 3 total vulnerable packages — confirming low noise at the `high` threshold, not alert-fatigue risk. Note: this also surfaces a real, currently-unaddressed critical finding, independent of this discovery — worth a RISK-ACCEPT or fix outside this initiative's own scope.

**Known constraint, not an assumption:** per `product/constraints.md` #12, any Fly.io API token used by the log-scan step must live in a secrets store (GitHub Actions secrets), never in the agent's own environment — this is a structural requirement on story 4's implementation, not an open question.

**What could make this not worth building:** if the team doesn't actually watch the Teams channel in practice (checks something else day-to-day), notifications add noise without reducing toil. And if alert volume is too high from the start (flaky CI, repeat vulnerability findings), people mute the channel fast — the fix has to ship with sensible defaults (e.g. notify on new findings only), not tune after the fact.

## Directional Success Indicators

1. **CI/CD chain notification coverage.** Baseline: 0% — confirmed today, no patch/build/test/deploy event generates a chat notification. Target: 100% of merges to master trigger a notification at each defined transition (announce, build/test/deploy status, auto-retry visibility). Measured via: comparing CI run count against adapter dispatch-call count.
2. **Manual CI toil reduction for known-flaky patterns.** Baseline: this session alone needed 3 confirmed manual `gh run rerun --failed` interventions for the `actr-s1/s2/s3` cancellation pattern (logged in `capture-log.md`). Target: near-zero manual reruns for already-known-flaky patterns, since auto-retry visibility means a human doesn't need to manually verify whether a retry already happened. Measured via: count of manual `gh run rerun` invocations per month, before vs. after.
3. **Vulnerability-finding visibility.** Baseline: 0% — no vulnerability scanning exists in CI today (confirmed: no Dependabot, no `npm audit` step). Target: 100% of CI runs include the audit step, and each new high/critical finding generates exactly one notification, not a flood of repeats. Measured via: CI step presence check plus a de-duplication check on the notification log.
4. **Production-defect detection latency.** Baseline: `[UNKNOWN BASELINE]` — today, defects are found only by accident (e.g. the still-unfixed `tenant_admin_bootstrap_failed` bug), with no systematic detection to measure against. Target: establish a real first measurement of detection latency (time between a defect appearing in logs and the scan surfacing it) once the log-scan has run for a month — this indicator's purpose is to get a real number for the first time, not to hit a specific target yet.

## Constraints

**Confirmed from `product/constraints.md`:** #11, no persistent agent runtime — already the design basis for all 4 MVP stories (every check is triggered/bounded, never a standing watcher). #12, credentials are structural — any Fly.io API token the log-scan uses must live in GitHub Actions secrets, never the agent's environment (already flagged in Assumptions and Risks). #13, structural governance preferred over instructional — `/definition` should design each notification path so a CI gate can verify it actually fired (e.g. a test asserting the adapter was called), not just trust an instruction that it should.

**Confirmed, does not apply this time:** #9 (design-system compliance) — unlike initiative 1, this MVP doesn't touch `src/web-ui/`; it's backend workflow/adapter work (`.github/workflows/`, `src/approval-channel/`, `scripts/`). No `hasDesignSystemTrack` flag needed.

**Process constraint:** if implementation adds new files under `scripts/`, those changes fall under CLAUDE.md's "Platform change policy" — merged via PR, not committed directly to master.

**Surface type:** per constraint #6, this feature's delivery-surface type will need declaring at `/definition` — likely `git-native` (CI/CD workflow + backend adapter, no GUI), via the EA registry if an entry exists, or `context.yml` explicit declaration if not (same pattern as initiative 1's EA Registry Check found no entry).

No time/budget/team-capability constraints identified beyond these.

## Contributors

- Hamish King — Platform Owner — 2026-11-08

## Reviewers

- [None yet]

## Approved By

Hamish King — Platform Owner — 2026-11-08

---

## Clarification log

[2026-11-08] Clarified via /clarify:
- Q: Can the outbound chat adapter reuse `approval-channel`'s existing HMAC/dispatch pattern? A: No — verified in code that pattern only verifies inbound signatures. Outbound needs a new mechanism (Teams Incoming Webhook URL) and new code; flagged as added scope for story 1, not a redesign.
- Q: Does `flyctl logs --since <window>` give sufficient retention for a meaningful bounded scan? A: Confirmed — 7-day retention regardless of tier (verified via Fly.io docs and `flyctl status` against the real app), comfortably covering an hours-to-a-day scan window.
- Q: Does `npm audit --audit-level=high` have a low enough noise rate to avoid alert fatigue? A: Confirmed with real data — running it against this repo right now surfaces exactly 1 actionable finding (critical, `dompurify`), not a flood.

---

**Next step:** Human review and approval → /benefit-metric
