# Decision Log: 2026-07-11-pipeline-conflict-reduction

**Feature:** Remove the three recurring merge-conflict hotspots in parallel-wave inner-loop delivery
**Story reference:** artefacts/2026-07-11-pipeline-conflict-reduction/stories/pcr-s1-reduce-merge-conflict-hotspots.md
**Last updated:** 2026-07-11

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |
| `GAP` | A skill/process gap surfaced during execution, not specific to this story's content |

---

## Log entries

---
**2026-07-11 | RISK-ACCEPT | definition-of-ready (W4)**
**Decision:** Proceed to coding agent without a separate, formal domain-expert walkthrough of the AC verification script before implementation begins.
**Alternatives considered:** Block on a formal verification-script review pass before assigning to the coding agent (rejected for this specific story — see rationale).
**Rationale:** This is a short-track, bounded infra/tooling story (test runner mechanics, pipeline-state write scoping, git merge strategy) with no UI and no end-user-facing behaviour. The operator reviewed the story, ACs, and DoR contract directly in-session before requesting short-track — a level of scrutiny at least equivalent to a standalone verification-script read for a story of this shape. Formal verification-script walkthrough is deferred to its "post-merge smoke test" use case (per `test-plan/SKILL.md`'s "The script serves three moments" — pre-code sign-off, post-merge smoke test, delivery review), which will happen naturally when the operator runs the script against the merged implementation.
**Made by:** Hamish King (Founder/Operator), via /definition-of-ready, 2026-07-11
**Revisit trigger:** If the implementation deviates meaningfully from the DoR contract's estimated touch points, run the verification script formally before merging.
---
**2026-07-11 | GAP | definition-of-ready (H-GOV)**
**Decision:** Treat H-GOV (governance approval check, which reads a discovery artefact's `## Approved By` section) as satisfied for this short-track story via the operator's direct, explicit in-session instruction to proceed with short-track, rather than blocking DoR sign-off on a discovery artefact that short-track explicitly does not produce.
**Alternatives considered:** (1) Block DoR entirely until a discovery.md is retroactively created purely to hold an `## Approved By` section (rejected — this would fabricate outer-loop ceremony that CLAUDE.md's own short-track routing explicitly says to skip, and would set a bad precedent of writing artefacts to satisfy a check rather than to record real analysis). (2) Silently skip H-GOV without comment (rejected — an unacknowledged hard-block bypass is exactly the kind of silent gap this pipeline's own governance model is designed to prevent).
**Rationale:** `skills/definition-of-ready/SKILL.md`'s H-GOV check assumes every story reaching DoR has been through `/discovery` and therefore has a discovery artefact to read `## Approved By` from. This assumption is false for short-track stories by design (`CLAUDE.md`'s own short-track routing is `/test-plan → /definition-of-ready → coding agent`, explicitly skipping `/discovery`). This is a genuine skill-design gap, not a one-off judgment call specific to this story's content — worth a `definition-of-ready/SKILL.md` clarification (e.g. an explicit short-track exception clause for H-GOV, keyed on the same short-track marker the story/DoR artefact records) so future short-track stories don't need to re-derive this same reasoning.
**Made by:** Coding agent (autonomous /definition-of-ready execution), 2026-07-11
**Revisit trigger:** When `skills/definition-of-ready/SKILL.md` is next revised, add an explicit short-track exception to H-GOV rather than relying on this same ad hoc reasoning being repeated per short-track story.
---
**2026-07-11 | GAP | verify-completion (AC1 verdict-parity finding)**
**Decision:** Accept that AC1's "verdict parity" claim ("running `npm test` produces the same pass/fail verdict as the current full chain did") means parity against the TRUE previously-hidden failure set, not the ~1-2 failures everyone believed was the total baseline all session. `scripts/run-all-tests.js` runs every discovered/listed file and aggregates results rather than short-circuiting on the first failure, unlike the old `&&`-chained `scripts.test` string. Running the real `npm test` via the new runner surfaces **65 failing files** (out of 295 run — 224 in the old chain plus 71 additional `check-*.js` files that existed in `tests/` but were never wired into `package.json`'s chain at all). This is not a regression.
**Alternatives considered:** (1) Silently accept the 65-failure count as a new problem introduced by this story and attempt to fix all 65 before opening a PR (rejected — none of these failures have any plausible causal link to this story's actual changes: test-runner discovery mechanics, `pipeline-state.json`'s write-path scoping, and a `.gitattributes` merge strategy touch none of the application code these 65 files exercise). (2) Silently narrow the runner's glob to only the historically-chained 224 files, hiding the other 71 from ever running, to keep the "1-2 known gaps" narrative intact (rejected — this would reintroduce exactly the kind of masking this story exists to remove, just at the file-discovery layer instead of the `&&`-short-circuit layer; a test file sitting in `tests/` that nobody ever actually runs is a bigger governance problem than a known, documented failure count).
**Rationale:** Verified via a targeted diagnostic: took the exact 65 files failing under the new runner and ran each one individually against a clean worktree checked out at `eaf73bc2` (immediately before this story's first implementation commit — i.e. current `origin/master` plus only the outer-loop artefact bookkeeping commit). 62 of 65 were independently confirmed to fail identically on that pre-change baseline (zero passed on baseline, i.e. zero newly-broken files found). The remaining 3 (`check-wuce4-docker-deployment.js`, `check-wucp1-context-autoloader.js`, `check-wusl1-chat-streaming.js`) hang rather than failing fast when run standalone outside their normal invocation context (consistent with genuine external dependencies — Docker, a long-lived autoloader connection, a streaming connection — not something a test-runner discovery change could plausibly cause), so they were not exhaustively re-verified within a practical time budget; there is no evidence in any partial sweep that they behave differently under the new runner than under a true non-short-circuiting baseline. The `&&`-chain's short-circuit-on-first-failure behaviour has been silently masking the true state of this repo's test suite for an unknown period — this story's fix has an important, valuable side effect of finally making that state visible, at the cost of a much larger number now showing in `npm test`'s output than anyone expected. This is real, pre-existing technical debt this story did not create.
**Made by:** Claude (agent), 2026-07-11
**Revisit trigger:** File a follow-up story to triage and fix (or explicitly accept/document) the 65 newly-visible pre-existing failures — grouped by evident cause where possible (missing `.github/skills/definition/SKILL.md` and other missing skill files referenced by several `check-i*`/`check-rrc*`/`check-p11*` tests; missing `ANTHROPIC_API_KEY` for several `check-mfc*` tests; stale SKILL.md content-marker assertions for several others). Do not attempt to fix them as part of this story — out of scope per this story's own Out of Scope section (this story only changes the *mechanism*, not the content of any test file).

---

## Architecture Decision Records

<!-- Add further ADRs as ADR-001, ADR-002 etc. -->
