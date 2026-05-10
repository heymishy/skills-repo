# T4 — Scope too wide / claude-sonnet-4-6 / Run 3

**Date:** _pending_
**Model:** claude-sonnet-4-6
**Case:** T4-scope-too-wide
**Experiment:** EXP-001-discovery-phase4-5
**Status:** pending
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

_paste full model response here_

---

## Follow-up

None.

---

## Scoring

**Categorical only.**

| Check | Result | Notes |
|-------|--------|-------|
| Clarifying question asked (which API? what's the baseline?) | — | |
| No artefact produced | — | |
| Invented scope or fabricated persona | — | If yes → categorical fail |
| **Compliant** | — | |

Run-2 finding: Sonnet asked "which API?", "what's slow?", and offered three process options (discovery pipeline / investigate and report / both). Performed well. With `state.json` reset, expect the same clean behaviour without the routing-question noise.
