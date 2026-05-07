# Discovery: Web UI Outer Loop Extensions

**Date:** 2026-05-07
**Feature slug:** 2026-05-07-web-ui-outer-loop-extensions
**Short-track:** Yes — stories written directly; benefit-metric and full outer-loop review skipped given bounded scope and validated platform foundation (ougl DoD complete).

---

## Problem

The ougl feature (ougl.1–7) delivered the core journey loop: pick a feature, step through skill stages, chat with the model, commit artefacts, and trigger sign-off. That foundation works.

What it does not cover: the supporting skills that practitioners reach for mid-journey — `/clarify`, `/decisions`, `/trace`, `/estimate`, `/spike` — and the fact that pipeline-state.json still requires a manual edit after every stage completion in the web UI. These gaps mean the web UI is not yet a complete replacement for the VS Code + manual-edit workflow.

## Opportunity

Six tightly scoped additions close the remaining outer-loop gaps:

1. **Side-trip skills (owle.1–owle.5):** Surfacing `/clarify`, `/decisions`, `/trace`, `/estimate`, and `/spike` at the relevant journey stages. Each is a bounded interaction — a button, a form or chat session, and a write — that does not break the main journey state.
2. **Automated pipeline-state.json writes (owle.6):** Hook artefact commit and sign-off events in the journey UI to automatically update `pipeline-state.json`, eliminating a manual step that currently breaks the operator's flow.

## Scope

### In scope

- Side-trip entry points injected into the journey stage panel at relevant stages
- `/clarify` — launches a skill chat sub-session pre-loaded with the discovery artefact context
- `/decisions` — lightweight form that writes a decision entry to the feature's `decisions.md`
- `/trace` — server-side artefact chain check; results displayed inline (read-only)
- `/estimate` — form that appends an E1 or E2 estimate entry to `workspace/estimation-norms.md`
- `/spike` — form that creates a spike artefact file; outcome recording action on return
- Automated pipeline-state.json write on artefact-commit and DoR sign-off events (local disk only)

### Out of scope

- Full `/clarify` skill logic (the SKILL.md behaviour itself) — the journey only needs to invoke it as a chat session
- Auto-merging clarify output back into discovery.md
- Remote (GitHub API) write of pipeline-state.json — local disk write only
- Any UI changes to non-journey pages

## Stories

| ID | Title |
|----|-------|
| owle.1 | Clarify side-trip: invoke /clarify mid-discovery from journey |
| owle.2 | Decisions side-trip: log architectural decisions from journey |
| owle.3 | Trace side-trip: run chain validation from journey |
| owle.4 | Estimate side-trip: record E1/E2 estimate from journey |
| owle.5 | Spike side-trip: create and record feasibility spikes from journey |
| owle.6 | Post-journey automation: auto-write pipeline-state.json on stage completion |

## Status

**Approved for short-track.** Stories → test-plans → DoR → coding agent.
