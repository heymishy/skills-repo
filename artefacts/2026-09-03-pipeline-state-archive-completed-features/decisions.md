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

**2026-09-03 | ARCH | /clarify**
**Decision:** This story explicitly supersedes and replaces `scripts/archive-completed-features.js` (the existing, previously-working archive mechanism) rather than building a new one alongside it. The existing archive file location, top-level `archive` pointer convention, and JSON shape are preserved unchanged; only the eligibility rule changes (stage+health → keep-N=30). The 21 features already archived by the old mechanism on 2026-05-13 require no migration.
**Alternatives considered:** Building a fresh archive mechanism with a new file format/location, ignoring the old one entirely. Rejected once a fork-agent audit (dispatched during /clarify) found the old mechanism already exists, already ran successfully once, and already has downstream tooling reading its exact file shape — building something new would have duplicated working code and orphaned the 21 already-archived features in an old, now-inconsistent format.
**Rationale:** Minimizes surface area of the change (same file, same pointer, same shape — only the writer's eligibility logic changes) and reuses proven-correct behaviour (the old script's copy-then-verify-then-remove sequence and idempotency handling are sound; only its *trigger* and *eligibility rule* were ever the problem).
**Made by:** Hamish King (Platform Owner) — confirmed via /clarify AskUserQuestion ("Replace with keep-N design"), 2026-09-03.
**Revisit trigger:** If a future initiative decides the archive file itself needs a structural change (e.g. splitting into dated/quarterly files, per this story's own deferred Out of Scope item), this decision's "preserve the existing shape" premise would need revisiting at that time.
---

**2026-09-03 | ARCH | /clarify**
**Decision:** Bring an automated enforcement mechanism (scheduled GitHub Actions workflow + a CI gate backstop) into this story's own MVP scope, rather than leaving archiving as a manual/periodic process as originally drafted.
**Alternatives considered:** A manual or periodically-run trigger (the original discovery draft's own MVP proposal) — explicitly rejected by the operator specifically because the prior archive mechanism failed this exact way: it was manual, ran once, and was silently forgotten for ~4 months with no one noticing until this discovery's own investigation surfaced it.
**Rationale:** Operator instruction, directly grounded in the just-confirmed root cause of the prior mechanism's abandonment (purely manual trigger, no enforcement). A scheduled job removes the "someone has to remember" failure mode; the CI gate is a backstop in case the scheduled job itself silently stops working (exactly what would have caught the original mechanism's own dormancy months earlier).
**Made by:** Hamish King (Platform Owner), 2026-09-03.
**Revisit trigger:** If the cron cadence (weekly, still to be confirmed — see the open `[ASSUMPTION]` in discovery.md) proves too aggressive or too lax once real usage data exists post-launch.
---

**2026-09-03 | SCOPE | /clarify**
**Decision:** Fully deprecate `dashboards/pipeline-viz.html` as part of this story's own scope — remove the HTML file, its three dedicated pre-commit/CI scripts (`check-viz-syntax.js`, `check-viz-behaviour.js`, `check-governance-sync.js`, plus the `viz-functions.js` module they test), and its references in `pages.yml`/`copilot-setup-steps.yml`.
**Alternatives considered:** Keeping `pipeline-viz.html` alive and updating its own `mergeArchivedState()` function to the (unchanged) archive format — the original plan, before this decision, since that function already worked correctly. Rejected because the page itself has had zero real usage for ~5 months; maintaining archive-format compatibility for a page nobody opens is waste, not safety.
**Rationale:** Operator instruction, based on real usage data (not available to the agent via code inspection alone — this is a product-usage fact, not a technical one): `pipeline-viz.html` has been fully superseded by the real product's own web UI (`src/web-ui/`, the multi-tenant `wuce` application this repo's own `skills-framework` product is dogfooded through) — genuinely replaced, not merely neglected. Confirmed via code investigation that deprecation is non-trivial (3 CI scripts run on every commit today, plus 2 workflow references) but bounded and fully enumerable. Scoped narrowly to `pipeline-viz.html` specifically — `dashboards/index.html`/`dashboards/pipeline.html` (served by `pipeline-adapter.js`) have not been named as superseded and remain in scope for the separate archive-awareness fix.
**Made by:** Hamish King (Platform Owner), 2026-09-03.
**Revisit trigger:** If `check-governance-sync.js`'s own validation purpose (keeping `governance-gates.yml` and a `DEFAULT_GOVERNANCE_GATES` constant in sync) turns out to still be needed independent of `pipeline-viz.html` — in which case that validation should be relocated, not deleted outright. Flagged as an open /definition-time judgment call in discovery.md, not resolved by this decision.
---

---

## Architecture Decision Records

<!-- None yet — the two decisions above are lightweight log entries, not structural enough to warrant a full ADR at this stage. Revisit if the eventual /definition reveals the archive-store shape itself (index file vs. per-quarter files vs. something else) needs a full ADR. -->
