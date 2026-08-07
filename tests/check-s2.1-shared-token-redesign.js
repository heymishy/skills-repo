#!/usr/bin/env node
// check-s2.1-shared-token-redesign.js — AC verification tests for s2.1
// Story: artefacts/2026-07-24-interactive-kanban-boards/stories/s2.1-shared-token-redesign.md
// Test plan: artefacts/2026-07-24-interactive-kanban-boards/test-plans/s2.1-shared-token-redesign-test-plan.md
// Tests: noRawHexColoursInLiveRenderer (AC1), darkThemeOverrideBlockPresent (AC3 static part)
// No external dependencies — Node.js built-ins only.

'use strict';

const path = require('path');
const ROOT = path.join(__dirname, '..');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log('  ✓ ' + label); passed++; }
  else           { console.log('  ✗ ' + label); failed++; }
}

const { _renderKanbanColumns } = require('../src/web-ui/views/kanban-view.js');

function representativeFixture() {
  return {
    columns: [
      {
        stage: 'discovery',
        cards: [
          { id: 'j1', title: 'Card One', health: 'green', ready: true },
          { id: 'j2', title: 'Card Two', health: 'amber', ready: false },
          { id: 'j3', title: 'Card Three', health: 'red', validationFailed: true, validationFailedReason: 'bad artefact', ready: true }
        ]
      },
      { stage: 'review', cards: [] }
    ]
  };
}

console.log('\n[s2.1] noRawHexColoursInLiveRenderer -- AC1');
{
  const html = _renderKanbanColumns(representativeFixture());
  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
  assert(!!styleMatch, 'style block found in rendered output');
  const styleBlock = styleMatch ? styleMatch[1] : '';
  const hexMatches = styleBlock.match(/#[0-9a-fA-F]{3,8}/g);
  assert(!hexMatches, 'zero raw hex colour values remain in the CSS block (found: ' + (hexMatches ? hexMatches.join(', ') : 'none') + ')');
  const varCount = (styleBlock.match(/var\(--/g) || []).length;
  assert(varCount >= 20, 'colour references use var(--token-name) (found ' + varCount + ' var(--...) usages)');
}

console.log('\n[s2.1] darkThemeOverrideBlockPresent -- AC3 (static part)');
{
  const html = _renderKanbanColumns(representativeFixture());
  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
  const styleBlock = styleMatch ? styleMatch[1] : '';
  assert(!/\[data-theme=["']dark["']\]/.test(styleBlock), 'no kanban-board-specific [data-theme="dark"] override authored locally');
  assert(!/prefers-color-scheme/.test(styleBlock), 'no kanban-board-specific @media (prefers-color-scheme) override authored locally');
  // The board relies entirely on the shared html-shell.js tokens cascading
  // through -- confirm the same token names referenced here are the ones
  // html-shell.js's dark-theme override block actually redefines.
  const htmlShellSrc = require('fs').readFileSync(path.join(ROOT, 'src', 'web-ui', 'utils', 'html-shell.js'), 'utf8');
  const darkBlockMatch = htmlShellSrc.match(/\[data-theme="dark"\] \{([\s\S]*?)\}/);
  assert(!!darkBlockMatch, 'html-shell.js defines a [data-theme="dark"] override block');
  const darkTokens = darkBlockMatch ? (darkBlockMatch[1].match(/--[a-z0-9-]+(?=:)/g) || []) : [];
  const usedTokens = Array.from(new Set((styleBlock.match(/var\((--[a-z0-9-]+)/g) || []).map(function(m) { return m.replace('var(', ''); })));
  const coveredByDarkOverride = usedTokens.filter(function(t) { return darkTokens.indexOf(t) !== -1; });
  assert(coveredByDarkOverride.length > 0, 'kanban board CSS references at least one token redefined by html-shell.js\'s existing dark-theme override block (found: ' + coveredByDarkOverride.join(', ') + ')');
}

console.log('\n[s2.1] Accessibility preserved -- health label stays alongside colour (not colour-only)');
{
  const html = _renderKanbanColumns(representativeFixture());
  assert(html.includes('kb-health-label'), 'health label element still present');
  assert(html.includes('Healthy') || html.includes('Warning') || html.includes('Blocked'), 'plain-language health text still rendered alongside colour treatment');
}

console.log('\n[s2.1] Results: ' + passed + ' passed, ' + failed + ' failed\n');
if (failed > 0) process.exit(1);
