# Design: End-to-End Web UI to DoR Proof

**Feature slug:** 2026-09-15-e2e-web-ui-to-dor-proof
**Design start:** 2026-09-15
**Status:** Complete

---

## Problem / opportunity

Verify that the wsd/wsap pipeline-state and artefact-path fixes compose correctly end-to-end through the web UI outer loop (discovery → benefit-metric → definition → review → test-plan → DoR).

**Personas:** Hamish King — Operator
**MVP scope boundary:** Single end-to-end run, 2 minimal stories, no real product functionality
**Benefit targets:** 6/6 stage commits on GitHub, correct `pipeline-state.json` fields, correct per-story artefact paths

---

## Solution architecture

**Overview:**
This is a verification feature with no real architectural changes. The design is purely the flow of artefacts through the web UI's existing commit mechanism at each stage boundary. No new services, no new data structures, no new routes beyond what already exists.

**Integration points:**
- GitHub Copilot Chat API (existing, used for skill execution)
- GitHub Contents API via OAuth token (existing, used for artefact write-back)
- Local `pipeline-state.json` state file (existing)
- Web UI routes: `/api/skills/:name/sessions` (existing), `/api/skills/:name/sessions/:id/commit` (existing)

**Data and state:**
No new data is created. The verification reads and writes the same artefacts and state that any real feature would: discovery.md, benefit-metric.md, definition.md, stories, test-plans, review.md, DoR artefacts, and `pipeline-state.json` stage/dorStatus fields.

**Hosting / runtime:**
Existing local Node.js web UI server (`src/web-ui/server.js`). No new runtime required.

**Key build decisions:**
None. This feature uses only existing infrastructure.

**Non-functional requirements:**
None beyond what the pipeline already enforces: artefacts must commit successfully to GitHub, `pipeline-state.json` must be valid JSON, stage boundaries must advance correctly.

---

## UX / interaction design

**Entry point:**
Operator logs in to the web UI and selects the `/discovery` skill for this feature slug from the skill picker.

**Primary flow:**
1. Operator runs `/discovery` skill via web UI → produces discovery.md → commits to GitHub → stage advances
2. Operator runs `/benefit-metric` skill → produces benefit-metric.md → commits to GitHub → stage advances
3. Operator runs `/definition` skill → produces definition.md with 2 minimal stories → commits to GitHub → stage advances
4. Operator runs `/review` skill → produces review.md → commits to GitHub → stage advances
5. Operator runs `/test-plan` skill → produces test-plans for both stories → commits to GitHub → stage advances
6. Operator runs `/definition-of-ready` skill → produces DoR for both stories → commits to GitHub → stage advances to DoR with dorStatus: signed-off

**Edge cases / error states:**
None anticipated. This is a minimal, linear flow with no conditional branches.

**Design system / components:**
All existing web UI components. No new patterns introduced.

**Accessibility:**
Not applicable — this is a verification feature with no user-facing UI beyond the existing web UI.

---

## Decisions and open questions

**Decision:** This feature produces no product code, no new routes, no new UI changes. It is purely artefacts and pipeline state.

**Decision:** Scope is fixed at 2 stories, 6 stage boundaries. No expansion.

**Assumption:** All wsd/wsap fixes are merged to master before this run begins.

**Open question resolved:** The verification flow is linear and deterministic — no open design questions remain.

---