# Definition of Done: Increase persist timeout to close suspend race

**PR:** https://github.com/heymishy/skills-repo/pull/789 | **Merged:** 2026-08-29 (`0b506483254d8af4bfb1e1f29259349a5acbd917`)
**Story:** artefacts/2026-08-30-csrf-persist-timeout-race/stories/cptr-s1-increase-persist-timeout-to-close-suspend-race.md
**Test plan:** artefacts/2026-08-30-csrf-persist-timeout-race/test-plans/cptr-s1-test-plan.md
**DoR artefact:** artefacts/2026-08-30-csrf-persist-timeout-race/dor/cptr-s1-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-30

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `_PERSIST_TIMEOUT_MS` raised from `500` to `8000` in `src/web-ui/middleware/session.js`, with comment explaining it is now a last-resort circuit breaker given Fly's `'suspend'` sends no signal | Source inspection, re-confirmed against merged `master` | None |
| AC2 (new) | ✅ | `cptr-s1 AC1: a 2000ms write (slower than the old 500ms cap) resolves via the real write, not a timeout` — passing | `tests/check-cpr-s1-csrf-persist-race.js` | None |
| AC3 (regression) | ✅ | Existing `AC4b` hanging-write test's bound updated `< 2000` → `< 9000`, a declared, necessary consequence of the new constant; still passes | Same file, re-run | Bound value changed, property (must not hang forever) unchanged — declared in the story itself |

---

## Scope Deviations

**Design correction before implementation (not a deviation from the merged story — the story itself reflects the corrected design):** The originally-approved approach (a SIGTERM graceful-shutdown handler) was invalidated before any code was written, once Fly's actual `auto_stop_machines = 'suspend'` semantics were confirmed via `WebFetch` (suspend freezes the VM via a Firecracker snapshot with no signal sent to the guest process — a SIGTERM handler would never fire). The story and DoR reflect the corrected "raise the timeout" design only; see `decisions.md` for both the superseded and superseding ARCH entries.

---

## Test Plan Coverage

**Tests from plan implemented:** All planned tests present in `tests/check-cpr-s1-csrf-persist-race.js`, extended with the new AC1 case and the updated AC4b bound.
**Tests passing in CI:** Full file passing (6/6 at merge time, confirmed again during `sccf-s1`'s own full-suite run: 571/571 unrelated files unaffected).

**Gaps (tests not implemented):** None declared.

**Layout gap audit:** N/A.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Durability under Fly suspend | ✅ | New timeout (8000ms) generously exceeds realistic p99 Redis write latency while remaining bounded; response now genuinely waits for the real write in the overwhelming majority of cases |
| No indefinite hang on a genuinely broken Redis | ✅ | AC4b (hanging-write case) still resolves within the new bound |

---

## Metric Signal

No formal benefit-metric artefact — short-track. This fix addressed a real, confirmed session-persist timing race under Fly's suspend/resume cycle. **Important finding from subsequent live validation (`jgcc-s1`, `sccf-s1`):** this fix, while real and worth keeping, was NOT the cause of the user's originally-reported production bug — a live reproduction with zero idle time (ruling out any suspend/timing mechanism) still reproduced the failure, which was later found to be two separate missing-`_csrf`-field gaps (`jgcc-s1`, `sccf-s1`). This is an important, explicitly-tracked distinction: `cptr-s1` closes a real hardening gap but does not itself explain the user-facing incident that prompted this investigation.

---

## Outcome

**COMPLETE**

**Follow-up actions:** None required for this story specifically. The broader investigation it kicked off continued through `jgcc-s1`, `csdl-s1`, and `sccf-s1` — see those stories' own DoD artefacts for the actual root-cause resolution.

---

## DoD Observations

1. **A fix found via correct evidence-gathering (Fly's own docs) before writing code, self-corrected mid-flight rather than after shipping a no-op fix** — the SIGTERM design was walked back and replaced before any implementation, avoiding a wasted deploy-and-discover cycle. Worth citing as the positive counter-example to this same investigation's later pattern of designing fixes without first gathering evidence (see `jgcc-s1`'s own DoD observations).
2. **A necessary-but-insufficient fix should be labeled as such explicitly**, not left ambiguous for a future reader to assume it "was the fix." This DoD's own Metric Signal section states plainly that `cptr-s1` did not resolve the user's reported bug, to prevent exactly that misreading.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Increase persist timeout to close suspend race (cptr-s1).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Is the mid-flight design correction (SIGTERM -> raise timeout) clearly attributed to real evidence, not left implicit?
3. Does the Metric Signal section correctly and explicitly state that this fix did NOT resolve the user's originally-reported bug, given that jgcc-s1/sccf-s1 later found the real cause?
4. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
