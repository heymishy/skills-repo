Slicing strategy: risk-first

## Epic 1 — wsd-s2 Write Verification

Goal: Confirm that wsd-s2's GitHub Contents API write path correctly advances the feature's stage in `pipeline-state.json` on `origin/master`.

Out of scope:
- Any real feature delivery or problem solving
- User-facing functionality
- Long-term retention of this feature (throwaway verification only)

Oversight: Low
Oversight rationale: This is a pure technical verification with no user impact, no regulatory context, and zero complexity.

Complexity: 1
Scope stability: Stable

### ep1-s1 — Advance wsd-s2 feature stage via GitHub API

Persona: Platform operator

So that the wsd-s2 GitHub API write mechanism is verified in production, I need the feature's own stage to be advanced from `discovery` to the next stage via the authenticated operator's GitHub token, confirming the write lands on `origin/master`.

Benefit linkage: Live GitHub Contents API write verification — this story completes the verification by triggering and observing the actual write mechanism.

Architecture constraints: None identified — this is a pure mechanism verification, no architectural patterns apply.

Given the feature is at `discovery` stage in `pipeline-state.json`,
When wsd-s2's write mechanism is triggered to advance the stage,
Then a new commit appears on `origin/master` with the updated `pipeline-state.json`, advancing the feature's stage field to reflect the next phase.

Out of scope:
- Implementing any new functionality
- Touching any files other than `pipeline-state.json`
- Keeping this feature after verification is complete

Dependencies: None
NFR: None
Complexity: 1
Scope stability: Stable