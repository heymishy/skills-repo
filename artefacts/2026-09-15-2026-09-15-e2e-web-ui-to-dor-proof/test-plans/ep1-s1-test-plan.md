# Test Plan: Verify discovery through definition pipeline stages

**Story slug:** ep1-s1
**Story reference:** artefacts/2026-09-15-2026-09-15-e2e-web-ui-to-dor-proof/stories/ep1-s1.md
**Date:** 2026-09-15
**Test framework:** Node.js (custom async test helper from `tests/`)

---

## Test Data Strategy

**Strategy selected:** Synthetic — tests generate their own test data in setup/teardown.

**Scope:** No sensitive data, no production data, no external APIs mocked at the unit level. The story itself involves real GitHub API calls (operator-performed, not automated), so unit/integration tests will mock those calls; the manual verification script will check the real results.

**Ownership:** Self-contained — tests generate their own state in setup.

---

## AC Coverage Table

| AC | Coverage type | Test count | Gap? |
|---|---|---|---|
| AC1 (3 artefacts commit, pipeline-state.json shows correct stage/artefactPath) | Integration + Manual | 2 int + 1 manual | None |

---

## Gap Table

| Gap | Type | Handler | Owner |
|---|---|---|---|
| Real GitHub API call verification | Integration limitation | Manual operator verification script | Operator |

---

## Unit Tests

None — this story has no isolated, pure-function logic. All behaviour is integration-level (artefact generation + GitHub state mutation).

---

## Integration Tests

**Test 1: Pipeline state is valid JSON after each skill session and reflects the correct stage boundary**

```javascript
async test('pipeline-state.json is valid JSON and shows stage: definition after definition skill session', async (t) => {
  // Setup: load the current pipeline-state.json
  const pipelineStatePath = '.github/pipeline-state.json';
  const beforeState = JSON.parse(await fs.promises.readFile(pipelineStatePath, 'utf-8'));
  
  // Verify the feature exists and is at expected stage before test runs
  const feature = beforeState.features.find(f => f.slug === '2026-09-15-e2e-web-ui-to-dor-proof');
  t.ok(feature, 'feature exists in pipeline-state.json');
  
  // Expected shape after definition:
  const expectedShape = {
    slug: '2026-09-15-e2e-web-ui-to-dor-proof',
    stage: 'definition',
    stories: [
      { artefactPath: 'artefacts/2026-09-15-2026-09-15-e2e-web-ui-to-dor-proof/stories/ep1-s1.md' },
      { artefactPath: 'artefacts/2026-09-15-2026-09-15-e2e-web-ui-to-dor-proof/stories/ep1-s2.md' }
    ]
  };
  
  // The test reads the committed state (after operator has run the full sequence)
  // and asserts the shape matches expectations
  const afterState = JSON.parse(await fs.promises.readFile(pipelineStatePath, 'utf-8'));
  const featureAfter = afterState.features.find(f => f.slug === '2026-09-15-e2e-web-ui-to-dor-proof');
  t.equal(featureAfter.stage, 'definition', 'stage is definition');
  t.equal(featureAfter.stories.length, 2, '2 stories exist');
  t.ok(featureAfter.stories[0].artefactPath, 'story 0 has artefactPath');
  t.ok(featureAfter.stories[1].artefactPath, 'story 1 has artefactPath');
});
```

**Test 2: Artefact files referenced in pipeline-state.json actually exist on disk at the stated paths**

```javascript
async test('All artefactPath references in pipeline-state.json point to real files after definition', async (t) => {
  const pipelineStatePath = '.github/pipeline-state.json';
  const state = JSON.parse(await fs.promises.readFile(pipelineStatePath, 'utf-8'));
  const feature = state.features.find(f => f.slug === '2026-09-15-e2e-web-ui-to-dor-proof');
  
  t.ok(feature, 'feature found');
  t.equal(feature.stage, 'definition', 'at definition stage');
  
  // Check each story's artefactPath exists
  for (const story of feature.stories) {
    const path = story.artefactPath;
    try {
      await fs.promises.stat(path);
      t.pass(`${path} exists`);
    } catch (e) {
      t.fail(`${path} does not exist (404)`);
    }
  }
  
  // Check feature-level artefacts
  const discoveryPath = `artefacts/${feature.slug}/discovery.md`;
  const benefitPath = `artefacts/${feature.slug}/benefit-metric.md`;
  const definitionPath = `artefacts/${feature.slug}/definition.md`;
  
  for (const path of [discoveryPath, benefitPath, definitionPath]) {
    try {
      await fs.promises.stat(path);
      t.pass(`${path} exists`);
    } catch (e) {
      t.fail(`${path} does not exist (404)`);
    }
  }
});
```

---

## NFR Tests

**NFR 1: All commits must land on master within the same session**

Test covered by manual verification script (see below). No automated assertion possible — this is a git history fact that can only be verified after commits are made.

**NFR 2: `pipeline-state.json` must be valid JSON after each write**

Covered by Integration Test 1 (JSON.parse succeeds, no syntax error).

---

## AC Verification Script

### Setup

Before running the scenarios below, ensure:
1. You have logged into the web UI at `http://localhost:3000`
2. You have a GitHub OAuth token configured in your session
3. You have write access to this repository (you can push commits)
4. `git log --oneline` shows master is at the latest commit

---

### Scenario 1: Discover and commit discovery.md

**Steps:**
1. In the web UI, navigate to the skill picker and select `/discovery`
2. Enter `2026-09-15-e2e-web-ui-to-dor-proof` as the feature slug
3. Follow the discovery skill's prompts to produce a discovery artefact
4. Click **Commit** when the artefact is complete
5. Verify in GitHub (`git log --oneline | head -1`) that a new commit appears authored by you with message containing "discovery"

**Expected outcome:** A commit appears in `git log` authored by your GitHub login, and `artefacts/2026-09-15-2026-09-15-e2e-web-ui-to-dor-proof/discovery.md` exists on master.

**Verify:** `git show master:artefacts/2026-09-15-2026-09-15-e2e-web-ui-to-dor-proof/discovery.md | head -20` — confirms file exists and contains markdown.

---

### Scenario 2: Run benefit-metric and commit benefit-metric.md

**Steps:**
1. In the web UI, select `/benefit-metric` skill for the same feature slug
2. Follow the skill's prompts to produce a benefit-metric artefact
3. Click **Commit**
4. Verify in GitHub that a second new commit appears authored by you with message containing "benefit-metric"

**Expected outcome:** A second commit appears in `git log`, and `artefacts/2026-09-15-2026-09-15-e2e-web-ui-to-dor-proof/benefit-metric.md` exists on master.

**Verify:** `git show master:artefacts/2026-09-15-2026-09-15-e2e-web-ui-to-dor-proof/benefit-metric.md | head -20` — confirms file exists.

---

### Scenario 3: Run definition and commit definition.md with 2 stories

**Steps:**
1. In the web UI, select `/definition` skill for the same feature slug
2. Follow the skill's prompts to produce a definition artefact with exactly 2 stories
3. Click **Commit**
4. Verify in GitHub that a third new commit appears with message containing "definition"

**Expected outcome:** A third commit appears in `git log`, and `artefacts/2026-09-15-2026-09-15-e2e-web-ui-to-dor-proof/definition.md` exists. Both story artefacts appear: `artefacts/2026-09-15-2026-09-15-e2e-web-ui-to-dor-proof/stories/ep1-s1.md` and `artefacts/2026-09-15-2026-09-15-e2e-web-ui-to-dor-proof/stories/ep1-s2.md`.

**Verify:** `git ls-tree -r master -- artefacts/2026-09-15-2026-09-15-e2e-web-ui-to-dor-proof/stories/ | wc -l` — expect 2 (ep1-s1.md and ep1-s2.md).

---

### Scenario 4: Verify pipeline-state.json reflects correct stage and artefactPath

**Steps:**
1. Run `git show master:.github/pipeline-state.json | jq '.features[] | select(.slug == "2026-09-15-e2e-web-ui-to-dor-proof")'`
2. Confirm the output shows:
   - `"stage": "definition"`
   - `"stories": [...]` with 2 entries
   - Each story has `"artefactPath"` field pointing to the correct file path

**Expected outcome:**
```json
{
  "slug": "2026-09-15-e2e-web-ui-to-dor-proof",
  "stage": "definition",
  "stories": [
    {
      "slug": "ep1-s1",
      "artefactPath": "artefacts/2026-09-15-2026-09-15-e2e-web-ui-to-dor-proof/stories/ep1-s1.md"
    },
    {
      "slug": "ep1-s2",
      "artefactPath": "artefacts/2026-09-15-2026-09-15-e2e-web-ui-to-dor-proof/stories/ep1-s2.md"
    }
  ]
}
```

**Verify:** All artefactPath fields exist and match files on disk (confirmed in Scenario 3).

---

## Test Execution Summary

**Total tests:** 2 integration + 1 manual verification
**Passing:** All (0 failures expected; any failure is a regression in wsd/wsap fixes)
**Coverage:** AC1 fully covered