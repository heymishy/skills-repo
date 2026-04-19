# Verification Script: p4-dist-lockfile

**Story:** Lockfile structure, pinning, and transparency
**Operator scenarios:** Run after implementation to confirm AC coverage.

---

## Scenario 1 — Lockfile fields present (AC1)

**Setup:** After successful `skills-repo init`.
**Run:** `node -e "const lf = require('./.skills-repo/skills-lock.json'); ['upstreamSource','pinnedRef','pinnedAt','platformVersion','skills'].forEach(f => console.log(f, !!lf[f]));"`
**Expected:** All five fields print `true`.

---

## Scenario 2 — verify passes on untampered sidecar (AC2)

**Setup:** After successful `skills-repo init` with correct sidecar.
**Run:** `skills-repo verify`
**Expected:** Exits zero. No hash mismatch errors.

---

## Scenario 3 — verify detects tampered skill file (AC4)

**Setup:** After `skills-repo init`. Modify one byte in a skill file inside the sidecar.
**Run:** `skills-repo verify`
**Expected:** Exits non-zero. Error message includes the skill ID, expected hash, and actual hash.

---

## Scenario 4 — Deterministic hash (AC3)

**Setup:** Run `skills-repo pin` twice against identical upstream content and identical ref.
**Run:** Compare the two resulting lockfiles (excluding `pinnedAt`).
**Expected:** All fields except `pinnedAt` are byte-for-byte identical. `contentHash` values are the same.

---

## Scenario 5 — NFR: SHA-256 hash length check

**Run:** `node -e "const lf = require('./.skills-repo/skills-lock.json'); console.log(lf.skills[0].contentHash.length);"`
**Expected:** Prints `64` (SHA-256 hex length).

---

## Scenario 6 — NFR: Schema validation in npm test

**Run:** `npm test`
**Expected:** Test suite includes lockfile schema validation. No test failure attributable to lockfile format.
