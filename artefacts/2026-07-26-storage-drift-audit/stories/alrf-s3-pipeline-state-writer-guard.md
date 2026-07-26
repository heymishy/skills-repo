# Retrospective Story: pipeline-state-writer refuses to fabricate state on a missing file

**Story ID:** alrf-s3
**Retrospective audit date:** 2026-07-26
**Risk classification:** LOW-RISK FIX FOR A CRITICAL FINDING (the change itself is a small, additive guard with an already-safe call-site fallback; the *bug it closes* was critical)

**Epic reference:** none — found via a comprehensive storage-drift audit requested by the operator after the same-day canvas-render/artefact-listing fixes
**Parent artefact:** `decisions.md` (same directory)

## What was delivered

The storage-drift audit (see `decisions.md`) found that `src/web-ui/adapters/pipeline-state-writer.js` — which fires on every gate-confirm reached through the web UI (discovery complete, DoR signed off, any stage advance) — was silently fabricating a fresh, near-empty `{schemaVersion:'1', features:[]}` state whenever `.github/pipeline-state.json` couldn't be read, then writing *that* back over whatever (if anything) was there. Because `.github/` is excluded from the built Docker image, this was the actual, unconditional behaviour on staging for every gate-confirm: a throwaway file, discarding all real feature/story history, never committed to git, wiped on the next redeploy.

**Fix:** the read failure now throws a clear, descriptive error instead of falling back to an empty state. The call site (`routes/journey.js`, gate-confirm handler) already wraps the writer call in try/catch and already gates chain-hash trace emission on `stateWriteSucceeded` — so the only behavioural change is that a write which previously "succeeded" with corrupted data now correctly reports failure, and trace emission is correctly skipped rather than emitting a false-positive record.

## Benefit Linkage

**Metric moved:** none of csd-e1's metrics directly — this is a governance-integrity fix, closing a path where the platform's own hash-verified pipeline-state record could be silently corrupted by ordinary web-UI use.
**How:** stops a currently-live, high-severity data-integrity issue with a minimal, immediately-shippable change, ahead of the larger unified-store work it's paired with in `decisions.md` D1.

## Acceptance Criteria

**AC1 — writer throws when `.github/pipeline-state.json` does not already exist at repoRoot**
Status: MET — `tests/check-cdg7-gate-advance.js` T-alrf-s3a.

**AC2 — a refused write does not create a bogus file**
Status: MET — T-alrf-s3b (asserts `fs.existsSync` is false after the throw).

**AC3 — the normal path (file already exists) is completely unaffected**
Status: MET — T-alrf-s3c, plus the full pre-existing `check-cdg7-gate-advance.js` (40/40 total including the 3 new cases) and `check-owle6-pipeline-state-auto-write.js` (20/20) suites passing unchanged — none of the existing tests relied on the fabricate-on-missing fallback, since every one of them pre-seeds a real pipeline-state.json fixture before invoking the writer.

**AC4 — the gate-confirm route degrades correctly on a thrown write (no crash, trace emission correctly skipped)**
Status: MET by inspection — `journey.js`'s existing try/catch + `stateWriteSucceeded` gating (predates this change, added under `cdg.5`/ADR-023) already handles this exactly right; verified no new call-site changes were needed.

## Out of Scope

- The other audit findings (`workspace/ideas.json`, `workspace/estimation-norms.md`, artefact content itself) — tracked separately, not fixed by this guard.
- Making pipeline-state writes actually *succeed* on staging (i.e., the real durable-store fix) — this story only stops silent corruption; it does not restore functionality. See `decisions.md` D1.

## Traceability Linkage

**DoR artefact:** not written — retrospective story
**Test plan:** `tests/check-cdg7-gate-advance.js` (3 new cases, T-alrf-s3a/b/c)
**DoD artefact:** not yet written
