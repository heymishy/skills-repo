# Governance Delivery Patterns

**Status:** Active
**Owned by:** Platform team
**Source:** GPA feature delivery (2026-05-24-governance-platform-architecture), extracted via /improve

These patterns are established from delivery experience. Follow them when planning or implementing governance-touching features.

---

## Wave-Gate Delivery Pattern (A1)

**Context:** A feature that spans multiple stories touching two or more high-churn shared files (e.g. `governance-package.js` and `run-assurance-gate.js`).

**Problem:** Without explicit ordering, stories that touch the same files create cascading rebase conflicts. A "unify" or "consolidate" story that depends on upstream foundation being stable will require multiple rebases if upstream is still being merged.

**Pattern:** Structure the feature into three explicit waves with a gate between each:

1. **Wave 1 — Documents/Foundation:** Write standards documents, trace contracts, and architectural patterns. These stories modify no shared logic files and can be parallelised freely.
2. **Wave 2 — CI wiring:** Wire CI checks, validate gates, and establish enforcement. These stories modify workflows and check scripts but do not consolidate logic.
3. **Wave 3 — Unification/consolidation:** Consolidate verdict logic, replace inline implementations with shared modules, enforce ADR compliance. These stories gate on Wave 2 stories being `stage: definition-of-done`.

**How to express this in the DoR:** The Wave 3 story's DoR hard-block H6 (dependency check) must name each Wave 2 story's `dorStatus: signed-off` as a prerequisite. Example:

> H6 dependency: gpa-sc-07, gpa-sc-03, gpa-sc-06 must all be `stage: definition-of-done` before SC-02 is dispatched.

**Why it works:** Wave gates ensure the shared files are stable before the unification story opens its branch. No rebase conflicts on the merge because all upstream stories have already been merged to master.

---

## Inline JS Extraction Pattern (A4)

**Context:** A GitHub Actions workflow contains a `github-script` inline JS block that implements non-trivial logic (audit comments, slug extraction, story crosschecks, path guards).

**Problem:** Inline `github-script` JS is untested. Tests can only grep the YAML for string presence — they cannot exercise the JS logic, catch variable ordering bugs, or cover regex edge cases. Any logic inside a `github-script` block is a blind spot.

**Pattern:** Extract the inline JS to a `scripts/` module:

1. Create `scripts/<name>.js` that exports the function: `module.exports = { buildComment, extractPRSlug, ... }`
2. In the workflow, call the module via a `run:` step: `node -e "require('./scripts/<name>').myFn(inputs)"`
3. Write unit tests that import and exercise the module directly with fixture data.

**What the test suite should cover:**
- Happy path with a real-looking fixture
- Edge cases (empty input, glob paths, backtick-wrapped paths, table cells)
- The function loads without syntax errors

**Source:** SC-07 (gpa-sc-07-inline-js-extraction). Established in `standards/governance/trace-contract.md` P08.

---

## Documents-First Wave Ordering for Governance Features (C1)

**Canonical ordering:** When a feature introduces both documentation (standards, ADRs, trace contracts) and enforcement (CI gates, schema validation, verdict logic), always deliver in this order:

1. Standards documents and design principles → `standards/governance/`
2. CI enforcement and gate wiring
3. ADR compliance and consolidated verdict logic

**Rationale:** The standards documents are the specification that CI enforcement checks against. Delivering CI before the standards means the CI is checking an undocumented contract — any gap found in CI review cannot be cross-referenced to a written principle. The inverse risk: delivering standards without CI means the standard is advisory only and will drift.

**This ordering is mandatory for governance-touching features.** It is the delivery expression of PRINCIPLE-01 (pure function enforcement surface) — the pure function must be specified before it is enforced.

**Applies to:** Any feature in which one or more stories write to `standards/`, `standards/governance/`, `.github/architecture-guardrails.md`, or any file that defines what the CI gate checks.

---

## Epic-Nested Story State Bookkeeping (B2/D1)

**HARD RULE: NEVER run `bin/skills advance` for epic-nested story state updates on a feature branch. Always apply state advances on master after the PR merges.**

**Why this is a hard rule:** When a feature uses epics (`feature.epics[].stories[]` rather than flat `feature.stories[]`), the `bin/skills advance` harness correctly modifies the epic-nested story in the in-memory state object. However, if the PR is merged and the merge resolution uses the branch version of `pipeline-state.json` (which can happen when master has advanced since the branch was last rebased), the advances applied on the branch are silently reverted.

**The failure mode:**
1. Branch: run `advance` for SC-01/04/05 → pipeline-state.json updated on branch
2. PR opened → master advances again (other story merges)
3. PR merged → merge resolution uses branch's pipeline-state.json (older)
4. On master: SC-01/04/05 state reverted to `definition-of-ready / prStatus: none`
5. Advance for SC-02 (the story being merged) is run on master → SC-01/04/05 changes not included

**Correct procedure for epic-nested story state:**

```
# 1. Merge the PR normally
# 2. Pull master
git pull origin master

# 3. Apply advances for ALL stories being bookmarked as merged
node bin/skills advance <feature-slug> <story-id> prStatus=merged stage=definition-of-done

# 4. Validate + commit directly on master
python -c "import json,jsonschema; ..."  # 0 errors
git add .github/pipeline-state.json
git commit -m "chore: <story-id> prStatus=merged stage=definition-of-done"
git push origin master
```

**Diagnosis check:** If stories show `stage: definition-of-ready, prStatus: none` after their PRs have merged, run the above procedure. The DoD observation for this pattern: "Epic-nested story state persistence gap — advance on branch, reverted at merge."

**See also:** `copilot-instructions.md` cdg.6 rule; the `bin/skills advance` harness searches epic-nested stories correctly — the failure is in the timing of when the advance is applied, not in the harness itself.
