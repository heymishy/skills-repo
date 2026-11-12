## Epic: The engineer who merges is never blind to what happens next

**Discovery reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/benefit-metric.md
**Slicing strategy:** Walking skeleton

Chosen because this epic has one genuine foundation all three signal sources depend on: a working outbound chat-notification path (story 1). Stories 2-4 each flesh that skeleton out with a different trigger source (CI/CD chain events, `npm audit` findings, bounded log-scan findings) but none of them are independently useful without story 1 existing first — unlike initiative 1's epic, where each story stood alone. The discovery's own framing ("built once and reused three times") is a walking-skeleton shape, not a vertical-slice one.

## Goal

When this epic is complete, a merge to master, a known-flaky CI auto-retry, a new high/critical `npm audit` finding, and a production error captured in PostHog (REVISED 2026-11-13: originally "a matched error pattern in Fly.io production logs", ruled out by the production-error-source spike; see `decisions.md`) each generate exactly one chat notification via a single shared outbound adapter — replacing today's reality where an engineer has to actively poll GitHub Actions, has zero production-defect visibility beyond accident, and nobody ever runs a vulnerability check at all. Every check remains triggered and bounded (a CI job, a webhook, a scheduled check that runs and exits) — never a standing watch process, per `product/mission.md`'s constraint.

## Architecture constraints scan (Step 1.5)

`.github/architecture-guardrails.md` exists and was read. Relevant constraints:

- **`product/constraints.md` #11** (no persistent agent runtime): every story's mechanism is CI-job- or schedule-triggered and bounded — confirmed against each story's own AC set below; none introduces a standing process.
- **`product/constraints.md` #12** (credentials are structural): the Teams Incoming Webhook URL (story 1) and any Fly.io API token (story 4) must live in GitHub Actions secrets, never in agent environment or tracked files. `context.yml`'s relevant config block must reference secret *names* only.
- **`product/constraints.md` #13** (structural governance preferred over instructional): each story's DoR and test plan must include a CI-gate-verifiable assertion that the adapter was actually called — not just an instruction trusting that it should be. This is called out explicitly per story below so `/test-plan` designs real dispatch-assertion tests, not only unit tests of the adapter in isolation.
- **ADR-011 / Artefact-first**: this epic satisfies ADR-011 for the new `scripts/` and `.github/workflows/` changes it introduces.
- **CLAUDE.md Platform change policy**: any new file under `scripts/` or `.github/workflows/` is merged via PR, not committed directly to master — applies to every story in this epic (confirmed in discovery's own Constraints section).
- **No `hasDesignSystemTrack` flag** — confirmed in discovery: this MVP doesn't touch `src/web-ui/`.
- Verified directly in code before writing stories (not assumed from the discovery text alone): `src/approval-channel/adapters/teams-adapter.js` exports only `handle`, `verifyHmac`, `extractStoryId` — genuinely inbound-only, confirming story 1 needs real new outbound code, not a trivial extension. `deploy-group-auto-rerun.yml` triggers on `workflow_run` `types: [completed]` with `if: conclusion == 'cancelled'`, confirmed by its own code comments as the exact mechanism story 2's auto-retry visibility hooks into.

No guardrail here is a blocker before decomposing.

---CANVAS-JSON: {"type":"program-design","title":"As designed: Program design","content":{"mermaid":"flowchart LR\n    TA[approval-channel/adapters/teams-adapter.js\\nnew: sendNotification]\n    WH[GitHub Actions secret:\\nTEAMS_WEBHOOK_URL]\n    SD[workflows/staging-deploy.yml]\n    E2E[workflows/e2e.yml]\n    DGAR[workflows/deploy-group-auto-rerun.yml]\n    NPM[new: scripts/npm-audit-check.js]\n    LOGSCAN[new: scripts/production-log-scan.js]\n    FLY[flyctl logs --since window]\n    TA --> WH\n    SD -->|coha-s2: announce/status| TA\n    E2E -->|coha-s2: announce/status| TA\n    DGAR -->|coha-s2: retry visibility| TA\n    NPM -->|coha-s3: finding notify| TA\n    LOGSCAN -->|coha-s4: match notify| TA\n    LOGSCAN --> FLY"}}---

## Out of Scope

- **Production-defect triage, write-up, and response** — belongs to the incident-triage-and-respond initiative (4), already cross-referenced via that feature's own `decisions.md`.
- **Full observability platform (APM, distributed tracing, custom metrics dashboards)** — `flyctl logs` plus existing PostHog analytics are the only inputs this MVP uses.
- **Automatic vulnerability remediation** — story 3 detects and notifies; it never auto-upgrades a dependency or auto-merges a Dependabot PR.
- **Slack as a notification target** — only Teams has real scaffolding (`teams-adapter.js`); Slack would need its own adapter, a separate future story.
- **A standing watch process of any kind** — every story's mechanism is triggered and bounded, confirmed above.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-------------------|--------|-------------------------|
| CI/CD chain notification coverage | 0% — no patch/build/test/deploy event generates a notification today | 100% of merges trigger a notification at each defined transition | Stories 1 (adapter) and 2 (CI/CD hooks) together deliver this |
| Manual CI toil reduction for known-flaky patterns | 3 confirmed manual `gh run rerun` interventions this session alone (`actr-s1/s2/s3`) | Near-zero manual reruns/month for already-known-flaky patterns | Story 2's auto-retry visibility means a human no longer needs to manually verify whether a retry already happened |
| Vulnerability-finding visibility | 0% — no Dependabot, no `npm audit` step anywhere in CI | 100% of CI runs include the audit step; 100% de-dup rate on repeat findings | Story 3 |
| Production-defect detection latency | `[UNKNOWN BASELINE]` — defects found only by accident today | A real first measurement within month 1 | Story 4 is the mechanism that measurement comes from |
| `dompurify` critical finding resolution (Tier 3) | Critical, unaddressed, logged as RISK-ACCEPT (2026-11-08) | Resolved or re-confirmed by story 3's ship date | Story 3 is the mechanism that will re-surface this exact finding as its first real result |

## Stories in This Epic

- [ ] Outbound Teams chat-notification adapter — coha-s1
- [ ] CI/CD chain notifications (announce, status, auto-retry visibility) — coha-s2
- [ ] Vulnerability-check CI step with de-duplicated notification — coha-s3
- [ ] Bounded production-log scan with pattern-match notification — coha-s4 (SUPERSEDED by coha-s5 and coha-s6, pending operator confirmation)
- [ ] Production error capture to PostHog with tenant text scrubbed — coha-s5 (test plan written)
- [ ] Alert-to-GitHub-issue bridge for new production error issues — coha-s6 (review passed run 3)
- [ ] Incident record created for each production error GitHub issue — coha-s7 (draft)

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Touches CI/CD workflow files and introduces a new secret-backed outbound integration and a new credential-consuming script (story 4) — not customer-facing or regulated, but warrants a human PR review checkpoint given the secrets-handling and workflow-file surface area, rather than fully autonomous proceed.

## Complexity Rating

**Rating:** 2
**Rationale:** Story 1 carries genuine new-code complexity (confirmed in /clarify: not a trivial extension of an inbound-only pattern). Stories 2-4 are each a bounded, well-scoped integration against an already-understood trigger source, but story 4 touches an external credential (Fly.io API token) and pattern-matching logic with real design latitude.

## Scope Stability

**Stability:** Stable
**Rationale:** Every assumption behind this MVP (outbound mechanism, log retention, audit noise rate) was verified with real data or real code during /clarify, not left as an open question carried into /definition.
