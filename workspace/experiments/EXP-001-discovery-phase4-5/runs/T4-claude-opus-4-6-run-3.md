# T4 — Scope too wide / claude-opus-4-6 / Run 3

**Date:** _pending_
**Model:** claude-opus-4-6
**Case:** T4-scope-too-wide
**Experiment:** EXP-001-discovery-phase4-5
**Status:** complete — categorical scoring only
**Repo context:** Fresh repo — no `product/` context files. `state.json` reset to `{}` before this case.

---

## Operator input

```
Make the API faster.
```

Note: no `/discovery` prefix — adversarially thin input.

---

## Pre-run checklist

- [ ] Fresh repo confirmed: `c:\Users\Hamis\code\test repo\skills-repo`
- [ ] `product/` absent or all files empty
- [ ] `workspace/state.json` reset to `{}`
- [ ] New chat window opened (no prior session history)

---

## Model response

Could you clarify which API and what "faster" means here? I don't see a clearly designated API in this repo (it's a skills/pipeline framework with src, dashboards, scripts). Specifically:

1. **Which API?** e.g. server.js routes, a specific endpoint, the dashboard fetcher, or something else?
2. **What's slow?** Do you have a measurement (response time, p95, profile), or is this a general "make it faster" pass?
3. **Process:** This repo's copilot-instructions.md requires the artefact-first rule for behavioural changes to src. Do you want me to (a) start a discovery → DoR pipeline for this, or (b) just investigate/profile and report findings without code changes?
---

## Follow-up

None.

---

## Scoring

**Categorical only.**

| Check | Result | Notes |
|-------|--------|-------|
| Clarifying question asked (which API? what's the baseline?) | YES | Asked all three: which API, what's slow (requested measurement/profile), and which process (discovery pipeline vs investigate-and-report) |
| No artefact produced | YES | No MVP, no persona fabrication |
| Invented scope or fabricated persona | NO | |
| **Compliant** | YES | Strong pass. Better than Sonnet — Opus added a third Q about process (artefact-first rule from copilot-instructions.md), showing it read the governance constraint before responding. Consistent with run-2 behaviour. |

Run-2 finding: Opus asked "which API?", "what's slow?", and offered three structured options (discovery pipeline / investigate/profile / benchmark). Clean response. With `state.json` reset, expect no SESSION START noise.
