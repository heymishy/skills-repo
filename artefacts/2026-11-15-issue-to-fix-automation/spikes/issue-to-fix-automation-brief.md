# Spike brief (proposed, not yet confirmed): can the platform safely turn a recorded production error into a deployed fix with a human only approving?

**Parent feature:** the coha chain (artefacts/2026-11-08-cicd-observability-hardening-automation/) as extended on 2026-11-15
**Spike slug:** issue-to-fix-automation
**Status:** PROPOSED. The /spike skill requires you to confirm the question, scope and done condition before any investigation starts (Step 7).

## Context

Today, one real production error runs this chain with no human step: PostHog issue, alert, GitHub issue (#1101), incident record pull request (#1102), in about 30 seconds. After that the loop stops and waits for a person. The operator wants to consider automating the next part: from the recorded issue to a short-track fix, a draft pull request and a deploy.

## The question (one sentence, answerable with PROCEED, REDESIGN or DEFER)

Can the platform safely start an automated short-track attempt from a bridge-opened production error issue, ending in a draft pull request with the human gates (merge, production promotion) kept, and what controls make it safe enough to build?

## Why it is blocked / what it unblocks

Nothing is blocked today; this decides whether to write a story for it. Evidence that it is worth asking: the bug behind #1101 took a full session of manual short-track steps (story, test plan, DoR, branch, tests, fix, verification, PR).

## Type, scope, done condition

- **Type:** 3, design decision (which of several approaches, and under what controls).
- **Scope:** Standard, at most 6 investigation steps.
- **Done condition (decided before investigating):** a written options assessment of at least three designs, each scored on safety, cost, who holds the credentials, and how it fits the existing pipeline; a recommended design with its list of controls; and a small paper walk-through of that design against issue #1101 (what the automation would have read, written and opened, and where it must have stopped for a human). No code is built.
- **Out of scope:** building any automation; changing the pipeline skills; deciding the model or vendor; auto-merging or auto-promoting anything (the spike assumes both stay human); anything touching production data.

## Options to assess (starting list)

1. **Scheduled or event-triggered cloud agent** (a routine created with the schedule/routine feature, or a GitHub Actions workflow that runs an agent) that picks up a labelled issue, runs the short-track skills and opens a DRAFT pull request. Human merges; the existing Staging Deploy workflow deploys staging and holds production promotion for approval.
2. **Human-started, agent-assisted:** the issue (or its record pull request) carries a ready-to-paste instruction block (context from the record, suspect files from the stack, the exact next skill), and the operator starts the agent locally with one command. No new credentials in CI; slower; safest.
3. **Triage only:** automation drafts the story and test plan into a pull request for the operator to review before any implementation begins. Two human gates; lowest risk; saves the writing but not the building.
4. **Status quo plus improvements:** keep fully manual; instead improve the record (suspect file and line from the scrubbed stack, linked prior incidents) so the manual step starts faster.

## Controls the assessment must cover

- **Trust boundary:** what text the agent reads. The bridge issue holds only fixed fields (code, environment, time, links); anything the agent reads beyond that (logs, source) must be treated as untrusted data, never as instructions.
- **Credentials and permissions:** which token the agent would use, its scope (read code, write a branch, open a draft pull request; never merge, never touch workflow files or secrets, never deploy production), and where it lives.
- **Blast radius and gating:** draft pull requests only; branch-protection stays; the production promotion approval stays human; an eligibility rule for which errors may be attempted (reproducible by a test, small diff, no schema or auth changes without a human), plus a kill switch and a rate limit.
- **Verification:** the same gates as today (failing test first, full suite against the acknowledged baseline, the live acceptance query) with the agent's claims independently checked, as this repo already requires.
- **Cost and quota:** expected cost per attempt and a monthly cap; behaviour when the quota runs out.
- **Learnings from this feature:** the three wire-type misses (sff-s1, pes-s1, first_seen) show an agent that trusts its own mocks ships green-but-broken fixes; any design must keep a live check as a blocking acceptance step.

## Outcome options

- **PROCEED:** write a story for the recommended design (probably starting with option 3, then 1).
- **REDESIGN:** the recommended design needs a different trigger or a new token model first.
- **DEFER:** not worth building yet (for example, error volume is too low, or the unsafe controls cost more than the manual step).

## To confirm before it runs

Reply with: confirm, or what to change in the question, scope (narrow, standard or thorough), done condition or out-of-scope list. I will not start investigating until you confirm.