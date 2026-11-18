# Contract Proposal - A review checklist, seeded from recorded defects, shows the items a change's diff is likely to need

**What will be built:**
- `REVIEW.md` at the repository root: ten entries, each seeded from a recorded defect and citing its tracked source.
- `scripts/review-checklist.js`: parses `REVIEW.md`, reads `git diff --unified=0 <base>...HEAD` (default base `master`), prints the entries that match, and with `--check` validates the file and its sources. Exports its functions for tests.
- `tests/check-rvc-s1-review-checklist.js` (T1a to T9).
- A `decisions.md` entry and a Definition of Done.

**What will NOT be built:**
- No CI step, no merge block, no change to any workflow, gate file, skill or source file. No judgement of whether a change satisfies an entry.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1a, T1b on fixture text | unit |
| AC2 | T2 on fixture diff text and fixture checklist | unit |
| AC3 | T3 | unit |
| AC4 | T4 | unit |
| AC5 | T5 with an injected tracked-file lookup | unit |
| AC6 | T6 on the committed `REVIEW.md` and real `git ls-files` | unit (live files) |
| AC7 | T7 | unit |

**Assumptions:** `git ls-files --error-unmatch <path>` answers whether a path is tracked (used in this session to check the six seed sources); `git diff --unified=0` lines begin `+` for added content and `+++ b/<path>` for the file; the sources cited in `REVIEW.md` stay tracked.

`schemaDepends: []`. **Estimated touch points:** Files: 3 plus artefacts. Services: none.

**Exclusion list check (B1/D1):** no test asserts against any workflow, gate file or source file; T6 reads `REVIEW.md` and git only.
