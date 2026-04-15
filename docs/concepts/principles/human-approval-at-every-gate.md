# Human Approval at Every Gate

## What it is

DoR (Definition of Ready) sign-off, assurance gate merge decision, and DoD (Definition of Done) confirmation all require a human signal. The platform automates verification; it does not automate judgment.

## Why it exists

Automated verification can confirm that a story satisfies measurable criteria — tests pass, trace entries are present, acceptance criteria are covered. It cannot confirm that the work is the right work, that the scope was appropriate, or that the implementation reflects the intent of the people responsible for the outcome. These are judgment calls that require a human in the loop.

By requiring a human signal at each governance gate, the platform ensures that automation accelerates delivery without removing accountability. The human is not approving because the platform cannot proceed without a click — they are approving because they have reviewed and accepted responsibility for the decision.

## How it works

There are three primary gates, each requiring a human signal:

1. **DoR sign-off:** A designated approver reviews the story, test plan, and scope contract before coding begins. The approval is recorded in `pipeline-state.json` with the approver identity and timestamp.

2. **Assurance gate merge decision:** After the coding agent opens a draft PR, a human reviews the implementation, the assurance gate result, and the trace — and decides whether to merge.

3. **DoD confirmation:** After merge, a human confirms that the delivered story satisfies the acceptance criteria as observed in the running system or the review artefacts.

Each gate is a structural checkpoint, not a rubber stamp. The platform surfaces the evidence; the human evaluates it.

## What you do with it

When you reach a gate, read the evidence before approving. The DoR checklist tells you what the agent will be permitted to do; the assurance gate result tells you what the agent did and whether it matches; the DoD artefact tells you what was delivered.

If the evidence is incomplete or incorrect, do not approve — raise the gap as a PR comment or pipeline issue and allow the appropriate skill to address it.

## Further reading

Optional further reading: [Assurance gate](../building-blocks/assurance-gate.md) — explains the automated portion of the CI gate that prepares evidence for human review.
