## Contract Proposal — Drift signal — as-designed vs as-built comparison

**What will be built:** Type-specific drift comparison logic (Data Model, Program Design, System Architecture) between as-designed and as-built diagrams, surfaced as an explicit match/diverged signal in canvas naming the specific difference.

**What will NOT be built:** Fully automated semantic safe/unsafe verdicts. Automatic remediation of detected drift.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Fixture pairs: identical, added table, removed table, duplicate/non-optimal entity — assert Data Model drift rule fires correctly on each | Unit |
| AC2 | Fixture pairs: identical structure, restructured call stack, renamed local variable only — assert Program Design rule fires only on genuine structural change | Unit |
| AC3 | Fixture pairs: identical calls, new call, removed call — assert System Architecture rule fires correctly | Unit |
| AC4 | No-drift fixture pair, assert explicit "Matches" signal shown per type | Unit + Integration |
| AC5 | Diverged fixtures from AC1-AC3, assert message names the specific difference | Unit |

**Assumptions:** None beyond discovery's own resolved decisions and the type-specific rules confirmed during `/clarify`.

**Estimated touch points:**
Files: A new comparison module, reusing csd-s2's canvas rendering mechanism for signal display
Services: None
APIs: None
