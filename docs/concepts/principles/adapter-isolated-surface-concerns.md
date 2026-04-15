# Adapter-Isolated Surface Concerns

## What it is

The governance brain never branches on delivery surface type. All surface-specific complexity — DoD (Definition of Done) criteria, CI (Continuous Integration) topology, artefact format — lives behind the surface adapter. The `execute(surface, context) → result` interface is the only constraint the brain needs to know about.

This principle was previously labelled **Surface-agnostic by contract**. If you encounter that name in legacy artefacts, it refers to this same principle. The label was renamed to better describe the mechanism (isolating concerns behind the adapter contract) rather than just the outcome (surface agnosticism). The content and intent are identical.

## Why it exists

Without this principle, every new delivery surface (a new CI platform, a new VCS, a new cloud provider) would require changes to the governance logic itself. The brain would accumulate branches for each surface, making it harder to reason about, test, and maintain. By enforcing that all surface-specific knowledge lives inside the adapter, the brain remains a pure governance evaluator regardless of where the work is being delivered.

## How it works

Each delivery surface implements the same adapter contract: `execute(surface, context) → result`. The result contains findings, a status, and optional evidence fields — but never surface-specific internals. The governance brain calls the adapter and evaluates the result; it never inspects the surface directly.

This means you can add a new delivery surface (say, a Bitbucket Data Centre pipeline) by writing a new adapter, without touching any governance logic. The assurance gate, DoR evaluation, and trace writing all continue to work unchanged.

## What you do with it

When you are contributing a new delivery surface to the platform, implement the surface adapter contract — do not add surface-specific branches to the governance scripts. If you are debugging a governance failure, look at the adapter output first: the governance brain is only as good as the evidence the adapter returns.

If you encounter the phrase "Surface-agnostic by contract" in an older artefact or document, it is referring to this principle under its previous name.

## Further reading

Optional further reading: [Surface adapter](../primitives/surface-adapter.md) — the primitive that implements this principle.
