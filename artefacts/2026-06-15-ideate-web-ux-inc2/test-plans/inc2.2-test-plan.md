# Test Plan: inc2.2 — SKILL.md condition marker instruction

**Story:** inc2.2
**Feature:** 2026-06-15-ideate-web-ux-inc2
**Test file:** `tests/check-inc2.2-condition-marker-instruction.js`
**Date:** 2026-06-15

---

## AC Coverage

| AC | Tests | Coverage |
|----|-------|---------|
| AC1 — Instruction present in SKILL.md | T1 | ✅ Full |
| AC2 — All four required fields documented | T2 | ✅ Full |
| AC3 — Type semantics defined | T3 | ✅ Full |
| AC4 — Concrete example included | T4 | ✅ Full |
| AC5 — When to emit specified | T5 | ✅ Full |
| AC6 — Human-in-the-loop verification | Manual (live session) | ⚠️ Pre-acknowledged manual gap |

---

## Test Specifications

**T1 — SKILL.md contains CONDITION-JSON instruction section**
- Read `.github/skills/ideate/SKILL.md`
- Assert: file content contains the string `---CONDITION-JSON:`

**T2 — Instruction documents all four required fields**
- Read `.github/skills/ideate/SKILL.md`
- Assert: content contains `"id"`, `"text"`, `"type"`, `"source"` within the condition section

**T3 — Type semantics defined (all three type values named)**
- Read `.github/skills/ideate/SKILL.md`
- Assert: content contains `constraint`, `dependency`, and `outcome` in the condition section

**T4 — Concrete example present**
- Read `.github/skills/ideate/SKILL.md`
- Assert: a complete `---CONDITION-JSON: {...}---` block with all four fields populated exists in the file (regex: `/---CONDITION-JSON:\s*\{[^}]*"id"[^}]*"text"[^}]*"type"[^}]*"source"[^}]*\}---/`)

**T5 — "When to emit" guidance present**
- Read `.github/skills/ideate/SKILL.md`
- Assert: content in the condition section contains at least one of: "when to emit", "emit when", "at the point", "when you identify" (case-insensitive)

---

## Pre-Acknowledged Manual Gap

**AC6 — Emission verification:** Requires a real /ideate session of ≥4 turns post-merge. Not feasible in the Node.js automated test environment. Same acknowledged gap as iwu.6 AC2/AC3. Risk: Low — the SKILL.md instruction pattern is proven (iwu.6 produced consistent `---ASSUMPTION-JSON---` emission). Verification artefact written at `artefacts/2026-06-15-ideate-web-ux-inc2/verification/inc2.2-emission-verification.md` by operator after a live session.

**Risk acceptance:** Hamish King, 2026-06-15. DoD entry condition: verification artefact must be present and signed off before inc2.2 can be marked definition-of-done.

---

## Test Data

All tests read the actual SKILL.md file from the working tree. No mocks. Tests are pass/fail on file content — same approach as `check-iwu6-skillmd.js`.
