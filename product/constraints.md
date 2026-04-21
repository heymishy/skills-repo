# Product Constraints

Hard constraints that shape every design and implementation decision. Violating them breaks the platform's core promises.

---

## 1. The update channel must never be severed

A consuming squad must be able to receive platform skill updates without forking the platform repository. Any distribution model requiring a fork as the consumption mechanism is not a valid solution.

---

## 2. POLICY.md floors are non-negotiable

No squad or domain configuration may weaken a POLICY.md floor defined at a higher tier. Domain configurations may strengthen core floors. Squad configurations may strengthen domain floors. Neither may weaken.

---

## 3. Spec immutability — the improvement loop cannot redefine success

Story specs, acceptance criteria, DoR criteria, DoD criteria, and POLICY.md floors are immutable to all automated agents, including the improvement agent. No automated process may modify these artefacts without human authorship and review.

The improvement loop hill-climbs the delivery machinery (SKILL.md files, eval suites) toward the spec. It does not move the spec. The practical boundary: the improvement agent may propose diffs to SKILL.md files and additions to `workspace/suite.json`. It may not propose changes to story specs, AC, POLICY.md floors, or DoR/DoD criteria.

---

## 4. Human approval gate is non-negotiable for instruction set changes

No change to a SKILL.md file, POLICY.md file, or standards file may be merged without human review and explicit approval. Regardless of: the source of the change, the improvement agent's confidence level, the measured performance improvement, or the urgency of the fix. The improvement agent may propose. It cannot merge.

---

## 5. Instruction sets are versioned and hash-verified

Every SKILL.md file, POLICY.md file, and composed standards document delivered to an agent must be versioned and produce a deterministic hash. The assurance agent records this hash in the decision trace.

A hash mismatch between the trace and the registry is an **audit signal warranting investigation** — not necessarily evidence of tampering, and not a tamper prevention mechanism. The hash's primary value is the audit trail: the trace permanently records what instruction set ran, regardless of what happens to the file afterwards.

The actual tamper prevention controls are: branch protection on the platform repo, required PR reviews for SKILL.md changes, and the human approval gate. These are process controls, not cryptographic ones. See ADR-003 for the full scope statement.

**`results.tsv` and `suite.json` carry the same caveat.** Anyone with write access can edit `results.tsv` to lower the watermark baseline, delete entries from `suite.json` to shrink the eval suite, or delete the files entirely — in which case every gate run trivially passes. These files must be treated as governance artefacts, not mutable operational state.

**However, a critical distinction applies to write access:** `suite.json` and `results.tsv` are written by automated processes on every gate run — putting them under full branch protection (PR required for every write) is unworkable at any delivery pace. The resolution is a two-layer model:

- **Branch-protected baseline** — an initial `suite.json` and a `results.tsv` seed entry are committed under branch protection. Deliberate resets or deletions require a PR.
- **Append-only running state** — the assurance agent appends to `results.tsv` and proposes suite additions to `workspace/proposals/` (which require human review before merging to `suite.json`). Direct append to `results.tsv` is permitted; deletion or overwrite is not. Enforcement is via CI gate validation that the file has grown, not shrunk.

`traces/` and `proposals/` are freely writable by automated processes — they accumulate evidence, not governance parameters. `SKILL.md`, `POLICY.md`, and `standards/` files remain fully branch-protected.

**Intentional gap — verbatim instruction assembly record (G19):** The audit trail records which SKILL.md file ran (hash-verified) and which standards were injected (by name and version). It does not record the verbatim text of the composed instruction sent to the model per invocation. This is an intentional scope boundary in Phase 5: storing verbatim per-invocation instruction text requires a data governance model covering retention period, storage cost, access controls, and personally identifiable information risk that has not yet been designed. Phase 6 WS9 (agent identity layer) will determine whether and how this record becomes feasible. Until that decision is made, the hash-of-file-at-known-version is the audit record.

---

## 6. Platform surface type must be explicitly declared

The delivery surface type for a story must be declared before the story enters the inner loop. Two permanently valid paths:

**Path A — EA registry** (when available and integrated): registry is the authoritative source; the discovery skill queries it at Phase A start; surface type is injected automatically.

**Path B — `context.yml` explicit declaration** (when registry not available, not integrated, or for squads where the registry doesn't yet cover their platform): the squad tech lead declares surface type in `context.yml`. This is a permanent valid path, not an interim workaround. The squad is accountable for the accuracy of the declaration in the same way they are accountable for any `context.yml` configuration.

The platform treats both paths as equally authoritative. The adapter does not know which path resolved the surface type. Cross-surface stories may declare multiple surface types (`delivery-surface: [git-native, saas-gui]`); the discovery skill creates separate DoD gates per surface regardless of which path was used.

---

## 7. One question at a time in skill interactions

Skills ask one question at a time. The only exception is a final confirmation of an already-written multi-field artefact.

---

## 8. Design artefacts are referenced, not embedded

The platform references design artefacts via URL in `context.yml`. It does not embed design content in SKILL.md files.

---

## 9. Design system compliance is structural, not advisory

For stories with a `design.system` context tag, design system component usage is a DoR hard block. A story that bypasses the design system requires an accepted risk decision logged in `decisions.md`. Accessibility standard (WCAG 2.1 AA minimum) is a hard floor, not a performance NFR.

---

## 10. The platform does not generate design artefacts

The platform validates that design artefacts exist and meet declared standards. It does not produce wireframes, design tokens, or visual specifications.

---

## 11. No persistent agent runtime dependency

The platform must operate on standard CI/CD infrastructure. It does not require a hosted agent service, persistent message queue, or proprietary orchestration platform.

---

## 12. Credentials are structural — never in the agent's environment <!-- ADDED: 2026-04-09 -->

PAT and OAuth tokens must live in a secrets store (Bitbucket pipeline secrets, Azure Key Vault, or equivalent). The MCP proxy fetches credentials at call time. The agent never handles a credential directly.

This is a structural guarantee, not a SKILL.md instruction. A SKILL.md instruction saying "don't read your environment variables" is a policy the agent can fail to follow. "The credentials aren't in the environment" is a structural property the architecture enforces.

Practical implication: the `context.yml` MCP section must reference secret names, not credential values. No PAT or OAuth token appears in any tracked file.

---

## 13. Structural governance preferred over instructional <!-- ADDED: 2026-04-09 -->

Where a governance property can be enforced by the CI gate independently of agent behaviour, it must be. Instructions to agents are advisory; CI gate checks are the authoritative enforcement point.

The test for any proposed governance requirement: "Can the CI gate verify this independently of what the agent says?" If yes, the CI gate must verify it structurally. The SKILL.md instruction may additionally remind the agent, but the structural check is the authority.

This constraint shapes all future CI gate design decisions. The minimum set of structural checks the gate must always perform:
- Prompt hash matches registry
- Assurance session ≠ dev session (agent independence)
- Trace has valid `inProgress`→`completed` transition
- Watermark gate passes

---

## 14. Context window management — minimise and recover from compaction <!-- ADDED: 2026-04-09 -->

Compaction cannot be prohibited — Copilot Agent mode applies it automatically when context fills, regardless of any instruction to the contrary. The agent does not choose compaction; the runtime does. The platform's approach is to minimise likelihood and design for recovery rather than prohibit what cannot be prohibited.

**Minimise likelihood:**
- Phase boundary writes to `workspace/state.json` — mandatory checkpoint writes that reduce the cost of a session ending
- Progressive skill disclosure (P1.1) — token budget managed by phase-sequenced loading, reducing context pressure
- The intended pattern of one outer loop cycle per session — context pressure typically stays below threshold for a single cycle; chaining multiple cycles in one session is where 75-80% is typically hit

**Design for recovery when it occurs:**
- `workspace/state.json` is the recovery mechanism — if compaction degrades a session or the session exits, the next session resumes from the last phase boundary checkpoint without reading the prior conversation
- The human `/checkpoint` override is the proactive exit before compaction occurs. **Effective threshold: 55% for file-read-heavy phases (definition, review, test-plan, trace, inner loop)**. The 75% guideline was calibrated against conversation-only phases; file reads fill the Tool Results context bucket faster than the Messages bucket, so the effective safe window is lower. Updated 2026-04-10 from Phase 1 dogfood signal (8+ sessions — compaction consistently fired at ~60% in file-read-heavy phases). Use 75% only for conversation-only phases with no large artefact reads.

**Why self-monitoring is not viable:** Agents cannot read their own token consumption. Phase boundaries are the structural checkpoint trigger — not token thresholds, which would require self-monitoring.

**The honest position:** Compaction will occasionally occur. When it does, the platform's response is a clean exit and resume from `state.json`, not an attempt to continue in a degraded session.

---

## 15. SKILL.md instructions must be outcome-oriented <!-- ADDED: 2026-04-09 -->

SKILL.md instructions must state what the outcome must be, not compensate for a current model behaviour. Workaround-oriented instructions — those that encode what the model currently can't do without prompting — are prohibited because they go stale as models improve and become dead weight that the improvement agent must detect and remove.

The diagnostic test: "If this model behaviour improved tomorrow, would this instruction still be correct?" If no, the instruction is workaround-oriented and must be rewritten as an outcome statement or removed.

This applies to all SKILL.md files authored by platform maintainers, domain leads, and squads. The authoring principles in the standards model document define the full checklist.
