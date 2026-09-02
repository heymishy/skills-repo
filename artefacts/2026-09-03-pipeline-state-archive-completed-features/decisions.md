# Decision Log: pipeline-state-archive-completed-features

**Feature:** Archive Completed Features Out of pipeline-state.json
**Discovery reference:** artefacts/2026-09-03-pipeline-state-archive-completed-features/discovery.md
**Last updated:** 2026-09-03

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
**2026-09-03 | ARCH | /clarify**
**Decision:** The archive-eligibility rule is keep-N (N=30 most-recently-completed features), not a time-based threshold.
**Alternatives considered:** A time-based threshold (30 or 90 days since `updatedAt`) — the original discovery draft's default proposal. Rejected because it behaves unpredictably across fast- vs. slow-moving delivery periods: a quiet quarter leaves the live file large regardless of age; a delivery burst archives a large batch at once regardless of whether that work is still being actively referenced.
**Rationale:** Investigated the current data directly: 181 of 237 features (76%) are already fully DoD-complete. Keeping the 30 most recent and archiving the remaining 151 brings the live file from 1.34MB down to roughly ~490KB — directly hitting this discovery's own ~500KB success-indicator target. A keep-N rule bounds live file *size* directly and predictably; a time threshold only bounds it indirectly.
**Made by:** Hamish King (Platform Owner) — confirmed via /clarify AskUserQuestion, 2026-09-03.
**Revisit trigger:** If the platform's delivery rate changes materially (much faster or slower feature-completion cadence), N=30 may need to be re-tuned — re-run the same live-file-size calculation this decision was based on and adjust N to hit the same ~500KB target.
---

**2026-09-03 | ASSUMPTION | /clarify**
**Decision:** `dashboards/pipeline-adapter.js` must be updated to also read the archive store as part of this story's own MVP scope — this is now a confirmed requirement, not an open assumption.
**Alternatives considered:** Leaving dashboard updates for a later, separate story (deferring the read-path fix past the initial archive-writer implementation). Rejected because shipping the archive writer alone would immediately and silently break the dashboard's own "done" card rendering for every archived feature — an unacceptable regression to ship even temporarily, not a deferrable nice-to-have.
**Rationale:** The original discovery draft carried this as an open `[ASSUMPTION]` ("no existing skill or CI script currently assumes `features[]` contains 100% of all-time delivered work"). Code investigation during /clarify confirmed it directly: `dashboards/pipeline-adapter.js`'s own `transform(state)` function maps every entry in `state.features` into a visualiser "CYCLE" card and explicitly renders a `'done'` state for `dodStatus === 'complete'` features (line ~124). This dashboard's own governance/history view depends on completed features staying live today — confirmed via direct code reading, not inference.
**Made by:** Claude Code (agent) — code investigation, confirmed with Hamish King (Platform Owner) via the /clarify session, 2026-09-03.
**Revisit trigger:** None expected — this is a confirmed technical fact about existing code, not a judgment call likely to change. Would only be revisited if `pipeline-adapter.js` itself is rewritten to no longer render historical "done" cards for its own separate reasons.
---

---

## Architecture Decision Records

<!-- None yet — the two decisions above are lightweight log entries, not structural enough to warrant a full ADR at this stage. Revisit if the eventual /definition reveals the archive-store shape itself (index file vs. per-quarter files vs. something else) needs a full ADR. -->
