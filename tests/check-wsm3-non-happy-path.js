'use strict';
// check-wsm3-non-happy-path.js — wsm.3: stage back-navigation and needs-review
// TDD: all tests must FAIL before implementation, PASS after.

var assert = require('assert');
var crypto = require('crypto');
var path = require('path');

var JOURNEY_PATH       = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var SKILLS_PATH        = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');

function freshRequire(p) {
  try { delete require.cache[require.resolve(p)]; } catch (_) {}
  return require(p);
}

function makeRes() {
  var res = { _code: null, _body: '', _headers: {} };
  res.writeHead = function(code, h) { res._code = code; Object.assign(res._headers, h || {}); };
  res.end = function(b) { res._body += (b || ''); };
  return res;
}

function makeReq(opts) {
  return Object.assign({ method: 'GET', headers: {}, body: {}, params: {}, session: {}, url: '/' }, opts || {});
}

var passed = 0;
var failed = 0;
var failures = [];

function test(name, fn) {
  try {
    var r = fn();
    if (r && typeof r.then === 'function') {
      return r.then(
        function() { passed++; console.log('  [PASS]', name); },
        function(err) {
          failed++;
          failures.push({ name, err });
          console.log('  [FAIL]', name, '--', err && err.message || err);
        }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    failed++;
    failures.push({ name, err });
    console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

async function main() {

  // T1 — breadcrumb shows completed stages as navigable, active/future as not
  console.log('\n[wsm3] T1 -- breadcrumb: completed=navigable:true, future=navigable:false');
  {
    var j = freshRequire(JOURNEY_PATH);
    var store = freshRequire(JOURNEY_STORE_PATH);
    j.setJourneyStoreModule(store);
    j.setGetHtmlSession(function() { return { turns: [], done: false }; });

    var jid = store.createJourney('test-t1').journeyId;
    var journey = store.getJourney(jid);
    journey.completedStages = [
      { skillName: 'discovery', artefactPath: 'artefacts/t1/discovery.md', status: 'completed' },
      { skillName: 'benefit-metric', artefactPath: 'artefacts/t1/benefit-metric.md', status: 'completed' }
    ];
    journey.activeSkill = 'definition';

    var req = makeReq({ session: { accessToken: 'tok', login: 'user-A' }, params: { journeyId: jid } });
    var res = makeRes();
    await j.handleGetJourneyState(req, res);

    await test('T1a: response 200', function() {
      assert.strictEqual(res._code, 200, 'Expected 200, got ' + res._code);
    });
    await test('T1b: response has stages array', function() {
      var data = JSON.parse(res._body);
      assert.ok(Array.isArray(data.stages), 'stages array missing from response');
    });
    await test('T1c: discovery is navigable:true', function() {
      var data = JSON.parse(res._body);
      var discovery = data.stages.find(function(s) { return s.stage === 'discovery'; });
      assert.ok(discovery, 'discovery not in stages');
      assert.strictEqual(discovery.navigable, true, 'discovery navigable should be true');
    });
    await test('T1d: benefit-metric is navigable:true', function() {
      var data = JSON.parse(res._body);
      var bm = data.stages.find(function(s) { return s.stage === 'benefit-metric'; });
      assert.ok(bm, 'benefit-metric not in stages');
      assert.strictEqual(bm.navigable, true, 'benefit-metric navigable should be true');
    });
    await test('T1e: definition is navigable:false (current/future)', function() {
      var data = JSON.parse(res._body);
      var def = data.stages.find(function(s) { return s.stage === 'definition'; });
      assert.ok(def, 'definition not in stages');
      assert.strictEqual(def.navigable, false, 'definition navigable should be false');
    });
  }

  // T2 — GET prior stage returns that stage's turns
  console.log('\n[wsm3] T2 -- GET /api/journey/:id/stage/:name → prior stage turns');
  {
    var j = freshRequire(JOURNEY_PATH);
    var store = freshRequire(JOURNEY_STORE_PATH);
    var skills = freshRequire(SKILLS_PATH);
    skills.setSessionStore({ write: function(){}, read: function(){ return null; }, list: function(){ return []; }, loadSessions: function(){} });

    j.setJourneyStoreModule(store);
    j.setGetHtmlSession(function(id) { return skills._getHtmlSession(id); });

    var jid = store.createJourney('test-t2').journeyId;
    var discSid = crypto.randomUUID();
    var bmSid = crypto.randomUUID();
    skills._setHtmlSession(discSid, {
      skillName: 'discovery', journeyId: jid,
      turns: [{ role: 'user', content: 'goal' }, { role: 'assistant', content: 'got it' }],
      done: true, artefactContent: 'disc artefact', artefactPath: 'artefacts/t2/discovery.md'
    });
    skills._setHtmlSession(bmSid, {
      skillName: 'benefit-metric', journeyId: jid,
      turns: [{ role: 'assistant', content: 'metric?' }],
      done: true
    });
    var journey = store.getJourney(jid);
    journey.completedStages = [
      { skillName: 'discovery', artefactPath: 'artefacts/t2/discovery.md', sessionId: discSid, status: 'completed' },
      { skillName: 'benefit-metric', artefactPath: 'artefacts/t2/bm.md', sessionId: bmSid, status: 'completed' }
    ];
    journey.activeSkill = 'definition';

    await test('T2a: handleGetJourneyStage exported', function() {
      assert.strictEqual(typeof j.handleGetJourneyStage, 'function', 'handleGetJourneyStage not exported');
    });

    if (typeof j.handleGetJourneyStage === 'function') {
      var req = makeReq({ session: { accessToken: 'tok', login: 'user-A' }, params: { journeyId: jid, stageName: 'discovery' } });
      var res = makeRes();
      await j.handleGetJourneyStage(req, res);

      await test('T2b: returns 200', function() {
        assert.strictEqual(res._code, 200, 'Expected 200, got ' + res._code);
      });
      await test('T2c: returns 2 turns for discovery', function() {
        var data = JSON.parse(res._body);
        assert.ok(Array.isArray(data.turns), 'turns not array');
        assert.strictEqual(data.turns.length, 2, 'Expected 2 turns, got ' + data.turns.length);
      });
      await test('T2d: reCommitAvailable:true returned', function() {
        var data = JSON.parse(res._body);
        assert.strictEqual(data.reCommitAvailable, true, 'reCommitAvailable not true');
      });
      await test('T2e: non-existent stage → 404', function() {
        var req2 = makeReq({ session: { accessToken: 'tok', login: 'user-A' }, params: { journeyId: jid, stageName: 'test-plan' } });
        var res2 = makeRes();
        return j.handleGetJourneyStage(req2, res2).then(function() {
          assert.strictEqual(res2._code, 404, 'Expected 404 for non-existent stage, got ' + res2._code);
        });
      });
    }
  }

  // T3 — recommit with confirmed:true sets downstream stages to needs-review
  console.log('\n[wsm3] T3 -- recommit confirmed:true → downstream stages need-review');
  {
    var j = freshRequire(JOURNEY_PATH);
    var store = freshRequire(JOURNEY_STORE_PATH);
    j.setJourneyStoreModule(store);

    // No-op disk writer for this test
    var noopWriter = { write: function(){}, read: function(){ return null; }, list: function(){ return []; }, loadSessions: function(){} };
    j.setDiskSessionWriter(noopWriter);

    var jid = store.createJourney('test-t3').journeyId;
    var journey = store.getJourney(jid);
    journey.ownerId = 'user-A';
    journey.completedStages = [
      { skillName: 'discovery', artefactPath: 'a.md', status: 'completed' },
      { skillName: 'benefit-metric', artefactPath: 'b.md', status: 'completed' },
      { skillName: 'definition', artefactPath: 'c.md', status: 'completed' },
      { skillName: 'test-plan', artefactPath: 'd.md', status: 'completed' }
    ];
    journey.activeSkill = 'definition-of-ready';

    await test('T3a: handlePostJourneyRecommit exported', function() {
      assert.strictEqual(typeof j.handlePostJourneyRecommit, 'function', 'handlePostJourneyRecommit not exported');
    });

    if (typeof j.handlePostJourneyRecommit === 'function') {
      var req = makeReq({
        method: 'POST',
        session: { accessToken: 'tok', login: 'user-A' },
        params: { journeyId: jid, stageName: 'benefit-metric' },
        body: { confirmed: true }
      });
      var res = makeRes();
      await j.handlePostJourneyRecommit(req, res);

      await test('T3b: returns 200', function() {
        assert.strictEqual(res._code, 200, 'Expected 200, got ' + res._code);
      });
      await test('T3c: discovery unchanged (completed)', function() {
        var updated = store.getJourney(jid);
        var disc = updated.completedStages.find(function(s) { return s.skillName === 'discovery'; });
        assert.strictEqual(disc.status, 'completed', 'discovery should remain completed');
      });
      await test('T3d: benefit-metric unchanged (completed — recommit is downstream-only)', function() {
        var updated = store.getJourney(jid);
        var bm = updated.completedStages.find(function(s) { return s.skillName === 'benefit-metric'; });
        assert.strictEqual(bm.status, 'completed', 'benefit-metric should remain completed');
      });
      await test('T3e: definition has needs-review', function() {
        var updated = store.getJourney(jid);
        var def = updated.completedStages.find(function(s) { return s.skillName === 'definition'; });
        assert.strictEqual(def.status, 'needs-review', 'Expected definition to be needs-review, got ' + def.status);
      });
      await test('T3f: test-plan has needs-review', function() {
        var updated = store.getJourney(jid);
        var tp = updated.completedStages.find(function(s) { return s.skillName === 'test-plan'; });
        assert.strictEqual(tp.status, 'needs-review', 'Expected test-plan to be needs-review, got ' + tp.status);
      });
    }
  }

  // T4 — recommit without confirmed → no state change
  console.log('\n[wsm3] T4 -- recommit confirmed:false → no change, cancelled:true');
  {
    var j = freshRequire(JOURNEY_PATH);
    var store = freshRequire(JOURNEY_STORE_PATH);
    j.setJourneyStoreModule(store);
    j.setDiskSessionWriter({ write: function(){}, read: function(){ return null; }, list: function(){ return []; }, loadSessions: function(){} });

    var jid = store.createJourney('test-t4').journeyId;
    var journey = store.getJourney(jid);
    journey.ownerId = 'user-A';
    journey.completedStages = [
      { skillName: 'discovery', artefactPath: 'a.md', status: 'completed' },
      { skillName: 'benefit-metric', artefactPath: 'b.md', status: 'completed' },
      { skillName: 'definition', artefactPath: 'c.md', status: 'completed' }
    ];

    if (typeof j.handlePostJourneyRecommit === 'function') {
      var req = makeReq({
        method: 'POST',
        session: { accessToken: 'tok', login: 'user-A' },
        params: { journeyId: jid, stageName: 'benefit-metric' },
        body: { confirmed: false }
      });
      var res = makeRes();
      await j.handlePostJourneyRecommit(req, res);

      await test('T4a: returns 200', function() {
        assert.strictEqual(res._code, 200, 'Expected 200, got ' + res._code);
      });
      await test('T4b: response has cancelled:true', function() {
        var data = JSON.parse(res._body);
        assert.strictEqual(data.cancelled, true, 'Expected cancelled:true');
      });
      await test('T4c: definition stage not changed', function() {
        var updated = store.getJourney(jid);
        var def = updated.completedStages.find(function(s) { return s.skillName === 'definition'; });
        assert.strictEqual(def.status, 'completed', 'definition should still be completed');
      });
    } else {
      await test('T4: handlePostJourneyRecommit exported', function() {
        assert.fail('handlePostJourneyRecommit not exported');
      });
    }
  }

  // T5 — stage-controls returns needsReview for flagged stage
  console.log('\n[wsm3] T5 -- stage-controls for needs-review stage → needsReview:true');
  {
    var j = freshRequire(JOURNEY_PATH);
    var store = freshRequire(JOURNEY_STORE_PATH);
    j.setJourneyStoreModule(store);

    var jid = store.createJourney('test-t5').journeyId;
    var journey = store.getJourney(jid);
    journey.completedStages = [
      { skillName: 'discovery', artefactPath: 'a.md', status: 'completed' },
      { skillName: 'benefit-metric', artefactPath: 'b.md', status: 'completed' },
      { skillName: 'definition', artefactPath: 'c.md', status: 'needs-review' }
    ];
    journey.activeSkill = 'test-plan';

    await test('T5a: handleGetJourneyStageControls exported', function() {
      assert.strictEqual(typeof j.handleGetJourneyStageControls, 'function', 'handleGetJourneyStageControls not exported');
    });

    if (typeof j.handleGetJourneyStageControls === 'function') {
      var req = makeReq({
        session: { accessToken: 'tok', login: 'user-A' },
        params: { journeyId: jid },
        url: '/api/journey/' + jid + '/stage-controls?stage=definition'
      });
      var res = makeRes();
      await j.handleGetJourneyStageControls(req, res);

      await test('T5b: returns 200', function() {
        assert.strictEqual(res._code, 200, 'Expected 200, got ' + res._code);
      });
      await test('T5c: needsReview:true', function() {
        var data = JSON.parse(res._body);
        assert.strictEqual(data.needsReview, true, 'Expected needsReview:true');
      });
      await test('T5d: needsReviewMessage is a string', function() {
        var data = JSON.parse(res._body);
        assert.ok(typeof data.needsReviewMessage === 'string' && data.needsReviewMessage.length > 0, 'needsReviewMessage missing');
      });
    }
  }

  // T6 — session-boundary marker is present in turns when sessions are restored from disk
  console.log('\n[wsm3] T6 -- session-boundary marker injected at restore time');
  {
    var j = freshRequire(JOURNEY_PATH);
    var store = freshRequire(JOURNEY_STORE_PATH);
    var skills = freshRequire(SKILLS_PATH);
    skills.setSessionStore({ write: function(){}, read: function(){ return null; }, list: function(){ return []; }, loadSessions: function(){} });

    j.setJourneyStoreModule(store);
    j.setGetHtmlSession(function(id) { return skills._getHtmlSession(id); });

    var jid = store.createJourney('test-t6').journeyId;
    var sid = crypto.randomUUID();

    // Simulate post-restore state: 3 old turns + boundary injected at index 3
    var boundary = { type: 'session-boundary', label: '— Previous session —' };
    skills._setHtmlSession(sid, {
      skillName: 'discovery', journeyId: jid,
      turns: [
        { role: 'user', content: 'turn1' },
        { role: 'assistant', content: 'turn2' },
        { role: 'user', content: 'turn3' },
        boundary,
        { role: 'user', content: 'new turn after restart' }
      ],
      done: false, artefactContent: null, artefactPath: null
    });
    var journey = store.getJourney(jid);
    journey.activeSessionId = sid;
    journey.activeSkill = 'discovery';
    journey.completedStages = [];

    var req = makeReq({ session: { accessToken: 'tok', login: 'user-A' }, params: { journeyId: jid } });
    var res = makeRes();
    await j.handleGetJourneyState(req, res);

    await test('T6a: response 200', function() {
      assert.strictEqual(res._code, 200, 'Expected 200, got ' + res._code);
    });
    await test('T6b: boundary marker present in turns', function() {
      var data = JSON.parse(res._body);
      var hasMarker = data.turns.some(function(t) { return t.type === 'session-boundary'; });
      assert.ok(hasMarker, 'session-boundary marker not found in turns');
    });
    await test('T6c: boundary at correct position (index 3)', function() {
      var data = JSON.parse(res._body);
      assert.strictEqual(data.turns[3].type, 'session-boundary', 'boundary not at index 3');
    });
    await test('T6d: boundary label correct', function() {
      var data = JSON.parse(res._body);
      assert.strictEqual(data.turns[3].label, '— Previous session —', 'boundary label wrong');
    });
    await test('T6e: new turn present at index 4', function() {
      var data = JSON.parse(res._body);
      assert.strictEqual(data.turns[4].content, 'new turn after restart', 'new turn missing or wrong position');
    });
  }

  // T7 — needs-review flags persisted to disk and survive "restart"
  console.log('\n[wsm3] T7 -- needs-review flags persisted to disk and restored');
  {
    var j1 = freshRequire(JOURNEY_PATH);
    var store1 = freshRequire(JOURNEY_STORE_PATH);
    j1.setJourneyStoreModule(store1);

    // In-memory disk mock
    var memDisk = {};
    var mockDiskWriter = {
      write: function(id, data) { memDisk[id] = JSON.parse(JSON.stringify(data)); },
      read: function(id) { return memDisk[id] || null; },
      list: function() { return Object.keys(memDisk); },
      loadSessions: function() {}
    };
    j1.setDiskSessionWriter(mockDiskWriter);

    await test('T7a: setDiskSessionWriter exported', function() {
      assert.strictEqual(typeof j1.setDiskSessionWriter, 'function', 'setDiskSessionWriter not exported on journey.js');
    });

    var jid = store1.createJourney('test-t7').journeyId;
    var journey1 = store1.getJourney(jid);
    journey1.ownerId = 'user-A';
    journey1.completedStages = [
      { skillName: 'discovery', artefactPath: 'a.md', status: 'completed' },
      { skillName: 'benefit-metric', artefactPath: 'b.md', status: 'completed' },
      { skillName: 'definition', artefactPath: 'c.md', status: 'completed' }
    ];
    journey1.activeSkill = 'test-plan';

    if (typeof j1.handlePostJourneyRecommit === 'function') {
      // Step 1: recommit benefit-metric → definition gets needs-review, data written to disk
      var recommitReq = makeReq({
        method: 'POST',
        session: { accessToken: 'tok', login: 'user-A' },
        params: { journeyId: jid, stageName: 'benefit-metric' },
        body: { confirmed: true }
      });
      var recommitRes = makeRes();
      await j1.handlePostJourneyRecommit(recommitReq, recommitRes);

      await test('T7b: recommit writes to disk', function() {
        var hasJourneyData = Object.keys(memDisk).length > 0;
        assert.ok(hasJourneyData, 'recommit did not write anything to disk. memDisk keys: ' + JSON.stringify(Object.keys(memDisk)));
      });

      // Step 2: Simulate "restart" — reset completedStages to stale state, then call loadJourneyMeta
      var staleJourney = store1.getJourney(jid);
      staleJourney.completedStages.forEach(function(s) { s.status = 'completed'; }); // reset to stale

      await test('T7c: loadJourneyMeta exported', function() {
        assert.strictEqual(typeof j1.loadJourneyMeta, 'function', 'loadJourneyMeta not exported');
      });

      if (typeof j1.loadJourneyMeta === 'function') {
        j1.loadJourneyMeta(mockDiskWriter, store1);

        await test('T7d: definition has needs-review after restore', function() {
          var restored = store1.getJourney(jid);
          assert.ok(restored, 'journey not found after restore');
          var def = restored.completedStages.find(function(s) { return s.skillName === 'definition'; });
          assert.ok(def, 'definition not found in restored completedStages');
          assert.strictEqual(def.status, 'needs-review', 'Expected needs-review after restore, got ' + def.status);
        });
        await test('T7e: discovery still completed after restore', function() {
          var restored = store1.getJourney(jid);
          var disc = restored.completedStages.find(function(s) { return s.skillName === 'discovery'; });
          assert.strictEqual(disc.status, 'completed', 'discovery should remain completed');
        });
      }
    } else {
      await test('T7: handlePostJourneyRecommit exported', function() {
        assert.fail('handlePostJourneyRecommit not exported');
      });
    }
  }

  // T8 — needs-review cleared when stage is re-committed; downstream stays flagged
  console.log('\n[wsm3] T8 -- committing flagged stage clears its needs-review only');
  {
    var j = freshRequire(JOURNEY_PATH);
    var store = freshRequire(JOURNEY_STORE_PATH);
    j.setJourneyStoreModule(store);
    j.setDiskSessionWriter({ write: function(){}, read: function(){ return null; }, list: function(){ return []; }, loadSessions: function(){} });

    var jid = store.createJourney('test-t8').journeyId;
    var journey = store.getJourney(jid);
    journey.ownerId = 'user-A';
    journey.completedStages = [
      { skillName: 'discovery', artefactPath: 'a.md', status: 'completed' },
      { skillName: 'benefit-metric', artefactPath: 'b.md', status: 'completed' },
      { skillName: 'definition', artefactPath: 'c.md', status: 'needs-review' },
      { skillName: 'test-plan', artefactPath: 'd.md', status: 'needs-review' }
    ];
    journey.activeSkill = 'definition-of-ready';

    await test('T8a: handlePostJourneyStageCommit exported', function() {
      assert.strictEqual(typeof j.handlePostJourneyStageCommit, 'function', 'handlePostJourneyStageCommit not exported');
    });

    if (typeof j.handlePostJourneyStageCommit === 'function') {
      var req = makeReq({
        method: 'POST',
        session: { accessToken: 'tok', login: 'user-A' },
        params: { journeyId: jid, stageName: 'definition' },
        body: { artefactPath: 'artefacts/t8/definition-v2.md' }
      });
      var res = makeRes();
      await j.handlePostJourneyStageCommit(req, res);

      await test('T8b: returns 200', function() {
        assert.strictEqual(res._code, 200, 'Expected 200, got ' + res._code);
      });
      await test('T8c: definition status cleared to completed', function() {
        var updated = store.getJourney(jid);
        var def = updated.completedStages.find(function(s) { return s.skillName === 'definition'; });
        assert.strictEqual(def.status, 'completed', 'Expected definition to be completed, got ' + def.status);
      });
      await test('T8d: test-plan still has needs-review (downstream unaffected)', function() {
        var updated = store.getJourney(jid);
        var tp = updated.completedStages.find(function(s) { return s.skillName === 'test-plan'; });
        assert.strictEqual(tp.status, 'needs-review', 'test-plan should still be needs-review, got ' + tp.status);
      });
      await test('T8e: non-owner commit → 403', function() {
        var req2 = makeReq({
          method: 'POST',
          session: { accessToken: 'tok', login: 'user-B' },
          params: { journeyId: jid, stageName: 'definition' },
          body: {}
        });
        var res2 = makeRes();
        return j.handlePostJourneyStageCommit(req2, res2).then(function() {
          assert.strictEqual(res2._code, 403, 'Expected 403 for non-owner, got ' + res2._code);
        });
      });
    }
  }

  // Summary
  console.log('\n=== wsm3 results:', passed, 'passed,', failed, 'failed ===');
  if (failures.length) {
    failures.forEach(function(f) { console.log('  FAILED:', f.name, '--', f.err && f.err.message || f.err); });
    process.exit(1);
  }
}

main().catch(function(err) { console.error(err); process.exit(1); });
