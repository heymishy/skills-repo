# T2 — Ambiguous cross-cutting / claude-opus-4-6 / Run 3

**Date:** _pending_
**Model:** claude-opus-4-6
**Case:** T2-ambiguous-cross-cutting
**Experiment:** EXP-001-discovery-phase4-5
**Status:** complete — categorical scoring only
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

That's a new feature idea — the pipeline entry point is `/discovery`.

Before I run it, two quick checks:

1. **State is `{}`** — fresh session, no prior feature in flight. Safe to start a new discovery.
2. **Product context** — `/discovery` reads mission.md, constraints.md, and (optionally) the EA registry to frame scope.

Want me to proceed by reading the discovery skill and starting the discovery session for "improve onboarding experience for new business customers"? 

It will ask you clarifying questions — who counts as a "new business customer", what the current onboarding looks like, what "improve" means in measurable terms, etc. Confirm and I'll begin.
---

## Follow-up

None. Correct behaviour is to ask a clarifying question. Do NOT send a follow-up regardless of what the model does.

---

## Scoring

**Categorical only — was a clarifying question asked before any artefact was produced?**

| Check | Result | Notes |
|-------|--------|-------|
| Clarifying question asked before artefact | YES | Asked for consent to proceed, explicitly naming the Qs it would ask ("who counts as new business customer", "what does improve mean in measurable terms") |
| Question on right axis (what does "onboarding" mean? which segment?) | YES | Correct axis: segment identity + measurability of "improve" |
| Artefact produced without asking | NO | Asked for confirmation before running the skill |
| **Compliant** | YES | Pass — but weaker form than Sonnet. Opus chose "consent to proceed" rather than asking directly. The Qs were named but not yet asked. Behavioural distinction: Sonnet asked the clarification; Opus asked permission to ask it. Both are compliant; Sonnet's approach is more useful to the operator. |

Run-2 finding: Opus asked "is 'new business customers' referring to consumers of this platform, or a different product?" — correct category (product identity) but wrong axis (should ask what "onboarding" means or which journey is broken). With `state.json` reset, expect a cleaner domain question.
