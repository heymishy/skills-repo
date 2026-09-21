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
const EventEmitter = require('events').EventEmitter;

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

const CSRF_TOKEN = 'csrf-tok-ep3s1';

function makeReq(overrides) {
  return Object.assign({
    session: { accessToken: 'tok', login: 'susan', tenantId: 'tenant-a', csrfToken: CSRF_TOKEN },
    params: {},
    body: { _csrf: CSRF_TOKEN },
    headers: {}
  }, overrides);
}

function fixtureJourney(r, featureSlug) {
  const j = r.jStore.createJourney(featureSlug, 'default');
  r.jStore.completeStage(j.journeyId, 'discovery', 'artefacts/' + featureSlug + '/discovery.md');
  r.jStore.completeStage(j.journeyId, 'benefit-metric', 'artefacts/' + featureSlug + '/benefit-metric.md');
  r.jStore.completeStage(j.journeyId, 'definition', 'artefacts/' + featureSlug + '/definition.md');
  r.jStore.completeStage(j.journeyId, 'review', 'artefacts/' + featureSlug + '/review.md');
  r.jStore.setJourneyFields(j.journeyId, { activeSkill: 'test-plan', tenantId: 'tenant-a', ownerId: 'susan' });
  return j.journeyId;
}

var passed = 0, failed = 0;
function check(label, ok) { if (ok) { console.log('  [PASS] ' + label); passed++; } else { console.error('  [FAIL] ' + label); failed++; } }

async function main() {
  check('handlePostJourneyRegress is exported', typeof require(JOURNEY_PATH).handlePostJourneyRegress === 'function');

  // --- AC1: reject a targetStage that is NOT earlier than the current stage ---
  {
    const r = freshRequire();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ep3-s1-test-'));
    r.j.setRepoRoot(tmpDir);
    const journeyId = fixtureJourney(r, 'ep3s1-not-earlier');
    const res = makeRes();
    await r.j.handlePostJourneyRegress(makeReq({ params: { journeyId: journeyId }, body: { _csrf: CSRF_TOKEN, targetStage: 'test-plan', reason: 'not actually earlier' } }), res, null);
    check('AC1: regressing to the CURRENT stage is rejected with 400', res._code === 400);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // --- AC1: reject an empty reason ---
  {
    const r = freshRequire();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ep3-s1-test-'));
    r.j.setRepoRoot(tmpDir);
    const journeyId = fixtureJourney(r, 'ep3s1-empty-reason');
    const res = makeRes();
    await r.j.handlePostJourneyRegress(makeReq({ params: { journeyId: journeyId }, body: { _csrf: CSRF_TOKEN, targetStage: 'definition', reason: '' } }), res, null);
    check('AC1: empty reason is rejected with 400', res._code === 400);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // --- AC1/AC2: a valid regression succeeds and resets state ---
  {
    const r = freshRequire();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ep3-s1-test-'));
    r.j.setRepoRoot(tmpDir);
    const featureSlug = 'ep3s1-valid-regress';
    const journeyId = fixtureJourney(r, featureSlug);
    const res = makeRes();
    await r.j.handlePostJourneyRegress(makeReq({ params: { journeyId: journeyId }, body: { _csrf: CSRF_TOKEN, targetStage: 'definition', reason: 'Architecture constraint needs revision.' } }), res, null);
    check('AC1/AC2: valid regression returns 200', res._code === 200);
    const after = r.jStore.getJourney(journeyId);
    check('AC2: activeSkill reset to targetStage', after.activeSkill === 'definition');
    const remaining = after.completedStages.map(function(cs) { return cs.skillName; });
    check('AC2: downstream stages (definition, review) removed from completedStages', remaining.indexOf('definition') === -1 && remaining.indexOf('review') === -1);
    check('AC2: stages before targetStage (discovery, benefit-metric) are untouched', remaining.indexOf('discovery') !== -1 && remaining.indexOf('benefit-metric') !== -1);

    // --- AC3: decisions.md -- prior content preserved, new entry appended ---
    const decisionsPath = path.join(tmpDir, 'artefacts', featureSlug, 'decisions.md');
    const priorContent = fs.readFileSync(decisionsPath, 'utf8');
    check('AC3: a regression entry was appended to decisions.md', priorContent.indexOf('Regressed to definition by susan') !== -1);

    // Seed a SECOND regression on the same feature slug to prove the FIRST entry survives untouched.
    r.jStore.completeStage(journeyId, 'definition', 'artefacts/' + featureSlug + '/definition.md');
    r.jStore.completeStage(journeyId, 'review', 'artefacts/' + featureSlug + '/review.md');
    r.jStore.setJourneyFields(journeyId, { activeSkill: 'test-plan' });
    const res2 = makeRes();
    await r.j.handlePostJourneyRegress(makeReq({ params: { journeyId: journeyId }, body: { _csrf: CSRF_TOKEN, targetStage: 'definition', reason: 'Second regression, same feature slug, to test decisions.md preservation.' } }), res2, null);
    check('AC3: second regression also returns 200', res2._code === 200);
    const afterContent = fs.readFileSync(decisionsPath, 'utf8');
    check('AC3: prior decisions.md content is an exact untouched prefix of the new content', afterContent.indexOf(priorContent) === 0);
    check('AC3: a new regression entry was appended (file grew)', afterContent.length > priorContent.length);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // --- Tenant isolation ---
  {
    const r = freshRequire();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ep3-s1-test-'));
    r.j.setRepoRoot(tmpDir);
    const journeyId = fixtureJourney(r, 'ep3s1-tenant-b');
    r.jStore.setJourneyFields(journeyId, { tenantId: 'tenant-b', ownerId: 'mallory' });
    const res = makeRes();
    await r.j.handlePostJourneyRegress(makeReq({
      session: { accessToken: 'tok', login: 'susan', tenantId: 'tenant-a', csrfToken: CSRF_TOKEN },
      params: { journeyId: journeyId },
      body: { _csrf: CSRF_TOKEN, targetStage: 'definition', reason: 'cross-tenant attempt' }
    }), res, null);
    check('Tenant isolation: cross-tenant regression request is rejected (not 200)', res._code !== 200);
    const after = r.jStore.getJourney(journeyId);
    check('Tenant isolation: cross-tenant journey state is untouched', after.activeSkill === 'test-plan');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // --- Wiring + viewer-gate proof: dispatch through the REAL exported router ---
  {
    const router = require('../src/web-ui/server').router;
    const seedTestSession = require('../src/web-ui/middleware/session').seedTestSession;

    function integrationMockRes() {
      var _statusCode = null, _headers = {}, _chunks = [];
      return {
        writeHead: function(c, h) { _statusCode = c; Object.assign(_headers, h || {}); return this; },
        setHeader: function(k, v) { _headers[k] = v; },
        end: function(b) { if (b != null) _chunks.push(b); },
        _get: function() { return { statusCode: _statusCode, headers: _headers, body: _chunks.join('') }; }
      };
    }
    function dispatchAndAwaitResponse(req) {
      return new Promise(function(resolve, reject) {
        var res = integrationMockRes();
        var settled = false;
        var origEnd = res.end;
        res.end = function(b) { origEnd(b); if (!settled) { settled = true; resolve(res._get()); } };
        router(req, res).catch(function(err) { if (!settled) { settled = true; reject(err); } });
      });
    }

    var sessionId = 'ep3s1-viewer-gate-sid';
    seedTestSession(sessionId, { accessToken: 'e2e-test-access-token', userId: 9003, login: 'ep3s1-viewer', tenantId: 'ep3s1-viewer-org' });
    var req = { headers: { cookie: 'session_id=' + sessionId }, method: 'POST', url: '/api/journey/does-not-matter/regress' };
    var result = await dispatchAndAwaitResponse(req);
    check('Wiring: POST /api/journey/:id/regress is reachable through the real router (not 404)', result.statusCode !== 404);
  }

  console.log('\n[ep3-s1-integration] ' + (passed + failed) + ' run, ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exitCode = 1;
}

main().catch(function(err) { console.error('FAIL (crash):', err); process.exitCode = 1; });
