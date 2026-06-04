# DoR Scope Contract: iwu.6 — Add assumption card marker emission instructions to ideate/SKILL.md

**Story:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.6.md
**DoR:** artefacts/2026-05-21-ideate-web-ux/dor/iwu.6-dor.md
**Date:** 2026-06-04
**Oversight: HIGH — governed file, PR review required**

---

## Required file touchpoints

### Files to READ before implementing (mandatory context)

| File | Reason |
|------|--------|
| `.github/skills/ideate/SKILL.md` | The file to be modified — read in full; understand existing output formatting section and instruction style before adding |
| `src/web-ui/routes/skills.js` | Locate session initialisation block where `assumptionCardsEnabled` default is to be set |
| `.github/architecture-guardrails.md` | Mandatory pre-implementation read; platform change policy |
| `artefacts/2026-05-21-ideate-web-ux/stories/iwu.6.md` | ACs, ADR-018 marker format, AssumptionCardsEnabled default spec |
| `artefacts/2026-05-21-ideate-web-ux/test-plans/iwu.6-test-plan.md` | Test specification |
| `artefacts/2026-05-21-ideate-web-ux/verification/iwu.6-emission-verification.md` | DoD entry condition stub — read to understand what evidence is required before DoD |

### Files to CREATE

| File | Contents |
|------|----------|
| `tests/check-iwu6-skillmd.js` | Governance test — unit tests for AC1 (marker format in instruction text), AC2 (synthetic confidence check, non-binding), AC4 (assumptionCardsEnabled default) |

### Files to MODIFY

| File | Change |
|------|--------|
| `.github/skills/ideate/SKILL.md` | Add assumption card marker emission instruction to the output formatting section. Must include exact ADR-018 marker format and the fields: id, text, type (claim/risk/dependency/unknown), risk (low/medium/high), knowness (known-unknown/unknown-unknown). Do not remove or restructure existing content. |
| `src/web-ui/routes/skills.js` | In the session initialisation block for the ideate skill (in `handleGetChatHtml` or equivalent), set `assumptionCardsEnabled: true` as the default field value on the session object. |
| `package.json` | Add `node tests/check-iwu6-skillmd.js` to the `test` script chain |

### Files that MUST NOT be touched

| File | Reason |
|------|--------|
| Any other file under `.github/skills/` | Only ideate/SKILL.md is in scope |
| `src/web-ui/views/chat-view.js` | Card rendering changes are iwu.3 scope |
| Any file under `artefacts/` | Read-only pipeline artefacts (emission verification stub may be READ; do not write to it — that is a human-completed gate) |
| The confirm/flag endpoint or nudge bar logic | iwu.4/iwu.5 scope |

---

## Governed file constraint

**MANDATORY:** `.github/skills/ideate/SKILL.md` changes require a PR reviewed by the platform operator (Hamish King) before merge. Coding agent must open a draft PR and add a PR comment requesting review. Do not auto-merge. Do not mark ready for review.

If a skills lockfile or hash exists at `.github/skills/skill-lockfile.json` or similar: check whether the lockfile needs to be updated after modifying SKILL.md. If yes, flag in PR comment — do not update the lockfile unilaterally.

---

## DoD entry condition (human-in-loop gate — not closeable by CI)

| Condition | Status at DoR sign-off | Responsible party |
|-----------|----------------------|-------------------|
| AC3: Real multi-turn session (≥6 turns before Lens B) with ≥70% marker emission rate | Stub exists; NOT YET COMPLETED | Hamish King — must complete after iwu.3/iwu.4/iwu.5 merge |
| Emission verification stub signed | NOT YET SIGNED | Hamish King |

The coding agent must include a PR comment: "AC3 (iwu.6) is a human-in-loop DoD gate. This PR cannot move to DoD until the emission verification stub at artefacts/2026-05-21-ideate-web-ux/verification/iwu.6-emission-verification.md is completed with real session data (pass_fail: PASS) and signed by the platform operator."

---

## AC verification summary

| AC | Automated | Manual | Gap |
|----|-----------|--------|-----|
| AC1 | ✅ 1 unit (marker format exact match in SKILL.md instruction text) | — | — |
| AC2 | ✅ 1 synthetic unit (confidence check — NOT a binding CI gate; model output is non-deterministic) | — | Probabilistic — acknowledged |
| AC3 | ❌ Cannot be automated | ✅ Human-in-loop DoD gate | Real session ≥6 turns, ≥70% emission — DoD entry condition |
| AC4 | ✅ 1 unit (assumptionCardsEnabled: true default in session init) | — | — |
