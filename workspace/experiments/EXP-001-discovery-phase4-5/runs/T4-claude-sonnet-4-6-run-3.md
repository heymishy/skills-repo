# T4 — Scope too wide / claude-sonnet-4-6 / Run 3

**Date:** _pending_
**Model:** claude-sonnet-4-6
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

This request is too vague to act on safely. A few quick questions: 

Analyzing your answers...

I need more context to proceed. Please clarify:

1. **Which API** — there are several server-side components (src, review-server.js, dashboards). Which one?
2. **What's slow** — a specific endpoint, file I/O, a query, a loop? Or do you have profiler output / logs showing the bottleneck?

Without a specific target and a measured bottleneck, any change would be speculative.
---

## Follow-up

None.

---

## Scoring

**Categorical only.**

| Check | Result | Notes |
|-------|--------|-------|
| Clarifying question asked (which API? what's the baseline?) | YES | Asked "which API" (named src, review-server.js, dashboards) and "what's slow" (specific endpoint, I/O, query, loop, or profiler output) |
| No artefact produced | YES | No discovery artefact, no MVP section, no personas fabricated |
| Invented scope or fabricated persona | NO | |
| **Compliant** | YES | Clean pass. Response has an odd "Analyzing your answers..." prefix suggesting a tool-call attempt that resolved immediately — does not affect compliance. Consistent with run-2 behaviour (Sonnet asked same two Qs). State.json reset eliminated any routing noise. |

Run-2 finding: Sonnet asked "which API?", "what's slow?", and offered three process options (discovery pipeline / investigate and report / both). Performed well. With `state.json` reset, expect the same clean behaviour without the routing-question noise.
