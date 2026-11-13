# Review Report: Incident record created for each bridge-opened production error GitHub issue — Run 2

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s7-incident-record-from-production-error-issue.md
**Story slug:** coha-s7
**Date:** 2026-11-13
**Categories run:** A, B, C, D, E (F, G, H N/A: no journey, skills or journeys test file in scope)
**Outcome:** FAIL

Reviewer note: same agent as the author, second pass. Run 1 (`coha-s7-review-1.md`) reviewed the native-route design and is stale. This run re-reads the story as revised for the custom bridge and checks its factual premises against GitHub instead of trusting the story's own text. One premise turned out to be false.

---

## Review Diff — Run 2 vs Run 1

Run 1's findings do not carry over because the design changed (recognition by label, author account and marker line; no workflow label step; no `issues: write`). Its two MEDIUM findings (ADR-009/010 not referenced; logic not in a testable script) are addressed in the current text and re-checked below.

---

## HIGH findings — must resolve before /test-plan

- **[2-H1]** E/A — The story's chosen option rests on a repository mechanism that does not exist. The Architecture Constraints say "the repo's ruleset [must] let the workflow's actor push to `workspace/**`" and the earlier decision text says CLAUDE.md "describes a path-based bypass for `workspace/**`". Read from GitHub on 2026-11-13: the `master` ruleset ("default skills-repo maintainer rules") has the rules deletion, non_fast_forward, pull_request, required_status_checks and required_linear_history, no file-path rule, and its only bypass actor is the repository admin role (actor id 5, mode always); there is no classic branch protection either. GitHub rulesets scope bypass to actors, not to paths. So the bookkeeping pushes that "worked" this session worked because the operator's account is an admin, not because of a path bypass, and a workflow running as the Actions bot cannot push to `master` at all today. The only way to make option A work as written is to add the GitHub Actions app as a bypass actor, which is a blanket bypass for every path on `master`, not `workspace/**` only, and would let any workflow with `contents: write` push anywhere on `master`. The story and the decision both treat this as a small "confirm the path bypass" prerequisite; it is in fact a security decision. Quote: "That is an operator action and a DoR prerequisite; the bypass list must name the actor the workflow pushes as". The decision on option A cannot be taken as made until the operator chooses among the real alternatives below.

## MEDIUM findings — resolve or acknowledge in /decisions

- **[2-M1]** C — AC7 (two issues at once) cannot be proved on GitHub's side without contention that is hard to produce; the story keeps it testable by putting the bounded commit-retry in a tested module, but the retry only matters if a push to `master` is allowed at all (see 2-H1). If the outcome is a pull request instead of a push, AC7 changes meaning (two PRs, no shared-file conflict is guaranteed, records can conflict in `workspace/incidents.json`). Re-check after 2-H1 is decided.
- **[2-M2]** E — ADR-009 and ADR-010 are now referenced and the one-file deviation is disclosed, which resolves run 1's finding. Residual: ADR-010 says audit records are committed to `main` post-merge by a dedicated write-back; if the chosen answer to 2-H1 is a pull request, the record would sit unmerged until the operator merges it, which changes the ADR-010 reasoning and must be restated.

## LOW findings — note for retrospective

- **[2-L1]** A — Recognition requires the issue's author to be the account whose token the bridge uses. If that is a personal fine-grained token, the author is the operator's own account, so an issue the operator opens by hand with the label and marker also qualifies. That is acceptable (the operator can already write incident records) but should be stated.
- **[2-L2]** C — The bridge must create the issue with a token that is not the workflow's own `GITHUB_TOKEN`: issues created with `GITHUB_TOKEN` do not start other workflows. The bridge uses its own token, so this holds, but it is a reason the token choice at coha-s6 DoR matters and is worth a line in the DoR contract.
- **[2-L3]** B — Creating an incident record is adjacent to the discovery's out-of-scope "Production-defect triage, write-up, and response" line; it is the input to triage, so it is not a breach (unchanged from run 1).

---

## Score

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS |
| Scope integrity | 4 | PASS |
| AC quality | 3 | PASS |
| Completeness | 2 | FAIL |

Completeness is a 2 because the story's chosen mechanism (option A) cannot be carried out as specified and its stated prerequisite is not satisfiable the way the story words it.

## Summary

1 HIGH, 2 MEDIUM, 3 LOW across 1 story.
**Outcome:** FAIL — 2-H1 must be resolved before `/test-plan`. This needs an operator decision, not a wording fix. The real options, none of which is "confirm the path bypass":
1. **Blanket bypass for the Actions app on `master`.** Option A works as written, but any workflow with `contents: write` can then push anything to `master`, including workflow files.
2. **The workflow opens a pull request** with the record instead of pushing (the earlier decision's own stated fallback). No ruleset change; the operator merges each record. Records land after a delay and need a status check to pass.
3. **Write the record somewhere the ruleset does not guard.** For example the existing unprotected-from-pushes `traces` branch or a new `incidents` branch, with the incident reader pointed at it. No weakening of `master`, but it changes where the incident-triage feature reads records from.
4. **Move record creation off GitHub Actions** to a place with its own credential (for example the bridge writing through the Contents API with a token limited to the one file), which the earlier decision rejected; reopening it is allowed now that option A's premise is false.

My recommendation is option 2: it needs no new bypass, keeps `master` guarded, and a record only appearing after a human merge is acceptable for an incident that already has an open issue.
