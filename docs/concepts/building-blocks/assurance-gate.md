# Assurance Gate (Building Block)

## What it is

The assurance gate is the automated CI (Continuous Integration) check that runs on every PR (Pull Request). It verifies instruction set hashes, evaluates DoD (Definition of Done) criteria against the trace, checks scope compliance against the DoR (Definition of Ready) contract, and gates merge. It is structurally independent from the delivery code it evaluates.

The assurance gate is the building-block perspective: how it fits into the delivery pipeline, when it runs, and what it produces for human reviewers. The primitive-level definition (what it is as a structural component) is at [Assurance gate (primitive)](../primitives/assurance-gate.md).

## Why it exists

Human reviewers cannot practically verify governance compliance on every PR — checking trace completeness, hash correctness, and scope adherence manually across many stories would be a bottleneck. The assurance gate automates the verifiable portions of governance, making them structural and consistent rather than dependent on reviewer attention and thoroughness.

The gate also enforces maker/checker independence. It evaluates compliance; it does not write to the branch it is evaluating. Write-back (persisting audit records) happens in a separate post-merge workflow with separate permissions. This structural separation prevents the evaluator from modifying its own evaluation target.

## How it works

The gate runs automatically on every `pull_request` event in GitHub Actions. Its checks include:

- **Hash verification:** Confirms the instruction set hash recorded in the trace matches the current version of the used skills
- **Trace completeness:** Verifies that all required phase trace entries are present for the story
- **Scope compliance:** Reads the DoR contract and verifies that the PR's file changes match the signed-off scope
- **DoD evaluation:** Evaluates DoD criteria against the surface-adapted result
- **Watermark check:** Verifies the eval suite pass rate meets the floor threshold

The gate posts a verdict comment to the PR and uploads the evaluation result as a workflow artifact. If any check fails, merge is blocked.

## What you do with it

The gate runs automatically — you do not trigger it. When it reports a failure, read the verdict comment carefully. The failure description identifies which check failed and why.

Common patterns:
- A trace gap means a required phase was skipped — run the phase and re-push
- A scope mismatch means the PR touches files outside the DoR contract — either revert the out-of-scope change or amend the DoR through a new pipeline run
- A hash mismatch means the skill was updated between sign-off and delivery — run the affected phase again with the current skill version

Never work around the gate. If the gate is incorrectly flagging a legitimate change, raise it as a platform issue.

## How it relates to

- [Governance traces](governance-traces.md) — the trace entries the gate evaluates
- [Definition of Ready](definition-of-ready.md) — the scope contract the gate checks for compliance
- [Watermark gate](watermark-gate.md) — the eval suite floor check that runs as part of the gate
- [Assurance gate (primitive)](../primitives/assurance-gate.md) — the structural description of the gate as a platform primitive
