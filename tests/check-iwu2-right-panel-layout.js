// check-iwu2-right-panel-layout.js — unit tests for iwu.2 right panel restructure
// Verifies that renderChat() emits #assumption-cards and #draft-content as
// two distinct named sections within the right panel.

'use strict';

const { renderChat } = require('../src/web-ui/views/chat-view');

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log('[iwu2] PASS: ' + label);
    passed++;
  } else {
    console.error('[iwu2] FAIL: ' + label);
    failed++;
  }
}

// Minimal mock data — no draftSections (empty state)
const baseData = {
  skillName:           'discovery',
  skillLabel:          'Discovery',
  featureSlug:         'test-feature-slug',
  sessionId:           'test-session-id-001',
  questionIndex:       1,
  totalQuestions:      5,
  currentQuestion:     'What problem are you solving?',
  priorQA:             [],
  draftSections:       [],
  pendingConfirmation: false,
  userInitial:         'T',
  modelLabel:          'test-model',
};

const html = renderChat(baseData);

// AC1: #assumption-cards section exists
assert('AC1: HTML contains id="assumption-cards"', html.includes('id="assumption-cards"'));

// AC2: #draft-content section still exists (backwards compatibility)
assert('AC2: HTML contains id="draft-content"', html.includes('id="draft-content"'));

// AC3: #assumption-cards has placeholder text
assert('AC3: #assumption-cards contains "No assumptions identified yet"', html.includes('No assumptions identified yet'));

// AC4: #assumption-cards has max-height:42% in inline style
assert('AC4: #assumption-cards has max-height:42%', html.includes('max-height:42%'));

// AC5: #assumption-cards has role="region" and aria-label
assert('AC5: #assumption-cards has role="region"', html.includes('role="region"'));
assert('AC5: #assumption-cards has aria-label="Assumption cards"', html.includes('aria-label="Assumption cards"'));

// AC6: #draft-content has role="region" and aria-label
assert('AC6: #draft-content has role="region"', html.includes('role="region"'));
assert('AC6: #draft-content has aria-label="Artefact draft"', html.includes('aria-label="Artefact draft"'));

// AC7: #draft-content has flex:1 (flex:1 1 auto) in inline style
assert('AC7: #draft-content has flex:1 in inline style', html.includes('flex:1 1 auto'));

// AC8: #assumption-cards appears before #draft-content in document order
const assumptionPos = html.indexOf('id="assumption-cards"');
const draftPos      = html.indexOf('id="draft-content"');
assert('AC8: #assumption-cards appears before #draft-content', assumptionPos < draftPos && assumptionPos !== -1);

// AC9: right panel section has explicit flex column layout
assert('AC9: right section has display:flex;flex-direction:column inline', html.includes('display:flex;flex-direction:column'));

// AC10: empty draftSections renders artefact draft placeholder (not the old text)
assert('AC10: placeholder text is updated draft-specific copy',
  html.includes('artefact draft will build up here'));

// With draftSections — verify content still renders inside #draft-content
const dataWithDraft = Object.assign({}, baseData, {
  draftSections: [{ title: 'Problem', body: '<p>Test content</p>', state: 'drafted' }],
});
const htmlWithDraft = renderChat(dataWithDraft);
assert('AC11: draftSections content renders in HTML when provided',
  htmlWithDraft.includes('Test content'));

// #assumption-cards must still exist when draft sections are present
assert('AC12: #assumption-cards present even when draftSections non-empty',
  htmlWithDraft.includes('id="assumption-cards"'));

// Summary
console.log('\n[iwu2] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  process.exit(1);
}
