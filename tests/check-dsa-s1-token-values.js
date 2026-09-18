'use strict';
// tests/check-dsa-s1-token-values.js -- AC1, AC2 (token-value groundwork)
//
// Verifies the 3 real CSS blocks that carry design-system tokens
// (`:root`, `[data-theme="dark"]`, and the `@media (prefers-color-scheme: dark)`
// no-JS fallback) each define the required tokens -- not just that a pattern
// matches somewhere in the whole file.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const htmlShellSrc = fs.readFileSync(
  path.resolve(__dirname, '../src/web-ui/utils/html-shell.js'), 'utf8'
);

function extractBlock(pattern, label) {
  const m = pattern.exec(htmlShellSrc);
  assert.ok(m, `could not locate the ${label} block in html-shell.js`);
  return m[1];
}

// :root { ... } -- light mode tokens (default). The pattern requires
// whitespace then "{" immediately after ":root", so it does not match the
// ":root:not(...)" selector used inside the @media fallback below.
const rootBlock = extractBlock(/:root\s*\{([\s\S]*?)\}/, ':root');

// [data-theme="dark"] { ... } -- manual dark-mode toggle block. The pattern
// requires whitespace then "{" immediately after the attribute selector, so
// it does not match the later ".sw-theme-toggle-icon" rules that reuse the
// same attribute selector with a descendant selector appended.
const darkThemeBlock = extractBlock(/\[data-theme="dark"\]\s*\{([\s\S]*?)\}/, '[data-theme="dark"]');

// @media (prefers-color-scheme: dark) { ... } -- no-JS OS fallback. This
// wraps a nested ":root:not(...) { ... }" rule, so the capture is bounded by
// the first line-start "}" (the @media block's own closing brace), not the
// first "}" encountered (which would be the nested rule's closing brace).
const mediaDarkBlock = extractBlock(/@media \(prefers-color-scheme: dark\) \{([\s\S]*?)\n\}/, '@media (prefers-color-scheme: dark)');

const namedBlocks = [
  ['light :root', rootBlock],
  ['[data-theme="dark"]', darkThemeBlock],
  ['@media (prefers-color-scheme: dark) fallback', mediaDarkBlock],
];

function assertInAllBlocks(re, label) {
  for (const [name, content] of namedBlocks) {
    assert.ok(re.test(content), `${label} missing or malformed in the ${name} block`);
  }
}

function testOldNamesExactValuesUnchanged() {
  // Light mode (:root) -- exact hex values must be unchanged.
  assert.ok(/--green:\s*#15803D\b/.test(rootBlock), '--green light value changed or missing (expected #15803D)');
  assert.ok(/--amber:\s*#B45309\b/.test(rootBlock), '--amber light value changed or missing (expected #B45309)');
  assert.ok(/--red:\s*#B91C1C\b/.test(rootBlock), '--red light value changed or missing (expected #B91C1C)');

  // Dark mode -- both the manual-toggle block and its @media no-JS twin
  // must carry the same exact dark-mode hex values.
  for (const [name, content] of [['[data-theme="dark"]', darkThemeBlock], ['@media dark fallback', mediaDarkBlock]]) {
    assert.ok(/--green:\s*#4ADE80\b/.test(content), `--green dark value changed or missing in ${name} (expected #4ADE80)`);
    assert.ok(/--amber:\s*#FCD34D\b/.test(content), `--amber dark value changed or missing in ${name} (expected #FCD34D)`);
    assert.ok(/--red:\s*#F87171\b/.test(content), `--red dark value changed or missing in ${name} (expected #F87171)`);
  }
}

function testNewAliasesLightModeReferenceOldNamesViaVar() {
  // In LIGHT mode only, DESIGN.md's own --success/--warn/--danger hex values
  // are genuinely identical to --green/--amber/--red (confirmed against
  // DESIGN.md's own light-mode table: success text #15803D == --green
  // #15803D, warn text #B45309 == --amber #B45309, danger text #B91C1C ==
  // --red #B91C1C, and the 3 soft backgrounds match --green-soft/
  // --amber-soft/--red-soft exactly too) -- so a real var() reference here
  // is correct and drift-proof, not just convenient.
  assert.ok(/--success:\s*var\(--green\)/.test(rootBlock), 'light --success must be var(--green)');
  assert.ok(/--success-soft:\s*var\(--green-soft\)/.test(rootBlock), 'light --success-soft must be var(--green-soft)');
  assert.ok(/--warn:\s*var\(--amber\)/.test(rootBlock), 'light --warn must be var(--amber)');
  assert.ok(/--warn-soft:\s*var\(--amber-soft\)/.test(rootBlock), 'light --warn-soft must be var(--amber-soft)');
  assert.ok(/--danger:\s*var\(--red\)/.test(rootBlock), 'light --danger must be var(--red)');
  assert.ok(/--danger-soft:\s*var\(--red-soft\)/.test(rootBlock), 'light --danger-soft must be var(--red-soft)');
}

function testNewAliasesDarkModeAreDESIGNmdOwnDistinctHexValues() {
  // In DARK mode, DESIGN.md defines --success (#34D399) and --warn
  // (#F59E0B) as genuinely DIFFERENT colors from --green (#4ADE80) and
  // --amber (#FCD34D) -- these must NOT be var() aliases here, that would
  // silently repaint them to the wrong hue. --danger (#F87171) happens to
  // share --red's exact dark-mode hex, but is kept as its own literal (not
  // var(--red)) so a future edit to --red cannot silently also move
  // --danger -- DESIGN.md defines it as its own token, not derived from red.
  for (const [name, content] of [['[data-theme="dark"]', darkThemeBlock], ['@media dark fallback', mediaDarkBlock]]) {
    assert.ok(/--success:\s*#34D399\b/.test(content), `dark --success must be its own literal #34D399 in ${name}, not var(--green)`);
    assert.ok(/--success-soft:\s*#0F2318\b/.test(content), `dark --success-soft must be its own literal #0F2318 in ${name}`);
    assert.ok(/--warn:\s*#F59E0B\b/.test(content), `dark --warn must be its own literal #F59E0B in ${name}, not var(--amber)`);
    assert.ok(/--warn-soft:\s*#2A2011\b/.test(content), `dark --warn-soft must be its own literal #2A2011 in ${name}`);
    assert.ok(/--danger:\s*#F87171\b/.test(content), `dark --danger must be its own literal #F87171 in ${name}, not var(--red)`);
    assert.ok(/--danger-soft:\s*#2A1416\b/.test(content), `dark --danger-soft must be its own literal #2A1416 in ${name}`);
  }
}

function testNewTokensSurfaceTwoAndMuted3PresentInAllBlocks() {
  assertInAllBlocks(/--surface-2:\s*#\w{6}/, '--surface-2 (new token, did not exist before)');
  assertInAllBlocks(/--muted-3:\s*#\w{6}/, '--muted-3 (new token, did not exist before)');
}

function testSansFontUpdatedToInterTight() {
  // --sans is theme-invariant and only ever defined once, in the light
  // :root block (dark mode does not override font family).
  assert.ok(/--sans:\s*'Inter Tight'/.test(rootBlock), "--sans must be updated to 'Inter Tight' per DESIGN.md, in the :root block");
}

function testGoogleFontsLinksRequestInterTight() {
  // Both real <link> tags that fetch webfonts must request the Inter Tight
  // family, not plain Inter -- otherwise the --sans token never actually loads.
  const matches = htmlShellSrc.match(/family=Inter\+Tight/g) || [];
  assert.ok(matches.length >= 2, `expected at least 2 occurrences of "family=Inter+Tight" (the Google Fonts <link> tags), found ${matches.length}`);
}

testOldNamesExactValuesUnchanged();
testNewAliasesLightModeReferenceOldNamesViaVar();
testNewAliasesDarkModeAreDESIGNmdOwnDistinctHexValues();
testNewTokensSurfaceTwoAndMuted3PresentInAllBlocks();
testSansFontUpdatedToInterTight();
testGoogleFontsLinksRequestInterTight();
console.log('  ok - all dsa-s1 token checks passed');
