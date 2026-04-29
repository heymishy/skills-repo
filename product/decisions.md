# Architectural Decision Records

Decisions that shaped the platform's design. New decisions are appended; old decisions are never edited (they may be superseded by a later entry).

---

## ADR-001 — Pipeline artefacts isolated to `.pipeline/` at project root

**Status:** Accepted | **Date:** 2026-04-02

Pipeline artefacts written to `.pipeline/` at project root. Isolates pipeline state from working tree without polluting root-level files. Consistent across all tech stacks.

**Alternatives rejected:** Root-level files (noise), `.agent/` prefix (no convention), dedicated branch (git complexity).

---

## ADR-002 — Three-tier inheritance model (core → domain → squad)

**Status:** Accepted | **Date:** 2026-04-02

Three tiers: core (platform repo), domain (tribe repo), squad (consumer repo). Lower tiers may strengthen but not weaken higher-tier POLICY.md floors.

**Alternatives rejected:** Two-tier (insufficient for regulated enterprise), flat (no governance hierarchy).

---

## ADR-003 — Cryptographic prompt hash as the audit anchor

**Status:** Accepted | **Date:** 2026-04-02  
**Revised:** 2026-04-09 — scope of hash verification clarified

SHA-256 hash of assembled SKILL.md set recorded in every decision trace.

**What hash verification genuinely provides:**

- **Audit trail** — the hash in the trace permanently records which version of a SKILL.md governed which action. Even after the file changes, you can verify the historical claim. To defeat it you'd need to tamper with both the trace log and the archived file version.
- **Accidental drift detection** — a SKILL.md modified as a side effect of a merge conflict, bulk find-and-replace, or tooling change will fail the hash check. Catches the careless case reliably.
- **Distribution integrity** — when skills are delivered as versioned packages to 50 squads, a local copy that has drifted from the published version produces a hash mismatch the assurance agent flags.

**What hash verification does not provide:**

- **Tamper prevention** — anyone with write access to the repo can change the SKILL.md, update the expected hash to match, and the gate passes. Anyone who can modify the CI gate script can remove the hash check entirely. Anyone with admin rights can bypass branch protection and push directly.

**The real governance controls are process, not cryptography.** The hash check is only as strong as the controls around it: branch protection + required reviews (SKILL.md changes require a PR reviewed by the platform team) is the actual second-line control. The hash tells you what ran; the review process ensures what runs is legitimate.

For RBNZ model risk purposes this is sufficient. The requirement is that you can audit what instruction set governed an action — not that it was technically impossible to change it. The trace record permanently shows whether a non-platform instruction set ran; for a regulated bank, that's a finding, not just a technical flag.

**How to frame this:** Hash verification is a **trust model**, not a **tamper prevention model**. Analogous to npm package integrity — you can modify `node_modules`, but the package manager can tell you the file has been modified, and your modified version won't receive updates.

**Alternatives rejected:** Version number only (no integrity check for in-place modification), filename only (no integrity check), full content in trace (too large; PII risk if context injected).

---

## ADR-004 — CI-triggered execution, not persistent agent runtime

**Status:** Accepted | **Date:** 2026-04-03

Standard CI/CD infrastructure (GitHub Actions, Bitbucket Pipelines) as agent execution environment. No persistent agent runtime required. CI trigger is scheduler, sandbox, secrets store, audit log, and retry mechanism.

**Alternatives rejected:** Mission Control (infrastructure dependency), Azure AI Foundry (viable Phase 4 candidate; not appropriate for Phase 1–2).

---

## ADR-005 — Six delivery surface types, two-path declaration model

**Status:** Accepted | **Date:** 2026-04-03  
**Revised:** 2026-04-09 — `context.yml` path is permanent, not interim

Six first-class surface types: git-native, IaC, SaaS-API, SaaS-GUI, M365-admin, manual. Surface type declared via one of two permanently valid paths: EA registry (when available and integrated) or `context.yml` explicit declaration (permanent valid alternative, not an interim workaround). DoD criteria, SKILL.md variants, and verification approach vary by surface type.

**Alternatives rejected:** Git-native only (governs minority of actual enterprise work), unlimited surface types (governance model requires defined surfaces with defined DoD variants), registry-only (excludes squads whose platforms aren't yet in the registry).

---

## ADR-006 — Watermark gate pattern for assurance agent

**Status:** Accepted | **Date:** 2026-04-07

Two-check gate: (1) eval suite pass rate ≥ threshold; (2) full score ≥ best score in `workspace/results.tsv`. Change that passes (1) but fails (2) is flagged as regression.

**Rationale:** Single pass/fail check cannot detect gradual degradation. Watermark ensures the platform must be at least as good as the best it has achieved. Derived from auto-harness pattern (NeoSigma AI, March 2026).

**Alternatives rejected:** Fixed threshold only (cannot detect regression trend), rolling average (smooths out regressions).

---

## ADR-007 — `workspace/` as improvement loop state store

**Status:** Accepted | **Date:** 2026-04-07

Improvement loop working state lives in `workspace/`: `state.json`, `learnings.md`, `suite.json`, `results.tsv`, `traces/`, `proposals/`. Tracked in platform repo; gitignored in consumer repos.

**Alternatives rejected:** External state store (infrastructure dependency; violates ADR-004), root-level files (pollutes working tree), `.pipeline/` subdirectory (separate concern from story artefacts).

---

## ADR-008 — Harness engineering as contributor vocabulary

**Status:** Accepted | **Date:** 2026-04-07

"Harness engineering" adopted as engineering-layer vocabulary for contributors. "Skills pipeline" and "governed instruction delivery" remain primary vocabulary for stakeholder and regulatory audiences. Dual vocabulary is intentional.

---

## ADR-009 — Meta/task agent split for improvement loop

**Status:** Accepted | **Date:** 2026-04-07  
**Revised:** 2026-04-09 — three-agent independence characterisation corrected

Dedicated improvement agent (meta) structurally separate from delivery agents (task). One agent improving its own harness explicitly rejected.

**On three-agent independence in the delivery loop:** The docs previously stated that dev/review/assurance agent independence was "structural — enforced by the CI gate." This was corrected in the 2026-04-09 revision. The honest characterisation is **procedural with audit backstop**: the CI gate verifies three traces exist with correct structure; it cannot verify they were produced by genuinely independent sessions. Trace content is self-reported. Independence is enforced by human discipline and team practice, not by the architecture. This is a known limitation — the platform's response is transparency about it rather than overclaiming a structural guarantee that doesn't exist.

**Rationale for meta/task split:** Being good at a domain and being good at improving that domain's harness are different capabilities. Also required by spec immutability — a delivery agent that could modify its own SKILL.md could progressively lower its own governing standard.

**Alternatives rejected:** Self-improving delivery agent (validated as not working — AutoAgent research, March 2026; Karpathy autoresearch loop), human-only harness improvement (insufficient at Phase 2+ scale).

---

## ADR-010 — Trace events emitted during execution, not on completion <!-- ADDED: 2026-04-09 -->

**Status:** Accepted | **Date:** 2026-04-09

All agents emit trace events using an `emitEvent` pattern before each step is considered complete. The trace has an `inProgress` state that transitions to `completed` on clean exit. The CI gate validates this transition exists before verdicting pass.

**Rationale:** Traces written only on completion are lost if the session crashes. `inProgress` traces are recoverable — they show how far execution progressed and allow the improvement agent to detect partial runs. The CI gate blocking on missing `completed` transition prevents incomplete work from merging silently.

Derived from Anthropic Managed Agents architecture (April 2026): the session log is durable and written during execution, not after — "nothing in the harness needs to survive a crash."

**Alternatives rejected:** Completion-only trace (unrecoverable on crash; CI gate cannot distinguish crash from clean exit), external session store (infrastructure dependency; violates ADR-004).

---

## ADR-011 — Surface adapter as universal interface <!-- ADDED: 2026-04-09 -->

**Status:** Accepted | **Date:** 2026-04-09

The contract between the brain and any delivery surface is `execute(surface, context) → result`. The brain never branches internally on surface type. All surface-specific complexity lives behind the adapter. The assurance agent receives an `AdapterResult` — it does not know which surface produced it.

**Rationale:** A brain that branches on surface type encodes surface-specific assumptions in its SKILL.md. These assumptions go stale as surface tooling evolves independently. A uniform interface keeps the brain surface-agnostic; surface implementations can change without touching SKILL.md files. Derived from Anthropic Managed Agents: "the harness doesn't know whether the sandbox is a container, a phone, or a Pokémon emulator."

**Alternatives rejected:** Per-surface SKILL.md branching (encodes surface assumptions in brain; must be updated when surface tooling changes), surface-specific skills (proliferates skills; no composability).

---

## ADR-012 — SKILL.md instructions must be outcome-oriented <!-- ADDED: 2026-04-09 -->

**Status:** Accepted | **Date:** 2026-04-09

SKILL.md instructions must state what the outcome must be, not compensate for a current model behaviour. Workaround-oriented instructions go stale as models improve and become dead weight that costs tokens without providing governance value.

**Diagnostic test:** "If this model behaviour improved tomorrow, would this instruction still be correct?" If no → rewrite as outcome statement or remove.

**Relationship to staleness detection:** Workaround-oriented instructions are the primary source of staleness signals. An instruction consistently over-satisfied by a large margin is likely a workaround the model no longer needs. The improvement agent flags it; the platform team applies this diagnostic test before removing it.

**Rationale:** Derived from Anthropic Managed Agents (April 2026): "harnesses encode assumptions about what Claude can't do on its own — those assumptions go stale as models improve." Example: a context reset added for "context anxiety" in Sonnet 4.5 became dead weight on Opus 4.5.

**Alternatives rejected:** Allow workaround-oriented instructions (creates technical debt in SKILL.md files; improvement agent must continuously detect and remove them; token cost grows as model improves).

---

## ADR-013 — Structural governance preferred over instructional <!-- ADDED: 2026-04-09 -->

**Status:** Accepted | **Date:** 2026-04-09

Where a governance property can be enforced by the CI gate independently of agent behaviour, it must be. SKILL.md instructions are advisory first-line guidance. CI gate checks are the authoritative structural enforcement.

**Test for any proposed governance requirement:** "Can the CI gate verify this independently of what the agent says?" If yes, the CI gate must verify it structurally.

**Minimum structural checks the CI gate always performs:** hash matches registry, assurance session ≠ dev session, trace has valid `inProgress`→`completed` transition, watermark gate passes.

**Rationale:** Derived from Anthropic Managed Agents (April 2026): "narrow scoping is an obvious mitigation, but this encodes an assumption about what Claude can't do with a limited token — and Claude is getting increasingly smart. The structural fix was to make sure the tokens are never reachable from the sandbox." Structural guarantees survive model capability improvement and prompt injection; instructional constraints don't.

**Alternatives rejected:** Instruction-only governance (depends on agent correctly following instructions; degraded security as models become more capable; cannot survive prompt injection).

---

## ADR-014 — Checkpoint-not-compaction for context window management <!-- ADDED: 2026-04-09 -->

**Status:** Accepted | **Date:** 2026-04-09

The platform does not use compaction for context window management. Compaction makes irreversible lossy decisions about what to discard, produces no signal that it has occurred, and cannot be selectively recovered from.

**The platform's approach:**
- Phase boundary writes to `workspace/state.json` are mandatory checkpoint writes — not conditional on context pressure
- Sessions are designed to be disposable — all state externalises before session end
- Human `/checkpoint` override is the escape valve when context approaches 55% (file-read-heavy phases: definition, review, test-plan, trace, inner loop) or 75% (conversation-only phases) before a phase boundary — updated 2026-04-10 from Phase 1 dogfood signal
- Progressive skill disclosure (P1.1) is the inner loop's context management mechanism
- Self-monitoring is not viable — agents cannot read their own token consumption in the current runtime

**Why phase boundaries, not token thresholds:** Agents cannot see their own token usage. Self-monitoring is therefore unreliable. Phase boundaries are structural checkpoints — they happen at semantically coherent points where artefacts are complete, regardless of context level. A new session resuming from a phase boundary checkpoint never needs to read the prior conversation.

**Why not compaction:** Compaction is irreversible. It is difficult to know which tokens future turns will need. A compacted session cannot be fully recovered. A checkpointed session can always resume from `state.json`.

**Alternatives rejected:** Self-monitoring token threshold (agent cannot see token usage), compaction (irreversible, lossy, no recovery signal), single long session (not viable for multi-outer-loop workflows; context pressure hits at 75-80% on chained outer loop runs).

---

## ADR-015 — `state.json` durable state separated from `learnings.md` rendered view <!-- ADDED: 2026-04-09 -->

**Status:** Accepted | **Date:** 2026-04-09

`workspace/state.json` is the durable, structured, machine-readable source of truth. `workspace/learnings.md` is a rendered view generated from `state.json` at session start, optimised for the agent's context window. These are separate files serving separate concerns.

**Rationale:** Derived from Anthropic Managed Agents (April 2026): "we separated the concerns of recoverable context storage in the session and arbitrary context management in the harness because we can't predict what specific context engineering will be required in future models." The durable state must survive unchanged as context engineering improves. The rendered view can be restructured freely — it is regenerated from `state.json` at each session start.

**Practical implication:** If `learnings.md` format needs to change for a new model's context window characteristics, only the rendering logic changes. `state.json` and all prior state records are unaffected.

**Alternatives rejected:** Single markdown file for both concerns (conflates durability with context engineering; restructuring the format risks losing durable state; cannot be regenerated if corrupted).

---

## GATE-P2.12-CLEARED — p2.12 delivery sequencing gates satisfied <!-- ADDED: 2026-04-12 -->

**Status:** Recorded | **Date:** 2026-04-12

Both delivery sequencing gates for p2.12 (improvement agent — challenger skill) are confirmed cleared before coding agent proceeds.

**Gate 1 (traces):** `workspace/traces/` contains ≥1 real Phase 2 inner loop trace file.
- Qualifying trace: `workspace/traces/2026-04-11T21-33-02-002Z-ci-84f82370.jsonl` (and 10 additional files)
- Cleared: 2026-04-12

**Gate 2 (p2.11 DoD):** p2.11 (improvement-agent-trace-proposals) is DoD-complete.
- Evidence: `src/improvement-agent/trace-interface.js` and `src/improvement-agent/failure-detector.js` exist; `tests/check-improvement-agent.js` passes 24 tests.
- Cleared: 2026-04-12

**Action:** Coding agent proceeds to implement p2.12 (challenger.js, improvement-agent SKILL.md, and test suite).

---

## Open ADRs — deferred to Phase 4

Require Phase 3 operational evidence before they can be made responsibly.

- **ADR-TBD:** Improvement agent governance model at scale — at what point does the improvement agent's track record justify reduced review scrutiny? (Current answer: never. Revisit at Phase 4 data.)
- **ADR-TBD:** Azure AI Foundry as enterprise runtime — feasibility assessment; depends on Azure posture at Phase 4
- **ADR-TBD:** Cross-squad improvement agent coordination — shared improvement queue vs independent agents with cross-team aggregation at platform level; depends on Phase 3 operational learnings

*Note: Challenger model previously listed here. Moved to Phase 2 as composition of existing agents — no new infrastructure required.*

- **ADR-TBD: Reusable CI workflow definitions** — platform publishes a reusable CI workflow (GitHub Actions reusable workflow or Bitbucket equivalent) that squad repos call rather than owning their own gate logic. A squad cannot modify the gate without modifying the platform repo — the gate itself is outside squad write access. This is a stronger structural control than hash verification alone. Decision depends on whether Ent CI infrastructure supports reusable workflow patterns and whether the security team accepts the platform repo as a trusted workflow source. If viable, this upgrades hash verification from an audit control to a genuine structural control. <!-- ADDED: 2026-04-09 -->

---

## ADR-016 — Skill lockfile path: `.github/skills/skill-lockfile.json` <!-- ADDED: 2026-04-28 -->

**Status:** Accepted | **Date:** 2026-04-28 | **Required by:** p11.4 (lockfile-schema-pin-verify) before coding agent dispatch

The skill integrity lockfile is stored at `.github/skills/skill-lockfile.json` — adjacent to the skill directories whose SKILL.md files it hashes.

**Rationale:** Collocating the lockfile with the skill files it describes minimises lookup complexity for `verify()`. The `.github/` directory is already the canonical home for platform governance files. WS4.3 (Phase 5 hash verification workstream) reads this path; this establishes it as a committed integration contract. Path is not configurable — a fixed path is required for consistent CI verification.

**Alternatives rejected:** `.github/skill-lockfile.json` (not collocated with skill directories; ambiguous scope), `workspace/skill-lockfile.json` (workspace/ is for session state, not governance artefacts; would be gitignored in consumer repos), root-level (noise in consumer repo root).

**Implication:** Any consumer tooling, CI scripts, or future WS4.3 implementation that reads the lockfile must use this path. Changing the path requires a migration story and a decision to supersede this ADR.

---

## RISK-ACCEPT — P11 /definition-of-ready MEDIUM findings (2026-04-28) <!-- ADDED: 2026-04-28 -->

**Status:** Accepted | **Date:** 2026-04-28 | **Session:** P11 DoR run

The following MEDIUM review findings from the P11 review phase are accepted for the reasons stated. Each was surfaced as Warning W3 during /definition-of-ready and is logged here per /decisions requirements.

**p11.1 (finding 1-M1):** AC3 embeds an implementation note ("If the approved-by-required marker is moved, update the contract check simultaneously") after the testable clause. The core testable condition is clear: npm test passes and the marker is present. Test plan is written against the clear intent. Risk of test ambiguity is low — the implementation note is advisory only. Accepted.

**p11.2 (finding 1-M1):** AC4 embeds an implementation note after the testable clause ("If a new required marker is added to a skill, update check-skill-contracts.js simultaneously"). The testable condition (npm test passes, metric-owner-required marker present) is unambiguous. Implementation note is advisory. Accepted.

**p11.4 (finding 1-M1):** AC5 uses a hypothetical future actor ("any future WS4.3 implementation will read the sha256 field"). The deliverable is the schema document containing the sha256 field — that field's presence is fully testable today. WS4.3 interoperability cannot be verified without WS4.3, which is a Phase 5 workstream. Risk: AC5 may not be fully end-to-end verifiable in this phase. Accepted — the schema field is the correct deliverable; interoperability testing is deferred to Phase 5.

**p11.5 (finding 1-M1):** AC4 names the implementation mechanism (`child_process.execSync`). Naming the mechanism is acceptable here because fetch() is inherently a git command invocation — the mechanism is the point, not an incidental implementation detail. Test plan mocks execSync. Risk: if a future implementation uses a different subprocess mechanism, AC4 may need revision. Accepted for MVP scope.

**p11.7 (finding 1-M1):** No explicit AC for the Entry C vs Entry A priority conflict (what happens when both DoD artefacts and in-flight stories are present simultaneously). Priority order (C > A > B — first match wins) is declared in Architecture Constraints and will be tested via a SKILL.md file content assertion (check-p11-start.js T11.7.10). Risk: the priority test is a content check rather than an observable-behaviour AC. Accepted — the priority constraint is clearly documented and testable as instruction text.

---

## RISK-ACCEPT — P11 delivery sequencing constraints acknowledged (2026-04-28) <!-- ADDED: 2026-04-28 -->

**Status:** Accepted | **Date:** 2026-04-28 | **Session:** P11 DoR run

The following delivery sequencing constraints have been noted at DoR sign-off. These are not hard DoR blocks — all stories have been signed off — but coding agent dispatch must respect the ordering below.

**p11.3 (W2 + W5):** Scope stability is Unstable until the bounded attribution model ADR is written. The bounded attribution model decision (what constitutes a qualifying non-engineering role in the `## Approved By` section) has not yet been documented as an ADR in decisions.md. Dispatch of p11.3 to the coding agent must be deferred until: (1) p11.1 is DoD-complete, and (2) the bounded attribution model ADR is written. Operator action required: run /decisions to produce the bounded attribution model ADR before dispatching p11.3.

**p11.5 (W5):** init() consumes the lockfile format and path established by p11.4. Dispatch of p11.5 must be deferred until p11.4 is DoD-complete.

**p11.7 (W2 + W5):** p11.7 extends the `/start` SKILL.md created by p11.6. Dispatch of p11.7 must be deferred until p11.6 is DoD-complete. Scope stability is Unstable (brownfield detection signals may need tuning after first consumer observation).

---

## NOTE — Bounded attribution model decision required before p11.3 dispatch <!-- ADDED: 2026-04-28 -->

**Status:** Open — operator action required before p11.3 coding agent dispatch

The p11.3 story (H-GOV block in /definition-of-ready SKILL.md) requires a decision on what constitutes a "qualifying non-engineering role" in the `## Approved By` section of a discovery artefact. The ACs give examples (Product Manager, Business Analyst, Business Lead) but do not make these authoritative.

**Decision required:** Artefact-level sign-off (any named non-engineering role per artefact is sufficient) vs a specific allowlist of role strings. The coding agent implementing H-GOV needs the authoritative role strings to implement role detection.

**Action:** Run `/decisions` to produce a formal ADR covering this decision. When the ADR is written, update the p11.3 DoR dispatch gate status in `artefacts/2026-04-24-platform-onboarding-distribution/dor/p11.3-dor.md` from 🔴 Not cleared to 🟢 Cleared.

---

## ADR-017 — H-GOV attribution model: presence-only check, no role validation <!-- ADDED: 2026-04-29 -->

**Status:** Accepted | **Date:** 2026-04-29 | **Required by:** p11.3 (H-GOV hard block in /definition-of-ready) before coding agent dispatch

**Context:** The H-GOV hard block (p11.3) checks whether a discovery artefact has received sign-off from at least one person outside the engineering team. The `## Approved By` section of the discovery artefact is the attestation point (established by p11.1). A decision was needed on how strictly to validate entries in that section: require specific recognised role strings, require roles outside a known-engineering exclusion list, or accept any non-blank named entry regardless of role.

**Options considered:**

1. **Explicit allowlist** — only entries matching a fixed set of role strings (e.g. "Product Manager", "Business Analyst", "Business Lead", "Sponsor", "Domain Expert") pass H-GOV. Any entry not matching the list fails. Pro: precise governance signal. Con: high maintenance burden; brittle against role title variation across organisations (e.g. "Product Lead" vs "Product Manager"); creates false negatives for valid approvers with non-standard titles; requires ongoing ADR amendments as the organisation evolves.

2. **Engineering exclusion list** — entries that match a known-engineering title pattern (e.g. "Engineer", "Developer", "Architect", "QA", "Tech Lead", "DevOps") fail H-GOV; anything else passes. Pro: blocks the obvious gaming vector (engineer self-approving). Con: still brittle against title variation; exclusion lists have edge cases (e.g. "Solutions Architect" is engineering, "Business Architect" may not be); adds complexity for marginal gain.

3. **Presence-only check (chosen)** — H-GOV checks that `## Approved By` contains at least one non-blank named entry. No role string validation. Pass condition: section exists AND has ≥1 non-empty line. Fail conditions: section absent, section empty, section has only engineering-role entries are distinguished by AC3, AC2, and AC4 respectively via the text of the entries (not a role allowlist).

**Decision:** Option 3 — presence-only check with no role-string validation. H-GOV PASS requires `## Approved By` to contain at least one non-blank line. The governance value is social accountability (a named person attested to the discovery outside the engineering team), not technical enforcement of a role taxonomy. Role governance is an organisational process concern, not a pipeline schema concern.

**Primary reason:** Flexibility and maintainability. Role titles vary significantly across organisations and team structures. An allowlist or exclusion list would require ongoing maintenance and would produce false negatives for legitimate approvers. Presence-only is sufficient for the MVP governance signal — the act of a named stakeholder adding their name to the artefact is the attestation.

**Authoritative implementation rule for p11.3:** H-GOV implementation must check: (1) does `## Approved By` section exist in the discovery artefact? (2) does it contain at least one non-blank line? If both conditions are true: PASS. AC4 ("engineer-only entries") is satisfied by the presence check alone — if a named person has approved, H-GOV passes regardless of their role title. The AC4 test verifies that H-GOV fires when the *section is absent or empty*, not that it can detect engineer vs non-engineer roles from a title string.

**Consequences:**
- Easier: H-GOV is implementable with a simple file read + section content check. No role list to maintain.
- Harder/constrained: H-GOV cannot distinguish "signed off by a Product Manager" from "signed off by an Engineer who filled in their own name". This is a known limitation accepted for MVP.
- Off the table (for p11.3): role-string validation, engineering exclusion logic, section-level attribution enforcement.
- Post-MVP enhancement path: if stricter role validation is needed, a future story can add role detection on top of the presence check. That story would supersede this ADR with a new ADR documenting the authoritative role list.

**Revisit trigger:** A future feature requires verifiable non-engineering approval (e.g. compliance requirement, audit finding, M3 baseline shows H-GOV is being gamed by engineers self-approving). At that point, revisit Option 1 or 2 with an explicit role taxonomy decision.
