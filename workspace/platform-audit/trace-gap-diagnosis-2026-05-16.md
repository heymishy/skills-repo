# Trace Production Gap — Diagnosis (P14)
## Date: 2026-05-16
## Platform audit reference: P14

---

## Finding

`workspace/traces/` on master has no entries after 2026-04-12 (16 JSONL files,
all dated 2026-04-11 and 2026-04-12). The improvement agent (`improvement-agent-schedule.yml`)
runs on master and reads `workspace/traces/`, so it cannot see any traces since
mid-April. The self-improvement loop has been starved of recent pipeline signals
for approximately 5 weeks.

---

## Root cause

### Before PR #53 (before ~2026-04-12)

The `assurance-gate.yml` workflow committed trace files **directly to master** using
the message format `chore: assurance gate trace [ci skip]`. The files lived at
`workspace/traces/` on master and were readable by the improvement agent.

### After PR #53 (2026-04-12 onwards)

PRs #53–#55 refactored `trace-commit.yml` to push trace files to a **separate
`traces` branch** (`origin/traces`) rather than master. The rationale was to
avoid polluting the master commit history with bot-generated trace commits.

Key workflow change in PR #53:
```bash
git push -u origin traces --force-with-lease
```
...instead of pushing to master.

Since this change, post-merge trace commits have been accumulating on `origin/traces`
(confirmed: 8+ commits, most recent: 2026-05-13 `a283576`). These are invisible to
the improvement agent because `improvement-agent-schedule.yml` checks out master
and reads `workspace/traces/` from that checkout — the traces branch is never fetched.

---

## Evidence

| Data point | Value |
|-----------|-------|
| Last trace file on master | `2026-04-12T23-01-54-695Z-ci-d56b2911.jsonl` |
| Most recent post-merge trace commit (any branch) | `a283576` — 2026-05-13 on `origin/traces` |
| `git log --all \| grep post-merge` count after 2026-04-12 | 8+ commits |
| PR that changed trace destination | PR #53 (`fix: trace-commit.yml — push to traces branch`) |
| Follow-up fixes | PR #54 (remote tracking), PR #55 (fetch before branch check), `9acb558` (staging before checkout) |

---

## Fix options

### Option A — Preferred: Fetch traces branch in improvement-agent workflow

Add a pre-run step to `improvement-agent-schedule.yml` that populates
`workspace/traces/` from the traces branch before running the agent:

```yaml
- name: Fetch latest traces from traces branch
  run: |
    git fetch origin traces
    git checkout origin/traces -- workspace/traces/ || true
    echo "Traces populated from origin/traces"
    ls workspace/traces/ | head -5
```

Insert this step between `checkout` and `Set up Node.js` (before the agent runs).

**Why this is preferred:**
- Preserves the design intent of keeping master clean from bot commits
- The improvement agent gets current traces without changing the trace-commit design
- No schema or format changes required
- Reversible

### Option B — Change trace-commit.yml to also update master workspace/traces/

Add a step at the end of `trace-commit.yml` that commits the new trace files to
master as well:

```bash
git checkout master
git add workspace/traces/
git commit -m "chore: trace sync to master [post-merge]" || true
git push origin master
```

**Risk:** This re-introduces bot commits on master (the thing PR #53 was trying to avoid).
Also: the `precheck` step in trace-commit.yml looks for `[post-merge]` in the commit
message to avoid re-trigger loops — this new commit would also need that tag.

### Option C — Merge traces branch into master on a schedule

Add a scheduled workflow that merges `origin/traces -- workspace/traces/` into master
via a commit. Essentially the same as Option B but decoupled from the per-PR trace cycle.

---

## Recommended fix

**Option A** — add the fetch step to `improvement-agent-schedule.yml`. This is the
smallest, most targeted change. One extra step in one workflow.

Story required: yes (this is a behavioural change to a governed workflow).
Story size: small (2 AC: agent reads current traces; no regression on existing behaviour).
DoR: can be fast-tracked (test plan is one integration test verifying the fetch step
runs and the traces directory has entries newer than 2026-04-12 after the step).

---

## Secondary finding

The `assurance-gate.yml` `Upload trace artifact` step uploads `workspace/traces/`
(the checked-out repo's trace directory, which only has the old April files) as the
`assurance-trace` artifact. This means the artifact has stale content. The trace-commit.yml
downloads this artifact and commits it to `origin/traces` — so the traces branch is
accumulating the same old files on every PR merge.

New trace records are **not** being generated during CI runs. The trace files that
exist on `origin/traces` are the same April 11-12 files re-committed repeatedly.
The trace content (16 files) is not growing.

**Root cause of this secondary finding:** The assurance-gate does not call any
script that generates a new JSONL trace file at run time. New trace production
requires a deliberate "trace writer" step (e.g. `scripts/ci-adapter.js` writing
a new JSONL record to `workspace/traces/`) that does not currently exist in the gate.

This means P14 has two layers:
1. Traces aren't reaching master (primary — Option A fixes this)
2. No new traces are being generated per-PR anyway (secondary — requires a separate story
   to add a trace-writer step to assurance-gate.yml)

The improvement agent can only use what trace data exists. Until new traces are generated,
it will work with 16 April-dated trace records regardless of which branch it reads from.

---

## Action items

| # | Action | Owner | Priority |
|---|--------|-------|----------|
| 1 | Story: add trace-fetch step to improvement-agent-schedule.yml (Option A) | Platform team | HIGH |
| 2 | Story: add per-PR trace writer to assurance-gate.yml (generate a new JSONL record on each PR) | Platform team | HIGH |
| 3 | Update workspace/state.json P14 to reflect: root cause = traces branch split + no trace writer | Current session | Now |

---

## Related files

- `.github/workflows/trace-commit.yml` — pushes to `origin/traces` (see precheck + checkout steps)
- `.github/workflows/improvement-agent-schedule.yml` — reads from master `workspace/traces/`
- `.github/workflows/assurance-gate.yml` line 91–94 — uploads `workspace/traces/` as `assurance-trace` artifact
- `workspace/traces/` — 16 files, all 2026-04-11/12, last: `2026-04-12T23-01-54-695Z-ci-d56b2911.jsonl`
- Git commits #53–#55 — PRs that changed trace destination from master to traces branch
