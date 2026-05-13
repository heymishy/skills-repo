# Story: Fix hash self-comparison defect in cli-adapter advance()

**Epic reference:** Phase 4 enforcement — CLI surface (p4-enf-cli)
**Discovery reference:** Short-track — no discovery artefact (bounded bug fix, short-track exemption)
**Benefit-metric reference:** WSJF portfolio sequencing artefact `artefacts/2026-04-26-portfolio-sequencing/sequencing-decision.md` — P1, WSJF=39.0

## User Story

As a **platform operator using the CLI enforcement surface**,
I want to **`advance` to call `resolveSkill` and pass the actual file content hash to `verifyHash`**,
So that **C5 (tamper-evident hash verification) is genuinely enforced and the platform's P1 fidelity claim on the CLI surface is not false**.

## Benefit Linkage

**Metric moved:** P1 fidelity — skill-as-contract (hash abort on mismatch).
**How:** The current implementation passes `actual: expectedHash` to `verifyHash`, which is identical to `expected: expectedHash`. `verifyHash` returns `null` every time, silently making C5 a no-op on every CLI `advance` call. Fixing this closes the security gap and makes the P1 fidelity claim true on the CLI surface.

## Architecture Constraints

- **C5** — hash verification is unconditional; no override or bypass parameter permitted (`governance-package.js` docstring).
- **ADR-004** — no hardcoded paths; `sidecarRoot` injected by caller.
- **ADR-011** — artefact-first rule: this story artefact must exist before implementation begins.
- **MC-SEC-02** — no skill content or credentials logged externally.
- **MC-CORRECT-02** — no new `pipeline-state.json` fields written from `governance-package.js`.

## Dependencies

- **Upstream:** None — `governance-package.resolveSkill` is already implemented and tested.
- **Downstream:** Unblocks P2 (Phase 4 WS0 completion) and the platform's C5 fidelity claim on all CLI surfaces.

## Acceptance Criteria

**AC1:** Given `advance()` is called with `govPackage`, `skillId`, and `sidecarRoot`, when `govPackage.resolveSkill({ skillId, sidecarRoot })` returns a `contentHash`, then `govPackage.verifyHash` is called with `actual: contentHash` (the value from `resolveSkill`) and NOT `actual: expectedHash`.

**AC2:** Given `advance()` is called with `govPackage`, `skillId`, and `sidecarRoot`, when the `contentHash` returned by `resolveSkill` differs from `expectedHash`, then `advance()` returns `{ error: 'HASH_MISMATCH', ... }` and does NOT call `govPackage.advanceState`.

**AC3:** Given `advance()` is called with `govPackage`, `skillId`, and `sidecarRoot`, when `govPackage.resolveSkill` returns `null` (skill file not found), then `advance()` returns `{ error: 'SKILL_NOT_FOUND', skillId }` and does NOT call `govPackage.advanceState`.

**AC4:** Given `advance()` is called with `govPackage`, `skillId`, and `sidecarRoot`, when `contentHash === expectedHash` (hashes match), then `advance()` does NOT return an error and calls `govPackage.advanceState` to produce the new state.

**AC5 (regression):** Existing T3 and T4 behaviour is preserved — `advance()` without `skillId`/`sidecarRoot` still enforces transition-declaration rules and returns the correct error/success as before.

## Out of Scope

- Fixing the 7 stub CLI commands (`init`, `fetch`, `pin`, `verify`, `workflow`, `back`, `navigate`) — separate P2 story.
- Expanding `evaluateGate` to cover gate names beyond the existing 4 — separate P2 story.
- Implementing the ADR-013 combined-operation interface (`resolveAndVerifySkill`, `evaluateGateAndAdvance`, `writeVerifiedTrace`) — separate P2 story.
- Any MCP adapter changes — the MCP adapter has its own hash verification path.

## NFRs

- **Security:** After this fix, `verifyHash` must never receive `actual === expected` from `advance()` when a real `sidecarRoot` is supplied — the actual and expected hashes must be independently derived.
- **Performance:** The `resolveSkill` call adds one synchronous file read per `advance` call — acceptable given this is a governance gate operation.
- **No new dependencies:** Node.js built-ins only — no new packages added.

## Complexity Rating

**Rating:** 1 (well-understood, clear path — one parameter change + sidecarRoot threading + `resolveSkill` call)
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
