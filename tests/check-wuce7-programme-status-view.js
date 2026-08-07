// check-wuce7-programme-status-view.js — AC verification tests for wuce.7
// Tests T1.1-T1.2, T2.1-T2.3, T3.1-T3.2, T4.1-T4.4, T5.1-T5.3,
//       T6.1-T6.2, IT1-IT3, NFR1-NFR2
// No external dependencies — Node.js built-ins only.

'use strict';

const path = require('path');
const ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log('  \u2713 ' + label); passed++; }
  else           { console.log('  \u2717 ' + label); failed++; }
}

const featureFixture          = require('./fixtures/github/pipeline-state-feature.json');
const doneFeatureFixture      = require('./fixtures/github/pipeline-state-done-feature.json');
const traceFindingsFixture    = require('./fixtures/github/pipeline-state-trace-findings.json');
const awaitingDispatchFixture = require('./fixtures/github/pipeline-state-awaiting-dispatch.json');

const { getPipelineStatus, setFetcher, setAccessValidator } =
  require('../src/web-ui/adapters/pipeline-status');
const { deriveBlockerIndicator, deriveFeatureStatusLabel, isFeatureDone, renderStatusBoard } =
  require('../src/web-ui/utils/status-board');
const { exportStatusAsMarkdown } =
  require('../src/web-ui/utils/status-export');
// kbc-s1 (AC5): GET /status and GET /status/export were removed outright along
// with routes/status.js (retired in favour of product/org/tenant kanban boards).
// The route-level IT1-IT3/NFR1 tests that exercised handleGetStatus/
// handleGetStatusExport directly were removed with them (U9) -- the surviving
// utility-level logic they wrapped (deriveBlockerIndicator,
// deriveFeatureStatusLabel, isFeatureDone, exportStatusAsMarkdown,
// renderStatusBoard) is still tested directly below (T2-T6, NFR2), unaffected
// by the route's removal.

async function runTests() {

  console.log('\nT2 -- deriveBlockerIndicator');
  assert(deriveBlockerIndicator(traceFindingsFixture) === 'Trace findings',
    'T2.1 has-findings -> "Trace findings" (exact text)');
  assert(deriveBlockerIndicator({ stories: [{ prStatus:'merged', traceStatus:'passed' }] }) === null,
    'T2.2 traceStatus:passed -> null');
  { let threw=false, result;
    try { result = deriveBlockerIndicator({ stories: [{ prStatus:'open' }] }); } catch(e) { threw=true; }
    assert(!threw, 'T2.3a no traceStatus -- does not throw');
    assert(result===null||result===undefined||typeof result==='string', 'T2.3b safe default'); }

  console.log('\nT3 -- deriveFeatureStatusLabel');
  assert(deriveFeatureStatusLabel(awaitingDispatchFixture.stories) === 'Awaiting implementation dispatch',
    'T3.1 signed-off + none -> "Awaiting implementation dispatch" (exact text)');
  { let threw=false, result;
    try { result = deriveFeatureStatusLabel([{ prStatus:'draft', dorStatus:'not-started' }]); } catch(e) { threw=true; }
    assert(!threw, 'T3.2a does not throw');
    assert(typeof result==='string' && result.length>0, 'T3.2b non-empty string'); }

  console.log('\nT4 -- isFeatureDone');
  assert(isFeatureDone(doneFeatureFixture) === true,
    'T4.1 all merged+passed -> true');
  assert(isFeatureDone({ stories:[{prStatus:'open',traceStatus:'passed'},{prStatus:'merged',traceStatus:'passed'}] }) === false,
    'T4.2 any prStatus!=merged -> false');
  assert(isFeatureDone({ stories:[{prStatus:'merged',traceStatus:'has-findings'}] }) === false,
    'T4.3 any traceStatus!=passed -> false');
  assert(isFeatureDone({ stories:[] }) === false, 'T4.4 empty stories -> false');

  console.log('\nT5 -- exportStatusAsMarkdown');
  { const r = exportStatusAsMarkdown([featureFixture]);
    assert(typeof r==='string', 'T5.1a returns string');
    assert(r.includes('| Feature |'), 'T5.1b contains table header'); }
  { const r = exportStatusAsMarkdown([{slug:'2026-05-02-test-feature',stage:'test-plan',lastActivityDate:'2026-05-02',stories:[]}]);
    assert(r.includes('2026-05-02-test-feature'), 'T5.2a contains slug');
    assert(r.includes('test-plan'), 'T5.2b contains stage'); }
  { let threw=false, r;
    try { r = exportStatusAsMarkdown([]); } catch(e) { threw=true; }
    assert(!threw, 'T5.3a empty -> no throw');
    assert(typeof r==='string'&&r.length>0, 'T5.3b non-empty string'); }

  console.log('\nT6 -- renderStatusBoard (DOM-state)');
  { const html = renderStatusBoard([traceFindingsFixture]);
    assert(html.includes('amber-indicator'), 'T6.1a amber-indicator class present');
    assert(html.includes('Trace findings'), 'T6.1b "Trace findings" text label present'); }
  { const html = renderStatusBoard([featureFixture, doneFeatureFixture]);
    assert(html.includes('class="in-progress-section"'), 'T6.2a in-progress-section present');
    assert(html.includes('class="done-section"'), 'T6.2b done-section present (separated)');
    const doneIdx = html.indexOf('class="done-section"');
    const slugIdx = html.indexOf(doneFeatureFixture.slug, doneIdx);
    assert(slugIdx > doneIdx, 'T6.2c done slug inside done-section'); }

  console.log('\nT1 -- getPipelineStatus adapter');
  { setFetcher(() => featureFixture); setAccessValidator(null);
    const result = await getPipelineStatus('2026-05-02-test-feature', 'valid-token');
    assert(typeof result==='object'&&result!==null, 'T1.1a result is object');
    assert(result.slug==='2026-05-02-test-feature', 'T1.1b result.slug correct');
    assert(result.stage==='test-plan', 'T1.1c result.stage correct');
    assert(result.lastActivityDate==='2026-05-02T10:00:00Z'||result.updatedAt==='2026-05-02T10:00:00Z',
      'T1.1d result has lastActivityDate/updatedAt');
    assert(Array.isArray(result.stories), 'T1.1e result.stories is array');
    if(Array.isArray(result.stories)&&result.stories.length>0) {
      assert(result.stories[0].prStatus!==undefined,   'T1.1f story.prStatus present');
      assert(result.stories[0].dorStatus!==undefined,  'T1.1g story.dorStatus present');
      assert(result.stories[0].traceStatus!==undefined,'T1.1h story.traceStatus present');
    } else { console.log('  \u2717 T1.1f story.prStatus present'); console.log('  \u2717 T1.1g story.dorStatus present'); console.log('  \u2717 T1.1h story.traceStatus present'); failed+=3; } }
  { let validatorCalled=false;
    setAccessValidator(async(slug,token)=>{ validatorCalled=true; return Boolean(token); });
    setFetcher(()=>featureFixture);
    const r2 = await getPipelineStatus('2026-05-02-test-feature','valid-token');
    assert(validatorCalled, 'T1.2a validateRepositoryAccess was called');
    assert(r2!==null&&r2!==undefined, 'T1.2b data returned when access granted');
    let threw=false;
    try { await getPipelineStatus('2026-05-02-test-feature',null); } catch(e) { threw=(e.message==='Access denied'); }
    assert(threw, 'T1.2c throws when access denied');
    setAccessValidator(null); setFetcher(()=>featureFixture); }

  // kbc-s1 (AC5, U9): IT1-IT3 (GET /status, GET /status/export route-level
  // tests) and NFR1 (audit log via handleGetStatus) were removed here --
  // those routes and routes/status.js were deleted outright by kbc-s1. The
  // underlying utility-level logic those routes wrapped is still exercised
  // directly above (T2-T6) and below (NFR2), which the route removal does
  // not affect.
  console.log('\nNFR2 -- NFR test');
  { const html=renderStatusBoard([traceFindingsFixture]);
    const m=html.match(/<span[^>]*amber-indicator[^>]*>([^<]*)<\/span>/);
    assert(m!==null&&m[1].trim().length>0,'NFR2 amber-indicator has non-empty text (colour not sole indicator)'); }
}

runTests().then(()=>{
  console.log('\n[wuce7-programme-status-view] '+passed+' passed, '+failed+' failed');
  if(failed>0) process.exit(1);
}).catch(err=>{
  console.error('\n[wuce7-programme-status-view] fatal: '+err.message);
  process.exit(1);
});
