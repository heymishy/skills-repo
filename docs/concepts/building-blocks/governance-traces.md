# Governance Traces

## What it is

Governance traces are the structured records written to `workspace/traces/` at each phase boundary. Each trace entry records what skill was used, at which version (hash), what was produced, and when. Together, the trace entries for a story form an unbroken chain of evidence — a verifiable record of the full delivery history.

Traces are the input to the assurance gate (which evaluates them on every PR) and to the improvement agent (which reads them to detect failure patterns). They are the concrete realisation of the governance-by-demonstration principle.

## Why it exists

Governance that relies on participant attestation ("we followed the process") is not governance — it is a social contract that degrades under pressure and disappears when people leave. Traces make governance structural: the evidence exists in the repository, committed, versioned, and hash-verifiable, independent of who ran the pipeline and independent of memory.

Traces also enable the platform to improve itself. The improvement agent reads traces to detect recurring failure patterns across features and teams. Without traces, the signal that would improve the platform is invisible.

## How it works

Each skill writes a trace entry as a mandatory final step. The entry is written to `workspace/traces/` as a JSONL (JSON Lines) file. Each entry includes:

- `skill`: the skill name
- `hash`: the instruction set hash at the time of use
- `phase`: the pipeline phase
- `verdict`: pass, fail, or in-progress
- `timestamp`: ISO 8601
- Links to the artefacts produced at this phase

On PRs, the assurance gate reads the trace entries for the story being delivered and verifies the chain is complete. On merge, a separate write-back workflow (not the assurance gate workflow) commits the trace to `workspace/traces/` on the main branch — creating a permanent in-repository audit record.

Trace files are never committed to story or feature branches. They are persisted to main post-merge only.

## What you do with it

You do not write trace entries manually — skills write them. Your role is to not break the chain by skipping phases. If the assurance gate reports a trace gap, investigate which phase was skipped and run the appropriate skill to close the gap.

When something goes wrong in delivery, start by reading the trace. It tells you exactly which phases ran, with which instruction set versions, and what they produced. Root-cause investigation from the trace is faster and more reliable than investigation from memory.

## Further reading

Optional further reading: [Governance by demonstration](../principles/governance-by-demonstration.md) — the design principle that traces implement.
Optional further reading: [Assurance gate](assurance-gate.md) — the CI check that evaluates traces on every PR.
