---
name: trace
description: >
  Validates the full traceability chain across all pipeline artefacts for a feature.
  Surfaces broken links, orphaned artefacts, scope deviations, and metric gaps.
  Use on-demand ("trace this feature", "chain check", "traceability report") or
  automatically on PR open as a CI trigger. Read-only — reports findings for humans
  to action, does not fix anything.
triggers:
  - "trace this feature"
  - "chain check"
  - "traceability report"
  - "are all stories linked"
  - "pipeline health"
  - on PR open (CI trigger)
---

# Trace Skill

## Entry condition

None. Can run at any pipeline stage — running on an incomplete pipeline surfaces
gaps, which is valid and useful.

---

## Step 1 — Confirm scope

State what was found:

> **Feature artefacts found:**
> - discovery.md: ✅ / ❌ missing
> - benefit-metric.md: ✅ / ❌ missing
> - epics: [n]
> - stories: [n]
> - test plans: [n of n stories]
> - DoR artefacts: [n of n stories]
> - DoD artefacts: [n of n merged stories]
> - Open spikes: [n]
>
> Trace the full feature, or a specific story?
> Reply: full feature — or name the story

---

## Chain structure

A healthy chain for each story:

```
Shipped code (PR)
  → test results (CI)
  → ACs (story)
  → story (definition artefact)
  → epic (definition artefact)
  → benefit metrics (benefit-metric artefact)
  → discovery artefact
  → original problem statement
```

A link is broken if:
- A reference is missing or points to a non-existent artefact
- A reference exists but the content doesn't match (e.g. metric referenced in story
  doesn't exist in benefit-metric artefact)
- An artefact exists but is not linked to anything upstream or downstream

---

## Chain walk — per story

For each story, walk upstream and downstream:

**Upstream (story → discovery):**
- Story references parent epic? ✓/✗
- Story references benefit-metric? ✓/✗
- Story's metric reference exists in benefit-metric artefact? ✓/✗
- Benefit-metric references discovery? ✓/✗
- Discovery exists and is approved? ✓/✗

**Downstream (story → shipped code):**
- Story has a test plan? ✓/✗
- Story has a DoR artefact showing PROCEED? ✓/✗
- Story has a DoD artefact? ✓/✗ (if PR is merged)
- DoD shows COMPLETE or COMPLETE WITH DEVIATIONS? ✓/✗

---

## Additional checks

**Metric orphan check:**
For each metric in the benefit-metric artefact:
- At least one story references it? ✓/✗
- At least one DoD records metric signal status? ✓/✗

**Scope deviation summary:**
Collect all scope deviations from DoD artefacts. These are where shipped code
drifted from the plan.

**AC coverage gaps:**
List any ACs not covered by the test plan. List test plan gaps acknowledged
but not mitigated.

**CSS-layout-dependent gap check:**
For each story with a test plan, check the gap table for entries with gap type
`CSS-layout-dependent` handled as manual-only:
- If no matching RISK-ACCEPT is found in the feature's `decisions.md` → flag as
  MEDIUM finding: "AC[n] in [story] is CSS-layout-dependent, handled manual-only,
  no RISK-ACCEPT recorded. See /decisions."
- Severity: MEDIUM — this class of gap is how layout bugs ship post-merge.

**Coverage map check:**
- If `coverageMapPath` is not set on the feature AND the feature has at least one
  story at `test-plan` stage or beyond → surface as a suggestion:
  "🗺️ Coverage map not generated — run `/coverage-map` for gap visibility"
- If `coverageRisk: "red"` is set on the feature → flag as MEDIUM finding:
  "Feature has red coverage risk — CSS-layout-dependent gaps present. Review
  the coverage map before proceeding."

**Open spikes:**
List any spikes with no outcome artefact — these represent known unknowns
still unresolved.

**NFR orphan check:**
If `artefacts/[feature]/nfr-profile.md` exists:
- Check each NFR in the profile has at least one story with a matching NFR reference
- Check each story's NFR field references are resolvable in the profile
- Check all compliance NFRs with named clauses have documented sign-off (either in
  the DoR artefact or the NFR profile itself)

For each orphaned NFR (in the profile but not in any story):
→ Flag as MEDIUM finding: "NFR '[name]' is defined in nfr-profile.md but not
  referenced in any story — it may not be tested or verified."

For each NFR in a story not in the profile:
→ Flag as LOW finding: "Story [slug] references NFR '[name]' not in nfr-profile.md —
  consider adding it to the profile for traceability."

For each compliance NFR without sign-off:
→ Flag as HIGH finding if that NFR has a named regulatory clause.

If `nfr-profile.md` does not exist and any story has NFRs defined:
→ Flag as MEDIUM finding: "No nfr-profile.md found but story NFRs are present —
  run /definition Step 7 to generate the profile."

**Architecture compliance check:**
If `.github/architecture-guardrails.md` exists:
- Each story's Architecture Constraints field references applicable ADRs or
  states "None identified — checked"? ✓/✗
- No DoD artefact records a scope deviation that crosses a named guardrail
  or mandatory constraint? ✓/✗
- All repo-level ADRs referenced in story Architecture Constraints fields are
  still listed as Active (not Superseded or Deprecated)? ✓/✗

Flag any violation as a finding. Superseded ADR references should trigger a
story update before the next story in the same feature proceeds.

**Registry sync check (if Guardrails Registry block exists):**
Scan the prose sections of `architecture-guardrails.md` for ADR, mandatory constraint, pattern, and anti-pattern IDs (e.g. `ADR-001`, `MC-SEC-01`, `PAT-01`, `AP-01`). For each ID found in the prose that has no matching `id:` entry in the `yaml guardrails-registry` block, flag as a LOW finding:
→ "[ID] exists in prose section '[section]' but has no entry in the Guardrails Registry block — the compliance matrix will not track it."

This is a mechanical check — it catches stale registries where authors added prose but forgot to update the YAML block.

If `.github/architecture-guardrails.md` does not exist:
> ⚠️ No `architecture-guardrails.md` found — architecture compliance check skipped.

---

## Output format

Conforms to `.github/templates/trace-report.md`.
Save to `artefacts/[feature]/trace/[date]-trace.md`.

---

## CI usage

When triggered on PR open, post a condensed comment:

> **Trace check**
> Chain: ✅ Healthy / ⚠️ [n] warnings / ❌ [n] broken links
> [If issues:] Full report: `artefacts/[feature]/trace/[date]-trace.md`

### Setting up CI integration

The trace validation script (`scripts/validate-trace.sh`) is CI-platform agnostic.
Read `context.yml: runtime.ci` and set up accordingly:

**GitHub Actions** (`ci: github-actions`):
Copy `.github/workflows/trace-validation.yml` from the skills repo into your repo.
The install script does this automatically when `ci: github-actions` is detected.

**Jenkins / CloudBees** (`ci: jenkins`):
Add a stage to your `Jenkinsfile`:
```groovy
stage('Trace Validation') {
    when { changeRequest() }
    steps {
        sh 'bash scripts/validate-trace.sh --ci'
        archiveArtifacts artifacts: 'trace-validation-report.json', allowEmptyArchive: true
    }
}
```

**GitLab CI** (`ci: gitlab-ci`):
```yaml
trace-validation:
  stage: validate
  script: bash scripts/validate-trace.sh --ci
  artifacts:
    paths: [trace-validation-report.json]
    when: always
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

**Azure Pipelines** (`ci: azure-pipelines`):
```yaml
- task: Bash@3
  displayName: 'Trace validation'
  condition: eq(variables['Build.Reason'], 'PullRequest')
  inputs:
    targetType: inline
    script: bash scripts/validate-trace.sh --ci
```

**Local / no CI** (`ci: none`):
Run manually: `bash scripts/validate-trace.sh` before opening any PR.
Add to a pre-push git hook if you want it enforced locally.

---

## Completion output

**If healthy:**

> ✅ **Trace: HEALTHY**
> [n] stories — full chain intact, no orphaned metrics, no unresolved deviations.
>
> Ready to proceed — or want the full report saved?
> Reply: save report — or done

**If issues found:**

> ⚠️ / ❌ **Trace: [n] issue(s) found**
>
> Most critical: [finding description]
>
> Want me to walk through each finding with the specific fix?
> Reply: yes — or I'll fix them myself

---

## Traces Branch Health

During master branch validation, check `origin/traces` currency:

- Run `git log origin/traces --oneline -1` to retrieve the last commit timestamp
- If last commit is within 24 hours: ✅ Current — traces are up to date
- If last commit is older than 24 hours: ⚠️ Stale — post-merge workflow may not have run. Check CI logs for the last story merge.

Include this in the trace output under "Traces Branch Health":

```
Traces Branch Health:
  Last commit: [ISO 8601 timestamp]
  Status: ✅ Current / ⚠️ Stale
```

If `npm test` fails with a stale-traces error, the traces branch has not received a commit since the last story merge. Re-trigger the post-merge workflow or run `git log origin/traces` to inspect the most recent commits.

---

## What this skill does NOT do

- Does not fix broken links — reports for human or skill action
- Does not make scope decisions — records deviations, humans decide
- Does not update any artefact — read-only
- Does not replace code review

---

## State update — mandatory final step

> **Mandatory.** Do not close this skill or produce a closing summary without writing these fields. Confirm the write in your closing message: "Pipeline state updated ✅."

/trace is read-only and does not update artefacts, but it does update `.github/pipeline-state.json` in the **project repository** to surface findings:

- For any story where a broken chain link is found: set `health: "amber"` (missing artefact) or `"red"` (broken traceability)
- Set `stage: "trace"` for stories that have completed the full chain
- Set `updatedAt: [now]` on the feature record
- Set feature-level `traceStatus: "passed"` if no findings, or `"has-findings"` if any broken links/missing artefacts are reported

**Guardrails compliance update:** After completing the architecture compliance check (which reads `.github/architecture-guardrails.md`), update the feature-level `guardrails[]` array:

- For each guardrail referenced in the `Guardrails Registry` block that was checked during the trace: set `"status": "met"` if no violations, `"status": "not-met"` if an unresolved deviation crosses a guardrail, with `"assessedBy": "/trace"`, `"assessedAt": "[now]"`
- For ADR entries: if a repo-level ADR is found to be Superseded or Deprecated (no longer Active), set the corresponding guardrail entry to `"status": "na"` with evidence noting the change
- Merge by `id` — do not remove existing entries from other skills

This allows the visualiser governance view to surface traceability gaps directly. The `traceStatus` field is read by the governance gate checker — without it the gate shows "Pending" indefinitely.
