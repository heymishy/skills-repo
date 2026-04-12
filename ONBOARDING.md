This is the step most teams skip and shouldn't. `/improve` reviews the completed delivery,
looks at what was in `learnings.md`, compares actual vs estimated complexity, and identifies
whether any patterns from this story should feed back into the skill base.

If it produces a `workspace/proposals/` entry — a proposed skill improvement — review it and
decide whether to raise a PR against the skills fleet repo. That PR is the governed path for
your squad's discoveries to improve the platform for everyone.

---

## What good looks like

After 3–4 stories you should see:

- Stories completing in a single inner loop session without mid-run intervention
- The assurance gate passing first time consistently
- Your `learnings.md` accumulating patterns specific to your domain
- Estimation accuracy improving (the platform tracks forecast vs actual)

If stories are regularly stalling mid-inner-loop, the most common causes are: scope too large
(split the story), ACs not verifiable (rewrite them), or `context.yml` not configured for your
domain (standards not injecting correctly).

---

## Outer loop reference

The inner loop is only half the platform. The outer loop is the continuous improvement cycle
that makes the platform self-improving over time. For full outer loop documentation — including
the EVAL.md harness, the `/improve` → fleet PR flow, and the upward standards loop — see
[`skill-pipeline-instructions.md`](./skill-pipeline-instructions.md).

---

## Support and escalation

| Need | Where to go |
|---|---|
| Platform documentation | [`skill-pipeline-instructions.md`](./skill-pipeline-instructions.md) |
| Governance and risk | [`MODEL-RISK.md`](./MODEL-RISK.md) |
| Current pipeline state | [`.github/pipeline-state.json`](./.github/pipeline-state.json) |
| Skill improvement proposals | Raise a PR against the skills fleet repo with a `workspace/proposals/` entry |
| Something's broken | Raise an issue in the skills repo with your `learnings.md` and the failing trace |
