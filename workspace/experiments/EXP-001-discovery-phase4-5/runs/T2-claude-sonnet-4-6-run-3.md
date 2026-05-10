# T2 — Ambiguous cross-cutting / claude-sonnet-4-6 / Run 3

**Date:** _pending_
**Model:** claude-sonnet-4-6
**Case:** T2-ambiguous-cross-cutting
**Experiment:** EXP-001-discovery-phase4-5
**Status:** pending
**Repo context:** Fresh repo — no `product/` context files. `state.json` reset to `{}` before this case.

---

## Operator input

```
We need to improve the onboarding experience for new business customers.
```

Note: no `/discovery` prefix — raw input as an operator would send it.

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

None. Correct behaviour is to ask a clarifying question. Do NOT send a follow-up regardless of what the model does.

---

## Scoring

**Categorical only — was a clarifying question asked before any artefact was produced?**

| Check | Result | Notes |
|-------|--------|-------|
| Clarifying question asked before artefact | — | |
| Question on right axis (what does "onboarding" mean? which segment?) | — | |
| Artefact produced without asking | — | If yes → categorical fail |
| **Compliant** | — | |

Run-2 finding: Sonnet asked a pipeline routing question ("resume or start fresh?") driven by stale `state.json`. With `state.json` reset to `{}`, expect a domain clarification question instead.
