# AC Verification Script: Persist the two seeded deferred-item records

**Story:** artefacts/2026-11-12-ddft-seed-records-fix/stories/dsrf-s1-persist-seeded-deferred-item-records.md
**Date:** 2026-11-12
**Time to run:** under 5 minutes, no browser or server needed.

## Setup

Open a terminal in the repo root. The tests use this repo's configured runner, `node scripts/run-all-tests.js`, which finds every `tests/check-*.js` file. To run only this story's check:

```
node tests/check-dsrf-s1-seeded-records.js
```

## Scenario 1 — the data file exists and is committed (AC1)

1. Run `git ls-files workspace/incidents.json`.
2. You should see the line `workspace/incidents.json`. If nothing prints, the file exists only on your machine, which is the original defect.
3. Open the file. It should start with `[` and end with `]`, and hold two entries.

## Scenario 2 — the unfixed tfhc-s1 failure is recorded (AC2)

1. In `workspace/incidents.json`, find the entry whose `linkedStory` is `tfhc-s1`.
2. Check it says `"type": "deferred-item"` and `"source": "risk-accept"`.
3. Check its `summary` describes the real failure: check C3 in `scripts/check-pipeline-state-integrity.js` reports that `testPlan.passing` (4) is less than `testPlan.totalTests` (5) for a merged story.
4. Check `revisitCondition` says what would have to change to act on it. It must not be blank.
5. There should be exactly one such entry.

## Scenario 3 — the C1-versus-Option-C contradiction is recorded (AC3)

1. Find the entry whose `source` is `backlog-thread`.
2. Its `summary` should name the conflict between constraint C1 in `.github/architecture-guardrails.md` and Option C in `skills/bootstrap/SKILL.md`.
3. Its `revisitCondition` should read "deferred to a broader `product/` refresh later".
4. There should be exactly one such entry.

## Scenario 4 — the check can really fail (AC4)

1. Temporarily rename the file: `Rename-Item workspace/incidents.json incidents.bak`.
2. Run `node tests/check-dsrf-s1-seeded-records.js`. It should print failures and exit non-zero.
3. Rename it back: `Rename-Item workspace/incidents.bak incidents.json`.
4. Run the check again. It should now pass, and `git status` should show no change to the file.

## Scenario 5 — loaders and incident separation (AC5)

1. Run `node -e "const s=require('./scripts/lib/incident-store');const r=s.loadRecords('workspace/incidents.json');console.log(r.length, r.map(x=>x.type).join())"`.
2. Expect `2 deferred-item,deferred-item`. No `incident` appears.

## Reset

Scenario 4 is the only one that changes anything. Confirm `git status` shows `workspace/incidents.json` as unmodified before finishing.
