## Definition of Ready: ccrh-s1 — Replace the landing page's fake illustrative hash with a real, live-computed one

**Story:** artefacts/2026-08-09-crypto-card-real-hash-fix/stories/ccrh-s1-real-instruction-hash.md
**Review artefact:** artefacts/2026-08-09-crypto-card-real-hash-fix/review/ccrh-s1-review-1.md (PASS, 0 HIGH findings)
**Test plan:** artefacts/2026-08-09-crypto-card-real-hash-fix/test-plans/ccrh-s1-test-plan.md
**Date:** 2026-08-09

---

### Scope contract

**Files in scope (exact touchpoints):**
- `src/web-ui/content/instruction-hash.js` (new) — `getInstructionHash()`, computing the real SHA-256 of `skills/review/SKILL.md`, fail-open per AC3.
- `src/web-ui/templates/landing.html` — replace the hardcoded `sha256:e3b0c4... ✓ matches trace` value with a placeholder, and add a short independent-verification invitation line.
- `src/web-ui/routes/public.js` — substitute the new placeholder with `getInstructionHash()`'s real value, same pattern as the existing `<!--LEARNINGS_COUNT-->` substitution.
- `tests/check-ccrh-s1-*.js` (new) — unit tests per the test plan.

**Files explicitly out of scope (must not be touched):**
- `Dockerfile`, `.github/workflows/staging-deploy.yml` — no build-time injection needed; `skills/` is already copied into the deployed image, so the hash is computed live at runtime.
- Any other hero card's markup or content.
- `decisions.md` D3 (static-snapshot convention) — not revisited; this is still a "compute from what's actually there" pattern, not a live database/API query.

### Architecture Constraints

No new architectural decision — this follows the exact same live-computation shape `getLearningsCount()` already established in this codebase, applied to a file that (unlike `workspace/learnings.md`) is genuinely present in every deployed environment, so no build-time-bake tier is needed. No ADR required.

### Human oversight

**Low** — single new small module, one template edit, one route substitution; complexity 1; root cause independently confirmed via direct hash computation before this story was even written.

### Coding Agent Instructions

1. Create `src/web-ui/content/instruction-hash.js`:
   ```javascript
   'use strict';
   var fs = require('fs');
   var path = require('path');
   var crypto = require('crypto');

   function getInstructionHash() {
     try {
       var filePath = path.join(__dirname, '..', '..', '..', 'skills', 'review', 'SKILL.md');
       var raw = fs.readFileSync(filePath);
       return crypto.createHash('sha256').update(raw).digest('hex');
     } catch (e) {
       // skills/ is deployed in every environment today, but fail open
       // rather than crash the landing page if that ever changes.
       return null;
     }
   }

   module.exports = { getInstructionHash: getInstructionHash };
   ```
2. In `landing.html`, replace:
   ```html
   <div class="hero-card-example-row"><span class="hero-card-example-label">Recomputed hash</span><code>sha256:e3b0c4... ✓ matches trace</code></div>
   ```
   with:
   ```html
   <div class="hero-card-example-row"><span class="hero-card-example-label">Live SHA-256</span><code><!--INSTRUCTION_HASH--></code></div>
   ```
   and add a short line beneath the `.hero-card-example` div inviting verification, e.g.:
   ```html
   <p class="hero-card-example-note">Recompute it yourself: <code>sha256sum skills/review/SKILL.md</code></p>
   ```
   with a minimal matching CSS rule for `.hero-card-example-note` (small, muted text, consistent with `.hero-card-text`'s existing style).
3. In `public.js`, import `getInstructionHash` and substitute `<!--INSTRUCTION_HASH-->` with `sha256:' + hash.slice(0, 12) + '...'` when the hash is available, or a safe fallback string (e.g. `'sha256:unavailable'`) when `getInstructionHash()` returns `null` — never let a null value reach the template raw.
4. Write the 3 new unit tests + 1 regression re-run per the test plan.
5. Confirm no other file references the old hardcoded `e3b0c4` string (`grep -rn "e3b0c4"`).

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Review passed (0 HIGH findings)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Low)
- [x] No CSS-layout-dependent AC left unclassified (none — text-content change only)

**PROCEED: Yes**
