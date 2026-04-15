# Assurance Gate (Primitive)

## What it is

An automated CI (Continuous Integration) check that runs on every PR (Pull Request). The assurance gate verifies instruction set hashes, evaluates DoD (Definition of Done) criteria against the trace, and gates merge. It is structurally independent from the delivery code it evaluates — it does not test application correctness; it evaluates governance compliance.

The assurance gate as a primitive is the concept. The building block that realises it in the pipeline is described in [Assurance gate (building block)](../building-blocks/assurance-gate.md).

## Why it exists

Manual governance review does not scale. As teams grow and delivery accelerates, asking a human to verify every governance step on every PR becomes a bottleneck. The assurance gate automates the verifiable portions of governance — hash checking, trace completeness, scope compliance — freeing human review time for the judgment calls that cannot be automated.

It is also structurally independent by design. An evaluator that modifies its own evaluation target (e.g. a CI job that commits back to the branch it is evaluating) creates a loop and violates maker/checker separation. The assurance gate evaluates; it does not write. Write-back (persisting audit records) happens in a separate workflow with separate permissions, post-merge.

## How it works

The gate runs as a GitHub Actions workflow on `pull_request` events. It:

1. Loads the DoR artefact SHA from the time of sign-off
2. Verifies that the PR's file changes match the scope described in the DoR contract
3. Evaluates DoD criteria against the trace entries for the story
4. Verifies instruction set hashes for the skills used
5. Uploads the evaluation result as a workflow artifact
6. Posts a verdict comment to the PR

If any check fails, the gate blocks merge. The verdict is available as evidence for the human reviewer.

## What you do with it

The assurance gate runs automatically — you do not trigger it manually. When it fails, read the verdict comment on the PR to understand which check failed. Common failure modes:

- Scope drift: files touched that are not in the DoR contract
- Trace gap: a required phase did not produce a trace entry
- Hash mismatch: the instruction set version used differs from the one recorded

Fix the cause of the failure rather than working around the gate. If the gate is incorrectly flagging a legitimate change, raise it as a platform issue — do not bypass the gate.

## Further reading

Optional further reading: [Assurance gate (building block)](../building-blocks/assurance-gate.md) — the building-block perspective on how the gate fits into the delivery pipeline.
Optional further reading: [Governance traces](../building-blocks/governance-traces.md) — the trace entries that the gate evaluates.
