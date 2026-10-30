# Spike Output: parallelization git-commit-collision risk

**Spike:** tfhc-s6
**Parent feature:** 2026-10-30-test-fixture-hardening-continuation
**Discovery artefact:** `artefacts/2026-10-30-test-fixture-hardening-continuation/discovery.md`
**Outcome:** PROCEED (conditional)
**Output date:** 2026-10-30

---

## Uncertainty addressed

> Of the files that exercise `skills.js`'s skill-turn artefact-completion code path, exactly which are still not behind the `stis-s1` D37 adapter, and what is the resulting verdict for `scripts/run-all-tests.js` parallelization?

---

## Options evaluated

| Option | Description | Pros | Cons | Verdict |
|--------|-------------|------|------|---------|
| 1 | PROCEED with parallelization, conditional on first stubbing all 14 remaining-risk files | Small, bounded, mechanical fix using an already-proven pattern (repeated 12 times already); also fixes a separately-logged junk-commit bug | Requires a fast-follow task before parallelization itself can safely land | ✓ Recommended |
| 2 | PROCEED with parallelization immediately, accepting the 14-file collision risk | Fastest path to the parallelization benefit | Ships a known, named, currently-active risk — directly contradicts this epic's own premise of closing silent-divergence/collision risk rather than accepting it | ✗ Ruled out |
| 3 | REDESIGN/DEFER parallelization entirely | No new risk | Ignores that the risk is now precisely bounded and small — the original blocking condition (an unenumerated, vague "64 files" risk) no longer applies | ✗ Ruled out |

---

## Recommendation

PROCEED with `scripts/run-all-tests.js` parallelization, conditional on first stubbing `setSkillTurnGitCommitAdapter` in the 14 precisely-named remaining-risk files (same mechanical pattern already used in the 12 files that already stub it). This fix is valuable independent of parallelization's own scheduling — it also closes the standing "skills.js fires a real git commit during tests" junk-commit-contamination bug already logged in `workspace/learnings.md`, which these 14 files are very likely the exact source of.

---

## Constraints confirmed

| Constraint | Source | Implication |
|------------|--------|-------------|
| The real risk mechanism is `_skillTurnGitCommit`'s default `execSync` implementation, gated by `done && _artefactText` inside `handlePostTurnStreamHtml` — not generic subprocess spawning | Direct read of `src/web-ui/routes/skills.js:1500-1591, 4963, 5523, 5590` | Any future audit of this risk should ground in this specific mechanism, not re-estimate from a generic "spawns a subprocess" heuristic |
| 12 of 41 calling test files already stub the adapter; this count exactly matches the only previously-known figure in this epic's chain | Independent grep sweep, this spike | Validates the investigation method — the same sweep approach can be trusted for the 14-file remaining list |
| 14 of the 29 unstubbed files genuinely drive an artefact-completing turn (confirmed via `ARTEFACT-END` marker presence, spot-checked on one file by full source read) | This spike, Step 3 | These 14, not all 29 raw call-site hits, are the real actionable list |

---

## Discovery fields resolved

| Discovery field | Changed? | Updated value / clarification |
|-----------------|----------|-------------------------------|
| Problem statement | No | Confirmed, now precisely grounded |
| Target users | No | N/A — internal test infrastructure |
| MVP scope | Yes | Parallelization conditionally in-scope; the 14-file adapter-stubbing fix is the natural first half of the unlocked work |
| Out of scope | No | Unchanged — parallelization implementation itself remains a separate follow-on, as already stated |
| Assumptions | Yes | The "64 subprocess-spawning files" framing is superseded by a precise, grounded 14-file list |
| Known risks | Yes | Narrowed from vague to precise; connected to an already-logged, separately-known bug |
| Success criteria | No | "Items 5-6's spikes have a recorded verdict" is satisfied by this output |
| Technical constraints | Yes | See Constraints confirmed table above |

**Discovery re-run needed?**
- [x] No — findings clarify details within the existing framing

---

## Remaining unknowns

Nothing material to this spike's own question. Whether the 14-file fix and/or the parallelization implementation itself land as new stories within this same session or are scheduled for later is an operator scheduling decision.

---

## Decision log reference

Logged in `artefacts/2026-10-30-test-fixture-hardening-continuation/decisions.md` as a SCOPE entry.
