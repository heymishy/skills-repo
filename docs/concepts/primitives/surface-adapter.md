# Surface Adapter

## What it is

The interface between the governance brain and a delivery surface. All surface-specific complexity lives behind the adapter; the brain never branches on surface type. Any surface that implements the `execute(surface, context) → result` contract can be governed by the platform.

A delivery surface is where code is written, reviewed, and deployed — GitHub, Bitbucket, a SaaS platform, an IaC pipeline, an M365 admin environment. Each surface has its own CI topology, artefact format, and DoD (Definition of Done) criteria. The surface adapter abstracts all of that, exposing a uniform result structure to the governance brain.

## Why it exists

Without the adapter pattern, adding a new delivery surface would require modifying the governance logic itself — adding branches for Bitbucket, then for GitLab, then for a manual approval surface. Each branch would carry the risk of introducing regressions in other surfaces. Over time, the governance brain would become a large conditional tree that is difficult to test and maintain.

The surface adapter eliminates this by enforcing that all surface-specific knowledge lives in one place: the adapter. The brain remains a pure governance evaluator regardless of where the work is being delivered (see [Adapter-isolated surface concerns](../principles/adapter-isolated-surface-concerns.md)).

## How it works

Each adapter implements: `execute(surface, context) → result`, where result contains:

- `status`: pass, warn, fail, or error
- `findings`: an array of findings (each with `id`, `severity`, `label`, and optionally `detail`)
- `resultPattern`: the type of result (e.g. `checklist`, `diff`, `endpoint-schema`)

Adapters are registered in `src/surface-adapter/index.js`. The resolver maps a surface type identifier (derived from the EA registry `technology.hosting` field or from context configuration) to the appropriate adapter. The governance brain calls the adapter, evaluates the result, and never inspects surface internals.

## What you do with it

If you are adopting the platform on a new delivery surface, you implement a new surface adapter — not a change to the governance scripts. The adapter test suite (`tests/check-surface-adapter.js`) validates that your adapter returns results in the correct structure.

If the adapter returns unexpected findings, look at the adapter implementation first. The governance brain is only as good as the evidence the adapter returns.

## Further reading

Optional further reading: [Adapter-isolated surface concerns](../principles/adapter-isolated-surface-concerns.md) — the design principle that explains why this structure exists.
