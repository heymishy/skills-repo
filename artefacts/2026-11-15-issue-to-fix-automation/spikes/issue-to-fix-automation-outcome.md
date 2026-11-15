# Spike Outcome: can the platform safely turn a recorded production error into a deployed fix with a human only approving?

**Spike:** issue-to-fix-automation | **Date:** 2026-11-15 | **Type:** 3 (design decision) | **Scope:** Standard, 6 steps used
**Brief:** artefacts/2026-11-15-issue-to-fix-automation/spikes/issue-to-fix-automation-brief.md (confirmed by the operator in chat on 2026-11-15 by asking to run it)
**Parent:** the coha chain (artefacts/2026-11-08-cicd-observability-hardening-automation/); no discovery.md applies to this exploratory spike.

## Outcome: PROCEED (staged; the fully automatic option is DEFERRED)

### What was found

1. **A handoff already exists.** `scripts/handoff-incident.js` and `scripts/lib/incident-handoff.js` (itar-s4) link an incident record to a short-track story and write `incident-handoff.md` for `/test-plan` and `/definition-of-ready`. The automatic part of the loop stops one step earlier than the platform could go: after the record, a person starts the handoff and everything after it.
2. **What the agent would be given is deliberately thin.** The bridge issue holds only the fixed code, environment, first-seen time and the PostHog link (issue #1101). The PostHog event holds scrubbed frames (repo paths, line numbers, identifier-shaped function names). The real cause of #1101, `inconsistent types deduced for parameter $1`, is NOT in PostHog: capture creates a fresh `new Error('tenant_admin_bootstrap_failed')` (src/web-ui/routes/auth.js line 132) and the original message exists only in the private Fly log line next to the tenant id (line 131). **The scrubbing that protects tenants is also what stops an agent from knowing the cause.**
3. **CI today has no model credential and several dangerous ones.** Repo secrets (names only): `CAPTURE_EXCHANGE_SECRET`, `E2E_STAGING_AUTH_STUB_SECRET`, `FLEET_PUSH_TOKEN`, `FLY_API_TOKEN` (a deploy credential), `STAGING_DATABASE_URL`. No Anthropic key. Default workflow token is read-only. Master requires a pull request and status checks; the `production` environment has a protection rule (the human approval that was used for the v187 promotion); GitHub holds the checks on workflow-made pull requests as `action_required` until a person approves them (observed on #1094 and #1102).
4. **A GitHub Copilot coding-agent setup already exists** (`copilot-setup-steps.yml` and a `copilot` environment with no protection rules). Its security model was not assessed in this spike.
5. **CI agents triggered by issues are a documented attack surface.** In June 2026 a flaw in Anthropic's own Claude Code GitHub Action let a crafted issue hijack the run ([Microsoft Security blog](https://microsoft.com/en-us/security/blog/2026/06/05/securing-ci-cd-in-agentic-world-claude-code-github-action-case), [The Hacker News](https://thehackernews.com/2026/06/claude-code-github-action-flaw-let-one.html), [Flatt Security](https://flatt.tech/research/posts/poisoning-claude-code-one-github-issue-to-break-the-supply-chain/)); a similar prompt-injected issue title led to a stolen publish token in another project. Sources differ on details; the lesson that matters here is stable: scope the token, do not trigger agents on untrusted issue text, and keep a human gate.

### Reasoning

Our trigger is safer than most: the recognise step in the coha-s7 workflow already insists on the exact bridge author, a label at opening and a whole-line marker, and the issue body holds no free text. Even so, a fully automatic fix is premature for three reasons: (a) the agent would be missing the cause for exactly the errors that are hardest (the cause is in private logs); (b) the repo's own record this session is that agent fixes with self-written mocks shipped green-but-broken three times (sff-s1, pes-s1, first_seen) and were caught only by a live check; (c) the credentials and quota model does not exist yet. The cheap, safe improvements are enrichment and handoff, not autonomy.

## Options assessed

| Option | Safety | Cost / effort | Credentials | Fit | Verdict |
|---|---|---|---|---|---|
| 1. Event-triggered cloud agent opens a draft PR | Medium to low unless tightly scoped; new attack surface | High (token model, quota, eligibility rules, kill switch) | Needs a model key and a write-scoped token in CI | Fits the gates, but the agent lacks the cause | DEFER until 2 and 3 have run and a credential model exists |
| 2. Human-started, agent-assisted (ready-to-paste instruction block) | High: nothing new in CI | Low | None new | Uses the existing handoff | PROCEED first |
| 3. Automation drafts the story and test plan into a PR for review | High if limited to docs under `artefacts/`; two human gates remain | Medium | A write token limited to one path | Fits; saves writing, not building | PROCEED second |
| 4. Better record: suspect file, line and function from the scrubbed frames; linked prior incidents; a private-log excerpt kept out of CI | High | Low | None new | Directly fixes finding 2 | PROCEED, part of 2 |

## If PROCEED (what happens next)

Write a story for a staged design, in this order:
1. **Enrich the record and the handoff (options 4 and 2).** The incident record gains the top in-app frames (repo path, line, function name: already scrubbed and public-safe). A new `/handoff` convenience prints the ready-to-paste instruction block (record, frames, the exact next skill, and the reminder that the operator supplies any private log text locally, never in a public pull request). No new credentials. This alone would have pointed an agent at `auth.js:132` for #1101.
2. **Optional triage pull request (option 3), later.** A workflow that, only for a recognised bridge issue, opens a pull request adding a draft story and test plan under `artefacts/`. It reads only the validated fields; token scope contents-write on one path and pull-requests-write, nothing else; no model credential is needed if the draft is produced from a template.
3. **Revisit option 1 after both have run for a few real errors,** deciding then on the model credential, Copilot's coding agent versus a self-run agent, and an eligibility rule.

**Controls any later automation must keep (from the assessment):** only the bridge author and the validated fields reach the agent; draft pull requests only; never merge, never edit `.github/workflows/**`, never touch secrets, never deploy production; branch rules and the production approval stay; a kill switch (a repo variable) and a rate limit; a monthly cost cap; the live acceptance query stays a blocking step (it is the check that caught all three misses); the agent's claims are verified independently by a human or a separate check.

## Paper walk-through on issue #1101
With step 1 in place the instruction block would have said: "production error code tenant_admin_bootstrap_failed, route /auth/:p, top frames auth.js:398 handleAuthCallback and the capture call at auth.js:132, first seen 05:51:44 UTC; start `/test-plan` for a short-track fix." An agent (or a person) would then read `_bootstrapTenantAdmin`, find the call into `tenant-admin-bootstrap.js`, and reproduce against a real Postgres. Without the private log message it may or may not spot the double `$1`; the real-database test is what makes it discoverable. It would have stopped at: the draft pull request (human merge), and the production promotion approval. It would not have had the tenant id or the log line.

## What remains unknown
- The Copilot coding agent's own isolation and credential model (not assessed).
- Real error volume: only one real production error so far; the value of automation scales with volume.
- Whether the incident record page should show the frames publicly (they are scrubbed, but this should be a conscious decision).

## Discovery fields resolved
Not applicable (no parent discovery); the outcome is recorded in decisions.md for the coha feature.

## Decision log reference
`artefacts/2026-11-08-cicd-observability-hardening-automation/decisions.md`, entry 2026-11-15 "issue-to-fix automation spike: PROCEED, staged".