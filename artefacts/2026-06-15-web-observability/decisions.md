# Decision Log: 2026-06-15-web-observability

<!--
  PURPOSE: Records the reasoning behind human judgment calls made during the pipeline.

  Artefacts record WHAT was decided.
  This log records WHY, by WHOM, and what was considered and rejected.

  This is the document you read six months later when someone asks:
  "Why did we do it this way?" or "Who agreed to skip that?"

  Written to by: pipeline skills (at decision points) and humans (during implementation).
  Read by: retrospectives, audits, onboarding, future work on this feature.

  To evolve this format: update templates/decision-log.md and open a PR.
-->

**Feature:** Web server observability (structured logging + correlation IDs)
**Discovery reference:** artefacts/2026-06-15-web-observability/discovery.md
**Last updated:** 2026-06-16

---

## Decision categories

| Code | Meaning |
|------|---------|
| `SCOPE` | MVP scope added, removed, or deferred |
| `SLICE` | Decomposition and sequencing choices |
| `ARCH` | Architecture or significant technical design (full ADR if complex) |
| `DESIGN` | UX, product, or lightweight technical design choices |
| `ASSUMPTION` | Assumption validated, invalidated, or overridden |
| `RISK-ACCEPT` | Known gap or finding accepted rather than resolved |

---

## Log entries

---
**2026-06-16 | SCOPE | implementation | RETROSPECTIVE**
**Decision made approximately:** 2026-06-16, during obs-1 implementation
**Decision:** Fixed a kanban/feature-list bug (List/Board view toggle + title/health not propagating from pipeline state) on the obs-1 branch instead of opening a separate story, since it was a small, pre-existing UI defect found while testing obs-1's effects on the web UI.
**Alternatives considered:** Open a separate story/branch for the kanban fix; leave the bug unfixed and note it as a follow-up.
**Rationale:** The fix was small (2 files, ~17 lines), unrelated to pino logging but discovered in the same session while exercising the UI, and blocking on a separate branch/PR cycle for a 2-line propagation bug wasn't proportionate.
**Made by:** Hamish King (directed the session) + Claude Sonnet 4.6 (implemented)
**Revisit trigger:** If scope-creep commits like this recur often enough that they should instead go through a lightweight "drive-by fix" process of their own.
---
**2026-06-16 | SCOPE | implementation | RETROSPECTIVE**
**Decision made approximately:** 2026-06-16, during obs-1 implementation
**Decision:** Added a local-first pipeline-state read (`setFetchPipelineState` reads `.github/pipeline-state.json` from disk before falling back to the GitHub API) on the obs-1 branch, rather than as its own story, to fix the kanban being blind to in-flight local branch work.
**Alternatives considered:** Option B — migrate pipeline-state storage to SQLite as the long-term store (deferred as a future story, not pursued now); doing nothing and continuing to read GitHub master only (rejected — most features in flight are unmerged, so this made the kanban systematically stale for local development).
**Rationale:** Reading from GitHub master on every request meant local branch changes were invisible until merge and added a network round-trip per page load. The local-first fallback is a same-afternoon fix with no schema change; SQLite is the right long-term answer but is a larger, separate piece of work better scoped as its own story once commercial build picks up.
**Made by:** Hamish King (chose Option A over Option B) + Claude Sonnet 4.6 (implemented)
**Revisit trigger:** If/when pipeline-state storage moves to SQLite (Option B), this local-first JSON-file fallback should be revisited/removed.
---
**2026-06-16 | RISK-ACCEPT | definition-of-done**
**Decision:** Accept NFR-PERF-1 (pino must not add >5ms to SSE stream open time) as unverified at obs-1 sign-off — the manual curl/browser timing comparison called for in the test plan was not run, since no live server session was available during this work.
**Alternatives considered:** Pause DoD sign-off until a manual timing check is run; mark the NFR not-applicable and drop it from tracking.
**Rationale:** pino's default synchronous transport is well under 5ms for single log events in practice and the implementation adds only one `child()` call plus a handful of `.info()`/`.error()` calls per turn — but this is not measured evidence, so the gap is recorded honestly rather than asserted as met.
**Made by:** Hamish King (chose to accept and log rather than block sign-off)
**Revisit trigger:** If a real latency complaint surfaces in production, or before any future story adds further per-turn logging volume to this same path.
---

---

## Architecture Decision Records

<!--
  For decisions that warrant more depth than a log entry — significant technical
  choices with long-term implications, irreversible or hard-to-reverse decisions,
  choices that affect multiple stories or the wider codebase.

  Use ADR format below. For lightweight decisions, a log entry above is sufficient.
  Rule of thumb: if a future engineer would want to understand the full context
  of why this choice was made, write an ADR.
-->

<!-- No ADRs recorded yet for this feature. -->

---
