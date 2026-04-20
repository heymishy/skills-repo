#!/usr/bin/env node
// check-p4-obs-archive.js — governance tests for p4-obs-archive story
// 12 tests: T1–T10, T-NFR1, T-NFR2
// No external dependencies — Node.js built-ins only.
'use strict';

const fs   = require('fs');
const path = require('path');

const SUITE = '[p4-obs-archive]';
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function loadArchiveMod() {
  const p = path.join(__dirname, '..', 'scripts', 'archive-completed-features.js');
  if (!fs.existsSync(p)) return null;
  delete require.cache[require.resolve(p)];
  return require(p);
}

const archiveMod = loadArchiveMod();

if (!archiveMod) {
  console.log(`${SUITE} SKIP: archive module not found`);
  process.exit(1);
}

// ── Fixtures ──────────────────────────────────────────────────────

function makeActiveState(stories) {
  return {
    version: '1',
    features: [
      {
        slug: 'slug-a',
        name: 'Feature A',
        stage: 'subagent-execution',
        health: 'green',
        track: 'standard',
        stories: stories
      }
    ]
  };
}

const doneStory = {
  id: 'done-story-1',
  stage: 'definition-of-done',
  state: 'done',
  dodStatus: 'complete',
  dodAt: '2025-01-10T00:00:00.000Z'
};

const activeStory = {
  id: 'active-story-1',
  stage: 'subagent-execution',
  state: 'current',
  dodStatus: 'not-started'
};

// ── T1 — archiveStories removes done story from active ────────────
console.log(`${SUITE} T1 \u2014 archiveStories removes done story from active`);
{
  if (typeof archiveMod.archiveStories !== 'function') {
    assert(false, 'T1: archiveStories not exported');
  } else {
    const active  = makeActiveState([doneStory, activeStory]);
    const result  = archiveMod.archiveStories(active, {}, 'slug-a');
    const activeF = result.active.features.find(f => f.slug === 'slug-a');
    const hasFullDoneObj = activeF.stories.some(s => typeof s === 'object' && s.id === 'done-story-1' && s.dodStatus === 'complete');
    assert(!hasFullDoneObj, 'T1a: done story no longer in active as full object');
    assert(activeF.stories.some(s => s.id === 'active-story-1'), 'T1b: active story still present');
  }
}

// ── T2 — archivedStoryCount set on active feature ─────────────────
console.log(`${SUITE} T2 \u2014 archivedStoryCount set on active feature`);
{
  if (typeof archiveMod.archiveStories !== 'function') {
    assert(false, 'T2: archiveStories not exported');
  } else {
    const active  = makeActiveState([doneStory, activeStory]);
    const result  = archiveMod.archiveStories(active, {}, 'slug-a');
    const activeF = result.active.features.find(f => f.slug === 'slug-a');
    assert(activeF.archivedStoryCount === 1, 'T2: archivedStoryCount is 1 after archiving 1 story');
  }
}

// ── T3 — archive contains the archived story ─────────────────────
console.log(`${SUITE} T3 \u2014 archive contains archived story`);
{
  if (typeof archiveMod.archiveStories !== 'function') {
    assert(false, 'T3: archiveStories not exported');
  } else {
    const active   = makeActiveState([doneStory, activeStory]);
    const result   = archiveMod.archiveStories(active, {}, 'slug-a');
    const archF    = (result.archive.features || []).find(f => f.slug === 'slug-a');
    assert(archF && archF.stories && archF.stories.length === 1, 'T3a: archive entry has 1 story');
    assert(archF && archF.stories[0].id === 'done-story-1', 'T3b: archived story id correct');
  }
}

// ── T4 — mergeState adds archived: true ──────────────────────────
console.log(`${SUITE} T4 \u2014 mergeState adds archived: true`);
{
  if (typeof archiveMod.archiveStories !== 'function') {
    assert(false, 'T4: archiveStories not exported'); assert(false, 'T4b: skip'); assert(false, 'T4c: skip');
  } else {
  const result  = archiveMod.archiveStories(makeActiveState([doneStory, activeStory]), {}, 'slug-a');
  // Merge archive back into a fresh active state that has only the in-flight story
  const fresh   = makeActiveState([activeStory]);
  const merged  = archiveMod.mergeState(fresh, result.archive);
  const mergedF = merged.features.find(f => f.slug === 'slug-a');
  const archivedStory = mergedF.stories.find(s => s.id === 'done-story-1');
  assert(archivedStory !== undefined, 'T4a: archived story reconstituted in merged state');
  assert(archivedStory && archivedStory.archived === true, 'T4b: archived story has archived: true');
  } // end if archiveStories
}

// ── T5 — round-trip fidelity with 3 stories ──────────────────────
console.log(`${SUITE} T5 \u2014 round-trip fidelity`);
{
  if (typeof archiveMod.archiveStories !== 'function') {
    assert(false, 'T5: archiveStories not exported'); assert(false, 'T5b-e: skip');
  } else {
  const doneStory2 = { id: 'done-story-2', stage: 'definition-of-done', dodStatus: 'complete', name: 'Done 2', myField: 'xyz' };
  const initial    = makeActiveState([doneStory, doneStory2, activeStory]);
  const result     = archiveMod.archiveStories(initial, {}, 'slug-a');
  const fresh      = makeActiveState([activeStory]);
  const merged     = archiveMod.mergeState(fresh, result.archive);
  const mergedF    = merged.features.find(f => f.slug === 'slug-a');
  assert(mergedF.stories.length === 3, 'T5a: all 3 stories in merged state');
  assert(mergedF.stories.some(s => s.id === 'done-story-1'),  'T5b: done-story-1 present');
  assert(mergedF.stories.some(s => s.id === 'done-story-2'),  'T5c: done-story-2 present');
  assert(mergedF.stories.some(s => s.id === 'active-story-1'), 'T5d: active-story-1 present');
  // Field fidelity: doneStory2 has myField: 'xyz'
  const s2 = mergedF.stories.find(s => s.id === 'done-story-2');
  assert(s2 && s2.myField === 'xyz', 'T5e: original fields preserved in archived story');
  } // end if archiveStories
}

// ── T6 — index.html contains badge logic ─────────────────────────
console.log(`${SUITE} T6 \u2014 index.html contains archive badge logic`);
{
  const htmlPath = path.join(__dirname, '..', 'dashboards', 'index.html');
  if (!fs.existsSync(htmlPath)) {
    assert(false, 'T6: index.html not found');
  } else {
    const html = fs.readFileSync(htmlPath, 'utf8');
    assert(html.includes('archivedStoryCount'), 'T6a: index.html references archivedStoryCount');
    assert(html.includes('epic-archive-badge'),  'T6b: index.html has epic-archive-badge class');
    assert(html.includes('archived'),            'T6c: index.html has archived rendering logic');
  }
}

// ── T7 — index.html has story-row-archived hidden by default ─────
console.log(`${SUITE} T7 \u2014 index.html hides archived rows by default`);
{
  const htmlPath = path.join(__dirname, '..', 'dashboards', 'index.html');
  if (!fs.existsSync(htmlPath)) {
    assert(false, 'T7: index.html not found');
  } else {
    const html = fs.readFileSync(htmlPath, 'utf8');
    assert(html.includes('story-row-archived'), 'T7a: story-row-archived class defined');
    assert(/story-row-archived[^}]*display\s*:\s*none/.test(html.replace(/\n/g, ' ')), 'T7b: story-row-archived has display:none');
  }
}

// ── T8 — index.html handles showArchived query param ─────────────
console.log(`${SUITE} T8 \u2014 index.html handles showArchived query param`);
{
  const htmlPath = path.join(__dirname, '..', 'dashboards', 'index.html');
  if (!fs.existsSync(htmlPath)) {
    assert(false, 'T8: index.html not found');
  } else {
    const html = fs.readFileSync(htmlPath, 'utf8');
    assert(html.includes('showArchived'), 'T8: index.html contains showArchived toggle logic');
  }
}

// ── T9 — index.html has muted/opacity style for archived rows ────
console.log(`${SUITE} T9 \u2014 index.html has muted style for archived rows`);
{
  const htmlPath = path.join(__dirname, '..', 'dashboards', 'index.html');
  if (!fs.existsSync(htmlPath)) {
    assert(false, 'T9: index.html not found');
  } else {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const hasMutedStyle = html.includes('story-archived-visible') || html.includes('show-archived');
    assert(hasMutedStyle, 'T9a: archived-visible style class present');
    assert(html.includes('opacity'), 'T9b: opacity style applied to visible archived rows');
  }
}

// ── T10 — large fixture (55 stories) handles archiveStories + mergeState ─
console.log(`${SUITE} T10 \u2014 large fixture 55 stories`);
{
  if (typeof archiveMod.archiveStories !== 'function') {
    assert(false, 'T10: archiveStories not exported');
  } else {
    // Build 5 features × 11 stories each (10 done + 1 active)
    const features = [];
    for (let i = 0; i < 5; i++) {
      const stories = [];
      for (let j = 0; j < 10; j++) {
        stories.push({ id: 'f' + i + 's' + j, dodStatus: 'complete', stage: 'definition-of-done', state: 'done' });
      }
      stories.push({ id: 'f' + i + 'sa', dodStatus: 'not-started', stage: 'subagent-execution', state: 'current' });
      features.push({ slug: 'feat-' + i, name: 'Feature ' + i, stage: 'subagent-execution', health: 'green', track: 'standard', stories });
    }
    const bigActive = { version: '1', features };
    let archive = {};
    let current = JSON.parse(JSON.stringify(bigActive));
    let threw = false;
    try {
      for (let i = 0; i < 5; i++) {
        const result = archiveMod.archiveStories(current, archive, 'feat-' + i);
        current = result.active;
        archive = result.archive;
      }
    } catch (e) {
      threw = true;
    }
    assert(!threw, 'T10a: no error thrown for 55-story fixture');
    // All 5 features still present in merged state
    const merged = archiveMod.mergeState(current, archive);
    assert(merged.features.length === 5, 'T10b: all 5 features in merged result');
  }
}

// ── T-NFR1 — schema.json contains archivedStoryCount ─────────────
console.log(`${SUITE} T-NFR1 \u2014 schema has archivedStoryCount`);
{
  const schemaPath = path.join(__dirname, '..', '.github', 'pipeline-state.schema.json');
  if (!fs.existsSync(schemaPath)) {
    assert(false, 'T-NFR1: schema file not found');
  } else {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    assert(schema.includes('archivedStoryCount'), 'T-NFR1: archivedStoryCount present in schema');
  }
}

// ── T-NFR2 — no new .js files in dashboards/ ─────────────────────
console.log(`${SUITE} T-NFR2 \u2014 no new .js files in dashboards/`);
{
  const dashDir   = path.join(__dirname, '..', 'dashboards');
  const jsFiles   = fs.readdirSync(dashDir).filter(f => f.endsWith('.js')).sort();
  const expected  = ['artefact-content.js', 'artefact-fetcher.js', 'extra-data.js', 'md-renderer.js', 'pipeline-adapter.js'].sort();
  assert(JSON.stringify(jsFiles) === JSON.stringify(expected), 'T-NFR2: only the 5 original .js files in dashboards/ (got: ' + jsFiles.join(', ') + ')');
}

// ── Results ───────────────────────────────────────────────────────
console.log(`${SUITE} Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
