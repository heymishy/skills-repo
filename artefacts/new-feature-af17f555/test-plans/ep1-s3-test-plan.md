## Test Plan: Journey Record Backfill from CLI

**Story reference:** artefacts/new-feature-af17f555/stories/ep1-s3.md
**Epic reference:** artefacts/new-feature-af17f555/epics/cross-channel-feature-continuity.md
**Test plan author:** Claude Code (agent-authored, operator-directed)
**Date:** 2026-09-01

---

## Entry Condition Check ✅

- Story artefact exists: `artefacts/new-feature-af17f555/stories/ep1-s3.md` ✅
- Review report shows PASS: `artefacts/new-feature-af17f555/review/ep1-s3-review-1.md` (0 HIGH, 0 MEDIUM, 1 LOW-mitigated) ✅
- Story has 1 AC in Given/When/Then format — below the 3-AC convention minimum. Same mitigation as ep1-s1/ep1-s2: design artefact supplies the detailed backfill mechanism (`design.md` Component 3) this test plan covers. ⚠️

**Proceeding with test plan for ep1-s3.**

---

## Test Environment and Framework

**Confirmed from `package.json` scripts:** `npm test` — Node.js assert-based custom test helper, same as every other story in this feature. No UI-rendering behaviour — journey record creation is a pure server-side data operation. No E2E test required.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup, no real data involved

**Mechanism:**
- Mock `journey-disk.js`'s `_getJourneyByFeatureSlug()` to simulate both "record exists" and "record does not exist" cases
- Mock `pipeline-state.json` fixture features at various `stage` values to exercise `completedStages` inference
- Mock PostHog client and server stdout logger to assert emitted events without a real network call

**Sensitivity:** None — synthetic test data, no real credentials or PII.

**Data Availability:** Ready — no external dependencies; generated in test setup.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap Type | Risk |
|----|---|---|---|---|---|---|---|
| AC1 | Journey record auto-created on first selection of a CLI-progressed feature, idempotently | 5 | 2 | — | — | None | 🟢 |

---

## Unit Tests

### backfillJourney creates a new record when none exists
- **Verifies:** AC1
- **Precondition:** `_getJourneyByFeatureSlug(featureSlug)` returns null
- **Action:** Call `backfillJourney(featureSlug)`
- **Expected result:** A new journey record is written with `journeyId`, `featureSlug`, `createdAt`, `updatedAt`
- **Edge case:** No

### backfillJourney infers completedStages from pipeline-state.json's stage field
- **Verifies:** AC1
- **Precondition:** Fixture feature at `stage: 'definition'`
- **Action:** Call `backfillJourney(featureSlug)`
- **Expected result:** `completedStages` includes `['discovery', 'spike', 'benefit-metric', 'definition']` — every stage up to and including the current one
- **Edge case:** No

### backfillJourney stamps cliAdoptionTimestamp and cliAdoptionArtefactHashes
- **Verifies:** AC1
- **Precondition:** Fixture feature with `discovery.md` and `benefit-metric.md` present on disk
- **Action:** Call `backfillJourney(featureSlug)`
- **Expected result:** `cliAdoptionTimestamp` is set to the current time; `cliAdoptionArtefactHashes` contains a hash entry per resolvable artefact
- **Edge case:** No

### backfillJourney is idempotent — a second call never creates a duplicate
- **Verifies:** AC1
- **Precondition:** A journey record already exists for `featureSlug` (from a prior call or pre-seeded fixture)
- **Action:** Call `backfillJourney(featureSlug)` twice in sequence
- **Expected result:** Only one journey record exists after both calls; the second call is a no-op that returns the existing record
- **Edge case:** Yes — this is the core idempotency guarantee the AC requires

### backfillJourney emits the journey_backfilled_from_cli PostHog event exactly once
- **Verifies:** AC1
- **Precondition:** No existing journey record
- **Action:** Call `backfillJourney(featureSlug)` twice
- **Expected result:** PostHog mock recorded exactly 1 call to `journey_backfilled_from_cli` with `featureSlug`, `stage`, `adoptionTimestamp` fields — not 2
- **Edge case:** Yes

---

## Integration Tests

### Session start triggers backfill exactly once and proceeds with the resulting journey record
- **Verifies:** AC1
- **Components involved:** `registerHtmlSession()`, `backfillJourney`, `journey-disk.js`
- **Precondition:** Fixture feature with no journey record, at `stage: 'review'`
- **Action:** Start a skill session for the feature
- **Expected result:** Journey record is created before `buildSystemPrompt()` runs; session proceeds using the new record's `completedStages`
- **Edge case:** No

### Re-selecting the same CLI-progressed feature across two separate sessions never duplicates
- **Verifies:** AC1
- **Components involved:** `registerHtmlSession()`, `backfillJourney`
- **Precondition:** Fixture feature with no journey record
- **Action:** Start a session, end it, start a second session for the same feature
- **Expected result:** Exactly 1 journey record exists after both sessions; second session's disclosure message still renders correctly using the original `cliAdoptionTimestamp`
- **Edge case:** Yes

---

## NFR Tests

### Backfill is silent and automatic — no operator confirmation gate
- **NFR addressed:** UX / automatic operation
- **Measurement method:** Integration test asserts session start completes without any pending confirmation prompt when a backfill occurs
- **Pass threshold:** Session reaches `buildSystemPrompt()` with zero required operator interactions attributable to backfill
- **Tool:** Node.js assert-based test helper

### Server log and PostHog event both include structured context
- **NFR addressed:** Auditability
- **Measurement method:** Assert the server stdout log line and the PostHog event both contain `featureSlug`, `stage`
- **Pass threshold:** Both present in both channels, every time a backfill occurs
- **Tool:** Node.js assert-based test helper

---

## Out of Scope for This Test Plan

- Artefact content resolution (covered by ep1-s2's own test plan) — this plan covers journey record creation only
- Stage routing decisions based on the backfilled `completedStages` (covered by ep1-s4)
- Conflict resolution if a journey record already exists with different stage markers than pipeline-state.json — explicitly out of scope per the story's own Out of Scope section

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |

---

*Written 2026-09-01 as part of getting the whole `new-feature-af17f555` feature to DoR-ready level.*
