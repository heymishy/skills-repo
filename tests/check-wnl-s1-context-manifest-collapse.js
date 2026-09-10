'use strict';

// check-wnl-s1-context-manifest-collapse.js
// Tests for wnl-s1 — collapsed-by-default context manifest summary.
// All output lines are prefixed with [wnl-s1].

const { buildContextManifestHtml } = require('../src/web-ui/routes/skills');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log('[wnl-s1] PASS:', label);
    passed++;
  } else {
    console.error('[wnl-s1] FAIL:', label);
    failed++;
  }
}

// T1: collapsed-by-default-all-loaded
(function() {
  const html = buildContextManifestHtml([
    { path: 'a.md', status: 'ok' },
    { path: 'b.md', status: 'ok' },
    { path: 'c.md', status: 'ok' }
  ]);
  assert(/<details[^>]*id="context-manifest"/.test(html), 'T1: <details id="context-manifest"> present');
  assert(!/<details[^>]*\bopen\b/.test(html.match(/<details[^>]*>/)[0]), 'T1: <details> has no open attribute (collapsed by default)');
  assert(html.includes('Context loaded (3 files)'), 'T1: summary reflects 3-file count');
})();

// T2: collapsed-summary-reflects-exact-file-count (singular/plural)
(function() {
  const html1 = buildContextManifestHtml([{ path: 'a.md', status: 'ok' }]);
  assert(html1.includes('Context loaded (1 file)') && !html1.includes('(1 files)'), 'T2: singular "1 file"');
  const html5 = buildContextManifestHtml([1, 2, 3, 4, 5].map(function(i) { return { path: 'f' + i + '.md', status: 'ok' }; }));
  assert(html5.includes('Context loaded (5 files)'), 'T2: plural "5 files"');
})();

// T3: expand-reveals-unchanged-chip-list
(function() {
  const files = [
    { path: 'product/mission.md', status: 'ok' },
    { path: 'product/tech-stack.md', status: 'ok' }
  ];
  const html = buildContextManifestHtml(files);
  const chipCount = (html.match(/class="chip-ok"/g) || []).length;
  assert(chipCount === 2, 'T3: two chip-ok elements present inside the details body (got ' + chipCount + ')');
  assert(html.includes('mission.md') && html.includes('tech-stack.md'), 'T3: both basenames present');
})();

// T4: native-details-element-present-not-custom-js
(function() {
  const html = buildContextManifestHtml([{ path: 'a.md', status: 'ok' }]);
  assert(html.includes('<details'), 'T4: real <details> element used');
  assert(!html.includes('<script>'), 'T4: no custom <script> toggle logic added');
  assert(!/onclick=/.test(html), 'T4: no onclick handler added');
})();

// T5: warning-cue-visible-without-expanding
(function() {
  const html = buildContextManifestHtml([
    { path: 'a.md', status: 'ok' },
    { path: 'b.md', status: 'ok' },
    { path: 'c.md', status: 'ok' },
    { path: 'd.md', status: 'ok' },
    { path: 'e.md', status: 'warn' }
  ]);
  const summaryMatch = html.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
  assert(summaryMatch, 'T5: summary element found');
  const summaryText = summaryMatch[1];
  assert(summaryText.includes('4 of 5'), 'T5: summary shows "4 of 5"');
  assert(/[⚠]/.test(summaryText), 'T5: summary contains warning symbol');
})();

// T6: warning-cue-absent-when-all-loaded
(function() {
  const html = buildContextManifestHtml([
    { path: 'a.md', status: 'ok' },
    { path: 'b.md', status: 'ok' }
  ]);
  const summaryMatch = html.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
  const summaryText = summaryMatch[1];
  assert(!/[⚠]/.test(summaryText), 'T6: no warning symbol when all loaded');
  assert(!summaryText.includes(' of '), 'T6: no "X of Y" partial-count language when all loaded');
})();

// T7: per-file-markup-regression-guard
(function() {
  const fixtures = [
    [{ path: 'product/mission.md', status: 'ok' }, { path: 'product/constraints.md', status: 'warn' }],
    [],
    [{ path: '<script>alert(1)</script>/malicious.md', status: 'ok' }]
  ];
  fixtures.forEach(function(files, i) {
    const html = buildContextManifestHtml(files);
    if (files.length === 0) {
      assert(html.includes('no context loaded') || html.includes('context-manifest-empty'), 'T7.' + i + ': empty placeholder present');
      assert(!html.includes('chip-ok') && !html.includes('chip-warn'), 'T7.' + i + ': no chips when empty');
    } else {
      files.forEach(function(f) {
        const status = f.status || 'ok';
        const cls = status === 'warn' ? 'chip-warn' : 'chip-ok';
        assert(html.includes('class="' + cls + '"'), 'T7.' + i + ': ' + cls + ' present for ' + f.path);
      });
    }
    if (i === 2) {
      assert(!html.includes('<script>alert'), 'T7.' + i + ': raw script tag not present (escaped)');
    }
  });
})();

console.log('[wnl-s1] Results: passed=' + passed + ' failed=' + failed);
process.exit(failed > 0 ? 1 : 0);
