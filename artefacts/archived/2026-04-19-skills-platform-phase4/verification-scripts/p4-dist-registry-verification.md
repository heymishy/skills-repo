# Verification Script: p4-dist-registry

**Story:** Consumer registry and fleet visibility via fleet-state.json
**Operator scenarios:** Run after implementation to confirm AC coverage.

---

## Scenario 1 — Consumer entry created with all fields (AC1)

**Setup:** Consumer has completed `skills-repo init`. Run the registry update command.
**Run:** `node scripts/update-fleet-registry.js --consumer heymishy/sample-repo`
**Expected:** `fleet-state.json` contains an entry for `heymishy/sample-repo` with all five required fields: `consumerSlug`, `lockfileVersion`, `upstreamSource`, `lastSyncDate` (ISO 8601), `syncStatus`.

---

## Scenario 2 — Stale consumer detected (AC2)

**Setup:** Consumer entry has `lockfileVersion` 2 releases behind current upstream head. `distribution.fleet.stale_threshold` set to 2 in context.yml.
**Run:** Registry update or check command.
**Expected:** Entry has `syncStatus: "stale"` and `versionsBehind: 2`.

---

## Scenario 3 — Governance check validates all entries (AC3)

**Setup:** Manually add a malformed entry to `fleet-state.json` (missing `upstreamSource`).
**Run:** `npm test`
**Expected:** Governance check exits non-zero, naming the consumer slug and the missing `upstreamSource` field.

---

## Scenario 4 — Default stale threshold (AC4)

**Setup:** Remove `distribution.fleet.stale_threshold` from context.yml.
**Run:** Compute sync status for a consumer 1 release behind and one 2 releases behind.
**Expected:** 1-behind → `syncStatus: "clean"`. 2-behind → `syncStatus: "stale"`.

---

## Scenario 5 — NFR: No personal data

**Run:** `node -e "const fs = require('fleet-state.json'); const e = fs.consumers[0]; console.log(Object.keys(e));"`
**Expected:** Keys include only `consumerSlug`, `lockfileVersion`, `upstreamSource`, `lastSyncDate`, `syncStatus` (and optionally `versionsBehind`). No `name`, `email`, `userId` fields.
