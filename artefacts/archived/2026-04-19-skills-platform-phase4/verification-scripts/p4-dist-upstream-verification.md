# Verification Script: p4-dist-upstream

**Story:** Upstream authority configuration from context.yml
**Operator scenarios:** Run after implementation to confirm AC coverage.

---

## Scenario 1 — Valid config → correct URL returned (AC1)

**Setup:** Consumer repo with `.github/context.yml` containing `skills_upstream.repo: "https://github.com/test-org/test-skills.git"`.
**Run:** `node -e "const { getUpstreamUrl } = require('./src/distribution/upstream.js'); const c = require('./.github/context.yml'); console.log(getUpstreamUrl(c));"`
**Expected:** Prints `https://github.com/test-org/test-skills.git`, no hardcoded fallback.

---

## Scenario 2 — Missing config → error before network (AC2)

**Setup:** Consumer repo with `.github/context.yml` that has NO `skills_upstream.repo` field.
**Run:** `node -e "const { getUpstreamUrl } = require('./src/distribution/upstream.js'); try { getUpstreamUrl({}); } catch(e) { console.log(e.message); }"`
**Expected:** Prints exactly `"No upstream source configured — set skills_upstream.repo in .github/context.yml"`.

---

## Scenario 3 — URL change reflected (AC3)

**Setup:** Change `skills_upstream.repo` in context.yml from URL-A to URL-B.
**Run:** Run `skills-repo fetch` (or call module with URL-B config).
**Expected:** Lockfile `upstreamSource` field now equals URL-B, not URL-A.

---

## Scenario 4 — ADR-004 governance check (AC4)

**Run:** `npm test`
**Expected:** The governance check for ADR-004 passes. No test reports a hardcoded `github.com/heymishy` URL in distribution source files.

---

## Scenario 5 — NFR: No speculative network call at config load

**Run:** `node -e "const { loadContextConfig } = require('./src/distribution/upstream.js'); loadContextConfig({ skills_upstream: { repo: 'https://example.com/repo.git' } }); console.log('done');"`
**Expected:** Prints `done` without making any network request. Verify with Wireshark or `strace` if needed, or by reviewing source.
