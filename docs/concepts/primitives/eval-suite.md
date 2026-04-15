# Eval Suite

## What it is

`workspace/suite.json` is the living regression suite for the platform itself. Each entry guards a named failure pattern observed in real delivery. A scenario added to the suite must pass on every subsequent gate run. The eval suite is not a CI test suite in the application-testing sense — it guards harness behaviour, not application behaviour.

## Why it exists

As the platform improves, there is a risk that improvement proposals fix one failure pattern while reintroducing a previous one. Without a regression suite, the platform has no structural protection against this. The eval suite provides that protection: every failure pattern that has been observed and resolved becomes a permanent guard in the suite, ensuring that future changes cannot silently reintroduce it.

The suite also makes the improvement agent's proposals checkable. Before a proposal can be applied, it must be validated against the eval suite — ensuring it does not regress any existing guarded scenario.

## How it works

`workspace/suite.json` contains an array of entries, each with:

- `id`: a unique identifier for the scenario
- `failurePattern`: the named failure pattern this scenario guards (kebab-case, singular)
- `scenario`: the input or context that triggers the failure
- `expectedBehaviour`: what the platform should do when this scenario is encountered
- `status`: pass or fail (updated on each gate run)

The watermark gate reads the suite before allowing a platform change to proceed. If any entry fails, the gate blocks. New entries are added by the `/improve` skill when a new failure pattern is extracted from a completed feature loop.

## What you do with it

You do not edit `workspace/suite.json` directly. New scenarios are added by `/improve` after feature close, when a failure pattern from the delivery trace is extracted and formalised. The improvement agent also adds scenarios when it detects patterns across multiple traces.

If a gate run shows a suite failure, investigate the failing scenario before applying any platform changes. The failure may indicate that a recent skill change has introduced a regression.

## Further reading

Optional further reading: [Self-improving harness](../principles/self-improving-harness.md) — explains how the eval suite feeds into the platform improvement cycle.
Optional further reading: [Watermark gate](../building-blocks/watermark-gate.md) — the gate that uses the eval suite as a floor for platform changes.
