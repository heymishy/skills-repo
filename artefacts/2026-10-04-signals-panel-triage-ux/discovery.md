# Discovery: Signals Panel Triage UX

**Status:** Approved
**Created:** 2026-10-04
**Approved by:** Hamish King — 2026-10-04
**Author:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)

---

## Problem Statement

Operators triaging improvement signals via the `/signals` web UI page cannot efficiently find or act on specific signals once volume grows past a trivial scale (currently 4,688–5,324 real signals across this repo's own two live environments — local dev and `wuce-staging`). Three concrete failure modes, confirmed by direct use of the real, shipped feature:

1. **Parse-error noise is interleaved with real signals at equal visual weight.** On real `wuce-staging`, the first page observed was dominated by consecutive `parse-error` entries (file-read failures like `ENOENT`/`EISDIR`) before a single actionable signal appeared.
2. **There is no way to sort, filter, or search.** Only linear Previous/Next navigation through roughly 94–107 pages (at 50 signals/page), in a fixed, non-chronological order determined entirely by `getSignals()`'s own internal aggregation order.
3. **There is no way to dismiss or mark a signal as reviewed.** The list only grows — every previously-handled signal keeps resurfacing on every future visit, with no mechanism to reduce it over time.

The cost: an operator either gives up triaging signals at all — defeating the purpose of the self-improvement loop that `ep2-s1`/`ep2-s2`/`ep2-s3` just built and shipped — or spends disproportionate time paging through noise to find anything actionable.

## Who It Affects

**Primary: Solo operator (you, today)** — the same persona every story in the parent feature (`2026-09-28-weeb-ui-learnings-and-improvements`) targets. Encounters this every time they open `/signals` intending to actually process signals into `/improve` runs, not just confirm the page renders.

**Secondary (forward-looking): Tech lead / squad lead** — per `product/mission.md`'s own persona list, as this repo scales toward the product mission's multi-user/multi-tenant vision, anyone accountable for a squad's own delivery quality becomes a second affected persona — someone who'd want to triage that squad's own signals without wading through unrelated noise.

## Why Now

The `signal-seeding-improve-loop-closure` epic (`ep2-s1`/`ep2-s2`/`ep2-s3`, just shipped and DoD-complete as of this session) explicitly deferred sorting/filtering/dismissal to "Phase 5 UX enhancements" as a deliberate walking-skeleton scope decision — that deferral is now the active blocker. The feature it enables (self-improvement loop accessibility, Metric 3) is only valuable if an operator can actually act on what they see; right now the loop closes mechanically but is impractical to use at this repo's own real, accumulated scale. This is also a direct, first-hand finding: validating `ep2-s3` on real `wuce-staging` just surfaced the UX gap concretely, not a hypothetical raised in the abstract.

## MVP Scope

The smallest validate-worthy slice addresses all 3 failure modes without full-blown saved views or bulk actions:

1. **Type/source filter** — operator can show/hide signals by type (e.g. hide all `parse-error`) and by source (`capture-log`, `decisions`, `pipeline-state`, etc.), solving the noise-dominance problem directly.
2. **Recency sort** — newest-first as a selectable sort order (current insertion order remains the default; recency becomes an explicit option), so an operator can find "what happened lately" without paging deep into the list.
3. **Dismiss / mark-reviewed** — a per-signal action that removes it from the default view (reversible, not permanent deletion — a "show dismissed" toggle remains available), so the list stops re-surfacing what's already been handled. Keyed by a stable derived hash (`source`+`type`+`text`), not `ep1-s1`'s own volatile `signal.id`; persisted in a new `workspace/dismissed-signals.json` file (resolved via `/clarify`, see Clarification log).

**First-use bar:** an operator can filter out `parse-error` noise, sort by recency, and dismiss 10 real signals in under 2 minutes, without reading source code to figure out how.

## Out of Scope

- **Bulk actions** (select-multiple-and-dismiss/filter together) — ship per-signal actions first; bulk is a natural follow-up once real usage patterns are known.
- **Saved views / custom filter presets** — remembering a named combination of filters+sort; defer until real usage shows which combinations people actually want.
- **Full-text search** — type/source filtering covers the main "too much noise" problem; free-text search across signal content is a bigger, separate feature.
- **Multi-tenant / multi-operator dismiss-state isolation** — this repo is still solo-operator; dismiss state can be simple (not per-user) for now.
- **Changing `/improve`'s own downstream execution** — stays out of scope, consistent with the parent epic's own boundary (`discovery.md`'s own MVP scope for that feature never included this).

## Assumptions and Risks

**Resolved via `/clarify` (2026-10-04) — see Clarification log below:**

- **Dismiss-state keying:** `ep1-s1`'s own `signal.id` generation is non-deterministic for `parse-error` signals (confirmed directly this session — uses `Math.random()` plus a fresh `new Date().toISOString()` per request, documented in `ep1-s2-dod.md`'s own AC5 deviation). Resolved: dismiss by a derived stable key (e.g. a hash of `source` + `type` + `text`), computed at dismiss-time and filter-time, without touching `ep1-s1`'s own volatile `id` field or requiring any upstream change.
- **Dismiss-state persistence:** resolved — a new dedicated file, `workspace/dismissed-signals.json`, matching this repo's own existing file-based governance-artefact convention (`capture-log.md`, `decisions.md`, etc.), not a database and not appended to an existing unrelated file.
- **Unmeasured-usage risk:** resolved — accepted as a reasonable, low-cost bet. The MVP is small (filter/sort/dismiss on an existing page, no new infrastructure beyond one small JSON file), so a separate validation step before building is not warranted.

No open `[ASSUMPTION]` items remain after clarification.

## Directional Success Indicators

**Time-to-triage:** Baseline `[UNKNOWN BASELINE]` — no operator has run a timed real triage session yet. Target: an operator can filter out noise, sort by recency, and dismiss 10 real signals in under 2 minutes. Measured via: a manual operator-timed run, or an E2E test timing the full UI interaction sequence.

**Page-1 signal-to-noise ratio:** Baseline `[UNKNOWN BASELINE]` — observed qualitatively (parse-error entries dominated the visible top of page 1 on real `wuce-staging`) but not precisely counted at discovery time. Target: an operator can reduce visible parse-error noise to zero with one filter action. Measured via: a real filter-applied DOM count on staging/local, before and after.

**Dismiss retention:** Baseline: 0% — no dismiss mechanism exists today, every signal resurfaces on every visit. Target: 100% of dismissed signals stay dismissed across page reloads and new sessions. Measured via: a dedicated automated test (dismiss a signal, reload, confirm it does not reappear).

## Constraints

- **No new npm runtime dependency** — matches every story in the parent feature's own `discovery.md`.
- **Design system / accessibility:** per `product/constraints.md` constraint #9, WCAG 2.1 AA is a hard floor, not a performance NFR — filter/sort/dismiss controls must be fully keyboard-accessible, matching `ep2-s1`/`ep2-s3`'s own established pattern (real Playwright Tab-order E2E coverage).
- **No database** — this repo's own architecture is file-based with no persistent DB; dismiss-state persistence must work within that constraint (directly tied to the `[ASSUMPTION]` above).
- **Solo-operator scope** — no multi-tenant auth/isolation model exists yet to build dismiss-state ownership against.

## Contributors

- Hamish King — Operator / Product Owner

## Reviewers

- [Name — Role]

## Approved By

Hamish King — Operator / Product Owner — 2026-10-04

---

**EA registry check (architecture.ea_registry_authoritative: true):** This feature extends an existing internal web UI route (`/signals`, part of the same system every other story in the parent feature touches) — no new external system integration. No EA registry blast-radius lookup tool is available in this session; proceeding without blast-radius data per the skill's own graceful-fallback path. This does not block discovery.

---

## Clarification log

[2026-10-04] Clarified via /clarify:
- Q: How should dismissed-signal state be keyed, given `ep1-s1`'s own `signal.id` is non-deterministic for `parse-error` signals?  A: Dismiss by a derived stable key (hash of `source`+`type`+`text`), computed at dismiss-time and filter-time, without touching `ep1-s1`'s own volatile `id` field — no upstream change needed.
- Q: Where should dismissed-signal state actually live on disk, given this repo has no database?  A: A new dedicated file, `workspace/dismissed-signals.json`, matching this repo's own existing file-based governance-artefact convention.
- Q: How should the unmeasured-usage assumption be treated?  A: Accepted as a reasonable, low-cost bet — the MVP is small enough (one existing page, one small new JSON file) that a separate validation step isn't warranted.

---

**Next step:** Human review and approval → /benefit-metric
