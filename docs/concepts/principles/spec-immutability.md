# Spec Immutability

## What it is

Once a DoR (Definition of Ready) artefact is signed off, its scope contract cannot be changed without a new pipeline run. The coding agent cannot widen its own mandate mid-story. The `artefacts/` directory is read-only to the coding agent by instruction.

## Why it exists

Without scope immutability, a coding agent that encounters an ambiguity mid-implementation might resolve it by expanding scope — adding a feature that was not specified, touching a file that was not in the contract, or making an architectural decision that should have been a human judgment call. These silent scope expansions are among the hardest bugs to detect in AI-assisted development: the code may work, but it may also introduce dependencies, security exposures, or design choices that the team did not review.

By making the DoR artefact immutable at sign-off, the platform ensures that the agent's implementation mandate is fixed before coding begins. If the agent encounters genuine ambiguity that is not covered by the ACs (Acceptance Criteria), it must stop and raise a PR comment rather than improvise.

## How it works

The DoR artefact is written to `artefacts/[feature-slug]/dor/[story-slug]-dor.md` and `[story-slug]-dor-contract.md` before coding starts. These files specify the exact files the agent may touch, the acceptance criteria the implementation must satisfy, and any out-of-scope constraints.

The assurance gate CI check reads the DoR SHA at sign-off and verifies that the PR's file changes match the scope described in the contract. Any deviation — touching an out-of-scope file, missing a required file — is flagged as a gate failure.

## What you do with it

Before handing a story to the coding agent, ensure the DoR artefact is complete, accurate, and signed off. Once signed off, treat it as a contract: if you realise the scope needs to change, run the pipeline again from the appropriate step (typically `/definition` or `/test-plan`) rather than editing the artefact directly.

If the agent raises a PR comment describing an ambiguity it cannot resolve, review the DoR artefact to determine whether the ambiguity should be clarified (which requires a new pipeline run) or whether it is genuinely covered by an existing AC that the agent misread.

## Further reading

Optional further reading: [Definition of Ready](../building-blocks/definition-of-ready.md) — explains the DoR gate and what sign-off means.
