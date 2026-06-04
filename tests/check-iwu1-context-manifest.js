'use strict';

// check-iwu1-context-manifest.js
// Tests for iwu.1 — #context-manifest chip layout in the /ideate session shell.
// All output lines are prefixed with [iwu1].

const path = require('path');
const { buildContextManifestHtml } = require('../src/web-ui/routes/skills');
const { renderChat } = require('../src/web-ui/views/chat-view');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log('[iwu1] PASS:', label);
    passed++;
  } else {
    console.error('[iwu1] FAIL:', label);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Test 1: renders #context-manifest with chip elements for each loaded file
// ---------------------------------------------------------------------------
(function() {
  const html = buildContextManifestHtml([
    { path: 'product/mission.md', status: 'ok' },
    { path: 'product/tech-stack.md', status: 'ok' }
  ]);
  assert(html.includes('id="context-manifest"'), 'T1: contains id="context-manifest"');
  const chipCount = (html.match(/class="chip-ok"/g) || []).length;
  assert(chipCount === 2, 'T1: two chip-ok elements rendered (got ' + chipCount + ')');
})();

// ---------------------------------------------------------------------------
// Test 2: #context-manifest section present exactly once; chip count equals file count
// ---------------------------------------------------------------------------
(function() {
  const html = buildContextManifestHtml([{ path: 'product/roadmap.md', status: 'ok' }]);
  const manifestCount = (html.match(/id="context-manifest"/g) || []).length;
  assert(manifestCount === 1, 'T2: id="context-manifest" appears exactly once');
  const chipCount = (html.match(/class="chip-ok"/g) || []).length;
  assert(chipCount === 1, 'T2: exactly one chip-ok for single file (got ' + chipCount + ')');
})();

// ---------------------------------------------------------------------------
// Test 3: chip-ok displays filename (not full path)
// ---------------------------------------------------------------------------
(function() {
  const html = buildContextManifestHtml([{ path: 'product/mission.md', status: 'ok' }]);
  assert(html.includes('mission.md'), 'T3: chip text contains "mission.md"');
  assert(!html.includes('product/'), 'T3: chip text does NOT contain "product/"');
})();

// ---------------------------------------------------------------------------
// Test 4: chip-ok carries a non-colour discriminator
// ---------------------------------------------------------------------------
(function() {
  const html = buildContextManifestHtml([{ path: 'product/mission.md', status: 'ok' }]);
  const hasLoadedText = html.includes('>loaded<');
  const hasLoadedAria = html.includes('loaded"') || html.includes('loaded ');
  assert(hasLoadedText || hasLoadedAria, 'T4: chip-ok has non-colour discriminator (text "loaded" or aria-label with "loaded")');
})();

// ---------------------------------------------------------------------------
// Test 5: chip-warn displays filename and non-colour discriminator
// ---------------------------------------------------------------------------
(function() {
  const html = buildContextManifestHtml([{ path: 'product/constraints.md', status: 'warn' }]);
  assert(html.includes('chip-warn'), 'T5: chip-warn class present');
  assert(html.includes('constraints.md'), 'T5: chip-warn contains "constraints.md"');
  const hasMissingText = html.includes('>missing<');
  const hasMissingAria = html.includes('missing"') || html.includes('missing ');
  assert(hasMissingText || hasMissingAria, 'T5: chip-warn has "missing" in text or aria-label');
})();

// ---------------------------------------------------------------------------
// Test 6: chip-warn accessible name includes "missing" state
// ---------------------------------------------------------------------------
(function() {
  const html = buildContextManifestHtml([{ path: 'product/constraints.md', status: 'warn' }]);
  // Check aria-label on the chip-warn span contains "missing"
  const ariaLabelMatch = html.match(/class="chip-warn"[^>]*aria-label="([^"]+)"/);
  const hasAriaLabel = ariaLabelMatch && ariaLabelMatch[1].includes('missing');
  const hasVisibleText = html.includes('>missing<');
  assert(hasAriaLabel || hasVisibleText, 'T6: chip-warn aria-label or visible text contains "missing"');
})();

// ---------------------------------------------------------------------------
// Test 7: renders placeholder when context file list is empty
// ---------------------------------------------------------------------------
(function() {
  const html = buildContextManifestHtml([]);
  assert(html.includes('id="context-manifest"'), 'T7: id="context-manifest" present with empty list');
  assert(!html.includes('chip-ok'), 'T7: no chip-ok elements when empty');
  assert(!html.includes('chip-warn'), 'T7: no chip-warn elements when empty');
  // placeholder text
  assert(
    html.includes('no context loaded') || html.includes('context-manifest-empty'),
    'T7: placeholder message present'
  );
})();

// ---------------------------------------------------------------------------
// Test 8 (XSS guard): HTML-escapes artefact path display values
// ---------------------------------------------------------------------------
(function() {
  const xssPath = '<script>alert(1)</script>/malicious.md';
  const html = buildContextManifestHtml([{ path: xssPath, status: 'ok' }]);
  assert(!html.includes('<script>'), 'T8: raw <script> tag NOT present (HTML-escaped)');
  assert(html.includes('&lt;script&gt;') || html.includes('malicious.md'), 'T8: content is escaped or basename used');
})();

// ---------------------------------------------------------------------------
// Integration test: renderChat HTML includes #context-manifest
// ---------------------------------------------------------------------------
(function() {
  const { escHtml } = require('../src/web-ui/utils/html-shell');
  // Minimal mock session — use buildContextManifestHtml for the contextManifestHtml prop
  const contextManifestHtml = buildContextManifestHtml([]);
  const html = renderChat({
    skillName: 'ideate',
    skillLabel: 'Ideation',
    featureSlug: 'test-feature',
    sessionId: 'test-session-id',
    questionIndex: 1,
    totalQuestions: 1,
    currentQuestion: 'What is your goal?',
    priorQA: [],
    draftSections: [],
    pendingConfirmation: false,
    userInitial: 'T',
    modelLabel: 'test-model',
    contextManifestHtml: contextManifestHtml
  });
  assert(html.includes('id="context-manifest"'), 'Integration: rendered chat HTML contains id="context-manifest"');
  assert(html.includes('chip-ok') || html.includes('no context loaded'), 'Integration: manifest section has chips or placeholder');
})();

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('[iwu1] Results: passed=' + passed + ' failed=' + failed);
process.exit(failed > 0 ? 1 : 0);
