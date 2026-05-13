# DoR Contract: p1-hash-defect

**Slug:** `2026-04-27-p1-hash-defect`
**Story:** Fix hash self-comparison defect in cli-adapter advance()
**DoR artefact:** `artefacts/2026-04-27-p1-hash-defect/dor/p1-hash-defect-dor.md`
**Date:** 2026-04-27

---

## File touchpoints

### Files to modify (in scope)

| File | Change type | Description |
|------|-------------|-------------|
| `src/enforcement/cli-adapter.js` | Modify | Add `sidecarRoot` to `advance()` opts; change C5 block to call `resolveSkill` and pass `actual: resolved.contentHash` |
| `package.json` | Modify | Add `node tests/check-p1-hash-defect.js` to the npm test chain |

### Files to read (not modify)

| File | Purpose |
|------|---------|
| `src/enforcement/governance-package.js` | Understand `resolveSkill` and `verifyHash` contracts (do not modify) |
| `.github/architecture-guardrails.md` | Verify constraints C5, ADR-004, ADR-011 before implementing |

### Files already created (do not recreate)

| File | Description |
|------|-------------|
| `tests/check-p1-hash-defect.js` | TDD red baseline — 7 failing, 9 passing. Must reach 16/16 passing after fix. Do not modify. |
| `artefacts/2026-04-27-p1-hash-defect/stories/p1-hash-defect.md` | Story artefact |
| `artefacts/2026-04-27-p1-hash-defect/test-plans/p1-hash-defect-test-plan.md` | Test plan |
| `artefacts/2026-04-27-p1-hash-defect/verification-scripts/p1-hash-defect-verification.md` | Verification script |
| `artefacts/2026-04-27-p1-hash-defect/nfr-profile.md` | NFR profile |

---

## Out-of-scope constraints

The following are **explicitly out of scope** for this story. Do not implement:

1. **The 7 stub CLI commands** (`init`, `fetch`, `pin`, `verify`, `workflow`, `back`, `navigate`) — these remain as `{ status: 'ok' }` stubs. Implementing them is a separate P2 story.
2. **ADR-013 combined-operation interface** (`resolveAndVerifySkill`, `evaluateGateAndAdvance`, `writeVerifiedTrace`) — separate P2 story.
3. **Changes to `governance-package.js`** — this file is correct. Do not modify it.
4. **Changes to the MCP adapter** — different surface, separate verification path.
5. **Any artefact files under `artefacts/`** — read-only pipeline inputs.
6. **`.github/skills/`, `.github/templates/`, `standards/`** — platform infrastructure, require a PR via platform team.

---

## Dependency contract

No upstream story dependencies. This fix is fully self-contained within `src/enforcement/cli-adapter.js`.

---

## Regression risk

`tests/check-p4-enf-cli.js` contains T5 and T6 which mock `govPackage` with only `verifyHash` and `advanceState`. After the fix, `advance()` only calls `resolveSkill` when **both** `skillId` AND `sidecarRoot` are provided. T5/T6 pass `skillId` but no `sidecarRoot` — so the C5 block is skipped entirely (new condition: `if (govPackage && skillId && sidecarRoot)`). T5/T6 should therefore continue to pass without mock updates. Verify with `node tests/check-p4-enf-cli.js` after implementing.

---

## Verification gate

```
node tests/check-p1-hash-defect.js
```

Must output `16 passed, 0 failed` and `PASS` before opening the PR.

Also run:
```
npm test
```

All tests in the chain must pass.
