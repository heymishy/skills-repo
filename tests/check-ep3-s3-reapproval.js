'use strict';
process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
delete process.env.POSTHOG_KEY;
delete process.env.DATABASE_URL;

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const JOURNEY_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
const JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
const REPO_ROOT_ADAPTER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/repo-root.js');

function freshRequire() {
  try { delete require.cache[require.resolve(JOURNEY_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(JOURNEY_STORE_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(REPO_ROOT_ADAPTER_PATH)]; } catch (_) {}
  return { jStore: require(JOURNEY_STORE_PATH), j: require(JOURNEY_PATH) };
}

function makeRes() {
  const res = { _code: null, _body: '', _headers: {} };
  res.writeHead = function(code, headers) { res._code = code; Object.assign(res._headers, headers || {}); };
  res.end = function(body) { res._body += (body || ''); };
  return res;
}

const CSRF_TOKEN = 'csrf-tok-ep3s3';

function makeReq(overrides) {
  return Object.assign({
    session: { accessToken: 'tok', login: 'susan', tenantId: 'tenant-a', csrfToken: CSRF_TOKEN },
    params: {},
    body: { _csrf: CSRF_TOKEN },
    headers: {}
  }, overrides);
}

function lastEntryTitle(content) {
  const entries = content.split(/\n## /).slice(1);
  return entries[entries.length - 1].split('\n')[0].trim();
}

var passed = 0, failed = 0;
function check(label, ok) { if (ok) { console.log('  [PASS] ' + label); passed++; } else { console.error('  [FAIL] ' + label); failed++; } }

async function main() {
  // --- Scenario A: first-time approval (control case -- must NOT be marked as a re-approval) ---
  {
    const r = freshRequire();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ep3-s3-test-'));
    r.j.setRepoRoot(tmpDir);
    const featureSlug = 'ep3s3-first-approval';
    const j = r.jStore.createJourney(featureSlug, 'default');
    r.jStore.setJourneyFields(j.journeyId, { activeSkill: 'definition', tenantId: 'tenant-a', ownerId: 'susan' });

    const res = makeRes();
    await r.j.handlePostJourneyApprove(makeReq({
      params: { journeyId: j.journeyId },
      body: { _csrf: CSRF_TOKEN, reason: 'Definition looks complete and matches the benefit-metric target.' }
    }), res, null);
    check('Scenario A: handler returns 200', res._code === 200);

    const decisionsPath = path.join(tmpDir, 'artefacts', featureSlug, 'decisions.md');
    const content = fs.readFileSync(decisionsPath, 'utf8');
    const title = lastEntryTitle(content);
    check('Scenario A: first-time approval title has NO "re-approved" marker (control case)', title.indexOf('re-approved') === -1);
    check('Scenario A: first-time approval title uses the plain "approved by" wording', title.indexOf('definition approved by susan') === 0);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // --- Scenario B: real regress -> re-approve cycle ---
  {
    const r = freshRequire();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ep3-s3-test-'));
    r.j.setRepoRoot(tmpDir);
    const featureSlug = 'ep3s3-reapproval-cycle';
    const j = r.jStore.createJourney(featureSlug, 'default');

    // Step 1: seed the ORIGINAL approval (as if it happened in a real prior session)
    r.jStore.completeStage(j.journeyId, 'discovery', 'artefacts/' + featureSlug + '/discovery.md');
    r.jStore.completeStage(j.journeyId, 'benefit-metric', 'artefacts/' + featureSlug + '/benefit-metric.md');
    r.jStore.completeStage(j.journeyId, 'definition', 'artefacts/' + featureSlug + '/definition.md');
    r.jStore.setJourneyFields(j.journeyId, { activeSkill: 'review', tenantId: 'tenant-a', ownerId: 'susan' });
    const decisionsPath = path.join(tmpDir, 'artefacts', featureSlug, 'decisions.md');
    fs.mkdirSync(path.dirname(decisionsPath), { recursive: true });
    fs.writeFileSync(decisionsPath, '# Decisions — ' + featureSlug + '\n\n## definition approved by susan (engineer)\n\n**Date:** 2026-09-20\n**Context:** Approval recorded via Sign Off at the definition stage of feature ' + featureSlug + '.\n**Decision:** definition approved and advancing to review.\n**Rationale:** Original approval, pre-regression.\n', 'utf8');

    // Step 2: REAL regression back to definition (calls the actual ep3-s1 handler)
    const regressRes = makeRes();
    await r.j.handlePostJourneyRegress(makeReq({
      params: { journeyId: j.journeyId },
      body: { _csrf: CSRF_TOKEN, targetStage: 'definition', reason: 'Definition needs revision for multi-tenancy.' }
    }), regressRes, null);
    check('Scenario B: regression returns 200', regressRes._code === 200);
    check('Scenario B: activeSkill reset to definition by the real regression handler', r.jStore.getJourney(j.journeyId).activeSkill === 'definition');

    // Step 3: REAL re-approval of definition (this is the behavior under test)
    const approveRes = makeRes();
    await r.j.handlePostJourneyApprove(makeReq({
      params: { journeyId: j.journeyId },
      body: { _csrf: CSRF_TOKEN, reason: 'Revised for multi-tenancy, re-approving.' }
    }), approveRes, null);
    check('Scenario B: re-approval returns 200', approveRes._code === 200);

    const finalContent = fs.readFileSync(decisionsPath, 'utf8');
    const entries = finalContent.split(/\n## /).slice(1);
    check('Scenario B: decisions.md now has 3 entries (original approval + regression + re-approval)', entries.length === 3);
    const reapprovalEntry = entries[entries.length - 1];
    const reapprovalTitle = reapprovalEntry.split('\n')[0].trim();
    check('AC1/AC3 substance: re-approval entry is distinctly titled ("re-approved", not plain "approved")', reapprovalTitle.indexOf('definition re-approved by susan') === 0);
    check('AC1 substance: re-approval entry\'s context references the prior regression (decisions.md-native equivalent of reApprovalOf linking)', /regression/i.test(reapprovalEntry));
    check('AC3: original approval entry (entries[0]) is untouched', entries[0].indexOf('definition approved by susan') === 0 && entries[0].indexOf('Original approval, pre-regression.') !== -1);
    check('AC3: regression entry (entries[1]) is untouched and distinct from the re-approval entry', entries[1].indexOf('Regressed to definition by susan') === 0);

    // AC2 substance (no new code needed -- verified here only that this story's OWN
    // change doesn't disturb journey state; handlePostGateConfirm's own pre-existing,
    // already-tested mechanics are what actually performs the stage advance and are
    // deliberately NOT re-tested here, matching ep2-s3's own established precedent of
    // not re-covering handlePostGateConfirm's own already-covered ground).
    const journeyAfter = r.jStore.getJourney(j.journeyId);
    check('AC2 substance: handlePostJourneyApprove does not itself mutate completedStages/activeSkill (matches its own documented "does not advance the stage itself" contract, identical for first-time and re-approval)', journeyAfter.activeSkill === 'definition' && !journeyAfter.completedStages.some(function(cs) { return cs.skillName === 'definition'; }));

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  console.log('\n[ep3-s3-reapproval] ' + (passed + failed) + ' run, ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
}

main().catch(function(err) { console.error('FAIL (crash):', err); process.exitCode = 1; });
