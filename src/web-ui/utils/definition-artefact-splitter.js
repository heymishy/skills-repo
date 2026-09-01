'use strict';

// definition-artefact-splitter.js — splits the Web UI's consolidated
// definition artefact (one turn, "## Epic N — Name" wrapping
// "### epN-sM — Title" sections, per skills.js's DEFINITION PROTOCOL) into
// individual epic and story files matching templates/epic.md and
// templates/story.md exactly, so a feature defined through the web UI
// produces the same on-disk shape (artefacts/[feature]/epics/[slug].md,
// artefacts/[feature]/stories/[slug].md) a CLI-driven /definition session
// already does.
//
// Deliberately reuses the exact Format-A boundary regexes from
// journey.js's extractStoryIdsFromDefinitionArtefact (dsda-s1/daep-s1) --
// this splitter only recognises Format A (the shape the web UI actually
// produces); an artefact that doesn't match returns { epics: [], stories: [] }
// rather than throwing, mirroring that function's own graceful-degradation
// contract.
//
// Field extraction is genuinely order-independent: real definition
// artefacts (this repo's own production history included) don't reliably
// put fields in any one fixed sequence, and a splitter that assumes
// "Architecture Constraints always comes right before Out of Scope" breaks
// silently the moment a real session writes them in a different order.
// scanFields() finds every recognised field's position first, then derives
// each field's value from the gap to whichever recognised field comes next
// in actual document order -- never from an assumed neighbour.

const FIELD_NAMES = [
  'Persona', 'Domain', 'Benefit linkage', 'Architecture constraints',
  'Out of scope', 'Dependencies', 'NFR', 'Complexity', 'Scope stability',
  'Goal', 'Oversight', 'Oversight rationale', 'Slicing strategy'
];

/**
 * @param {string} field  e.g. "Persona"
 * @returns {RegExp}  matches "**Persona:** value" or "Persona: value" on its own line
 */
function fieldRegex(field) {
  // Real markdown bold wraps the label AND its colon together
  // ("**Persona:**"), so the closing ** comes AFTER the colon, not before
  // it -- both orderings are matched here since some model output bolds
  // only the label ("**Persona**:").
  return new RegExp('^\\*{0,2}' + field + '\\*{0,2}:\\*{0,2}[ \\t]*(.*)$', 'im');
}

/**
 * Finds every recognised field's position and same-line value in a block,
 * sorted by document order, so each field's "section" (its own value plus
 * any wrapped lines) can be derived from the gap to the NEXT found field --
 * never from an assumed fixed neighbour.
 * @param {string} block
 * @returns {Array<{name:string, index:number, lineEnd:number, inlineValue:string}>}
 */
function scanFields(block) {
  const found = [];
  FIELD_NAMES.forEach(function(name) {
    const m = block.match(fieldRegex(name));
    if (!m) return;
    const index = block.indexOf(m[0]);
    found.push({ name: name, index: index, lineEnd: index + m[0].length, inlineValue: m[1].trim() });
  });
  found.sort(function(a, b) { return a.index - b.index; });
  return found;
}

/**
 * @param {Array} sortedFields  from scanFields()
 * @param {string} name
 * @param {string} block
 * @returns {string}  the field's full section (inline value plus any
 *   wrapped lines up to the next recognised field), trimmed
 */
function sectionFor(sortedFields, name, block) {
  const idx = sortedFields.findIndex(function(f) { return f.name === name; });
  if (idx === -1) return '';
  const field = sortedFields[idx];
  const next = sortedFields[idx + 1];
  const end = next ? next.index : block.length;
  // A field's value can be entirely on its own line ("Dependencies: ep1-s2",
  // captured as inlineValue) or entirely on following lines ("Out of
  // scope:" with a bullet list after it, where inlineValue is empty) --
  // combine both, since either can be empty depending on how the model
  // wrote it.
  const wrapped = block.slice(field.lineEnd, end).trim();
  return [field.inlineValue, wrapped].filter(Boolean).join('\n\n').trim();
}

/**
 * The AC block has no field label of its own -- it's the free-text
 * Given/When/Then prose between whichever intro field (Persona, Domain,
 * Benefit linkage) precedes it and whichever field follows it. Identified
 * by content (contains "Given"), not by an assumed position, so it's
 * correct regardless of which fields surround it in a given session's output.
 * @param {Array} sortedFields
 * @param {string} block
 * @returns {string}
 */
function acBlockFor(sortedFields, block) {
  const boundaries = [0].concat(sortedFields.map(function(f) { return f.lineEnd; }));
  const starts = sortedFields.map(function(f) { return f.index; }).concat([block.length]);
  for (let i = 0; i < boundaries.length; i++) {
    const gap = block.slice(boundaries[i], starts[i]).trim();
    if (/\bGiven\b/i.test(gap)) return gap;
  }
  return '';
}

function toSlug(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'untitled';
}

const NONE_IDENTIFIED = 'None identified — checked against .github/architecture-guardrails.md';
const NOT_SPECIFIED = '[Not specified by the definition session]';

/**
 * Split a consolidated Format-A definition artefact into individual epic
 * and story file contents.
 * @param {string} md
 * @param {string} featureSlug
 * @returns {{epics: Array<{slug:string, title:string, content:string}>, stories: Array<{slug:string, title:string, epicSlug:string, content:string}>}}
 */
function splitDefinitionArtefact(md, featureSlug) {
  const result = { epics: [], stories: [] };
  if (!md) return result;
  // Normalise CRLF -> LF first: `.` in JS regex (no /s flag) does not
  // consume a trailing \r, which silently breaks every ^...$-anchored
  // single-line field/header match below on a CRLF-checked-out file
  // (this repo's own git config converts LF -> CRLF on checkout).
  md = md.replace(/\r\n/g, '\n');
  if (!/^## Epic \d+/im.test(md)) return result;

  const discoveryRef = 'artefacts/' + featureSlug + '/discovery.md';
  const benefitMetricRef = 'artefacts/' + featureSlug + '/benefit-metric.md';
  const slicingStrategy = (scanFields(md).find(function(f) { return f.name === 'Slicing strategy'; }) || {}).inlineValue || 'Not specified';

  md.split(/\n## Epic /).slice(1).forEach(function(epicBlock) {
    const firstLine = epicBlock.split('\n')[0];
    if (!/^\d/.test(firstLine)) return;
    const epicHeaderMatch = firstLine.match(/^\d+\s*[—-]\s*(.+)$/);
    const epicTitle = epicHeaderMatch ? epicHeaderMatch[1].trim() : firstLine.trim();
    const epicSlug = toSlug(epicTitle);

    // Split off story sub-blocks; everything before the first "### " is the epic's own body.
    const storyParts = epicBlock.split(/\n### /);
    const epicBody = storyParts[0];
    const epicFields = scanFields(epicBody);

    const goal = sectionFor(epicFields, 'Goal', epicBody) || NOT_SPECIFIED;
    const oversight = (epicFields.find(function(f) { return f.name === 'Oversight'; }) || {}).inlineValue || 'Medium';
    const oversightRationale = sectionFor(epicFields, 'Oversight rationale', epicBody) || NOT_SPECIFIED;
    const epicComplexity = (epicFields.find(function(f) { return f.name === 'Complexity'; }) || {}).inlineValue || '2';
    const epicScopeStability = (epicFields.find(function(f) { return f.name === 'Scope stability'; }) || {}).inlineValue || 'Stable';
    const epicOutOfScope = sectionFor(epicFields, 'Out of scope', epicBody) || NOT_SPECIFIED;

    const storySlugsInEpic = [];
    for (let i = 1; i < storyParts.length; i++) {
      const storyBlock = storyParts[i];
      const storyFirstLine = storyBlock.split('\n')[0];
      const storyIdMatch = storyFirstLine.match(/^([a-z][a-z0-9.-]*)\s*[—-]\s*(.+)$/i);
      if (!storyIdMatch) continue;
      const storyId = storyIdMatch[1].toLowerCase();
      const storyTitle = storyIdMatch[2].trim();
      storySlugsInEpic.push({ storyId: storyId, storyTitle: storyTitle });

      const fields = scanFields(storyBlock);
      const fieldValue = function(name, fallback) {
        const f = fields.find(function(x) { return x.name === name; });
        return (f && f.inlineValue) ? f.inlineValue : (fallback || '');
      };

      const persona = fieldValue('Persona', 'Platform user');
      const domain = fieldValue('Domain', '');
      const architectureConstraints = sectionFor(fields, 'Architecture constraints', storyBlock) || NONE_IDENTIFIED;
      const dependencies = sectionFor(fields, 'Dependencies', storyBlock) || 'None';
      const complexity = fieldValue('Complexity', '2');
      const scopeStability = fieldValue('Scope stability', 'Stable');
      const benefitMetric = sectionFor(fields, 'Benefit linkage', storyBlock);
      const acBlock = acBlockFor(fields, storyBlock) || NOT_SPECIFIED;
      const outOfScope = sectionFor(fields, 'Out of scope', storyBlock) || NOT_SPECIFIED;
      const nfr = sectionFor(fields, 'NFR', storyBlock) || 'None identified';

      const storySlug = storyId;
      const storyContent = [
        '## Story: ' + storyTitle,
        '',
        '**Epic reference:** artefacts/' + featureSlug + '/epics/' + epicSlug + '.md',
        '**Discovery reference:** ' + discoveryRef,
        '**Benefit-metric reference:** ' + benefitMetricRef,
        domain ? '**Domain:** ' + domain : '',
        '',
        '## User Story',
        '',
        'As a **' + persona + '**,',
        'So that ' + (benefitMetric || '[observable outcome]') + '.',
        '',
        '## Benefit Linkage',
        '',
        benefitMetric || NOT_SPECIFIED,
        '',
        '## Architecture Constraints',
        '',
        architectureConstraints,
        '',
        '## Dependencies',
        '',
        dependencies,
        '',
        '## Acceptance Criteria',
        '',
        acBlock,
        '',
        '## Out of Scope',
        '',
        outOfScope,
        '',
        '## NFRs',
        '',
        nfr,
        '',
        '## Complexity Rating',
        '',
        '**Rating:** ' + complexity,
        '**Scope stability:** ' + scopeStability,
        '',
        '## Definition of Ready Pre-check',
        '',
        '<!-- Populated at /definition-of-ready. -->'
      ].filter(function(line) { return line !== ''; }).join('\n') + '\n';

      result.stories.push({ slug: storySlug, title: storyTitle, epicSlug: epicSlug, content: storyContent });
    }

    const storiesList = storySlugsInEpic.map(function(s) {
      return '- [ ] ' + s.storyTitle + ' — artefacts/' + featureSlug + '/stories/' + s.storyId + '.md';
    }).join('\n') || '- ' + NOT_SPECIFIED;

    const epicContent = [
      '## Epic: ' + epicTitle,
      '',
      '**Discovery reference:** ' + discoveryRef,
      '**Benefit-metric reference:** ' + benefitMetricRef,
      '**Slicing strategy:** ' + slicingStrategy,
      '',
      '## Goal',
      '',
      goal,
      '',
      '## Out of Scope',
      '',
      epicOutOfScope,
      '',
      '## Benefit Metrics Addressed',
      '',
      '[See benefit-metric artefact: ' + benefitMetricRef + ']',
      '',
      '## Stories in This Epic',
      '',
      storiesList,
      '',
      '## Human Oversight Level',
      '',
      '**Oversight:** ' + oversight,
      '**Rationale:** ' + oversightRationale,
      '',
      '## Complexity Rating',
      '',
      '**Rating:** ' + epicComplexity,
      '',
      '## Scope Stability',
      '',
      '**Stability:** ' + epicScopeStability
    ].join('\n') + '\n';

    result.epics.push({ slug: epicSlug, title: epicTitle, content: epicContent });
  });

  return result;
}

module.exports = { splitDefinitionArtefact, toSlug };
