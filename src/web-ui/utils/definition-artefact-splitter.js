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
 * @param {Array<number>} [excludeStarts]  document indices (from
 *   findGapMatch()) where a special unlabeled prose region -- the AC block,
 *   the "So that X, I need Y." sentence -- begins. A field's own section
 *   never extends past the nearest such index, even when that index comes
 *   before the next recognised field: without this, a field immediately
 *   followed (in THIS document's actual field order) by one of those
 *   unlabeled regions silently absorbs it into its own captured value,
 *   and the region then also gets extracted a second time by whichever
 *   dedicated scan (findGapMatch with the Given/So-that predicate) was
 *   looking for it -- asf-s1: this produced a duplicated, orphaned
 *   Given/When/Then block under whichever field happened to precede it.
 * @returns {string}  the field's full section (inline value plus any
 *   wrapped lines up to the next recognised field, or the nearest excluded
 *   region if closer), trimmed
 */
function sectionFor(sortedFields, name, block, excludeStarts) {
  const idx = sortedFields.findIndex(function(f) { return f.name === name; });
  if (idx === -1) return '';
  const field = sortedFields[idx];
  const next = sortedFields[idx + 1];
  let end = next ? next.index : block.length;
  (excludeStarts || []).forEach(function(pos) {
    if (pos > field.lineEnd && pos < end) end = pos;
  });
  // A field's value can be entirely on its own line ("Dependencies: ep1-s2",
  // captured as inlineValue) or entirely on following lines ("Out of
  // scope:" with a bullet list after it, where inlineValue is empty) --
  // combine both, since either can be empty depending on how the model
  // wrote it.
  const wrapped = block.slice(field.lineEnd, end).trim();
  return [field.inlineValue, wrapped].filter(Boolean).join('\n\n').trim();
}

// asf-s1: matches the DEFINITION PROTOCOL (Web UI)'s instructed sentence
// ("So that [goal], I need [user need]." -- skills.js's DEFINITION PROTOCOL
// section) so the real "I want" content can be recovered instead of the
// User Story template omitting that clause entirely. "I need" is optional
// (non-capturing) because real model output sometimes phrases the second
// clause without that literal phrase (e.g. "So that I don't have to choose
// which skill to run next, the web UI automatically routes me..." -- no "I
// need" present at all) -- group 2 still captures whatever mechanism text
// follows the comma either way. Applied only to an already-isolated
// so-that portion (see findSpecialRegions) -- anchored start-to-end so a
// portion containing anything beyond this one sentence intentionally does
// not match, degrading to the fallback placeholder rather than risking a
// wrong split.
const SO_THAT_I_WANT_RE = /^\*{0,2}So that\*{0,2}\s+(.+?),\s*(?:\*{0,2}I need\*{0,2}\s+)?(.+?)\.\s*$/is;

/**
 * Locates the two kinds of unlabeled special prose a real definition
 * artefact can contain: the "So that [goal], I need [need]." sentence, and
 * the Given/When/Then AC block. Both are identified by content, not an
 * assumed position, so this is correct regardless of which recognised
 * fields surround them in a given session's output.
 *
 * Critically, both can appear in the SAME gap between two recognised
 * fields -- this repo's own real production content does exactly this
 * (Persona directly followed by both, before the next recognised field).
 * asf-s1: naively regex-matching the whole gap for each pattern
 * independently let the so-that sentence's own non-greedy match run all
 * the way through the trailing AC block hunting for a satisfying final
 * period, silently absorbing it. Since the AC block reliably starts at
 * its own "Given" marker, a gap containing both is split there first --
 * the so-that pattern is only ever tested against the portion BEFORE
 * "Given", never the whole gap.
 *
 * The returned index for each region is used by sectionFor()'s
 * excludeStarts so neither region can be silently absorbed into an
 * adjacent labeled field's own captured section either.
 *
 * @param {Array} sortedFields
 * @param {string} block
 * @returns {{acBlock: {text:string,index:number}|null, soThat: {text:string,index:number,goal:string,need:string}|null}}
 */
function findSpecialRegions(sortedFields, block) {
  const boundaries = [0].concat(sortedFields.map(function(f) { return f.lineEnd; }));
  const starts = sortedFields.map(function(f) { return f.index; }).concat([block.length]);
  let acBlock = null;
  let soThat = null;
  for (let i = 0; i < boundaries.length; i++) {
    const rawGap = block.slice(boundaries[i], starts[i]);
    const gap = rawGap.trim();
    if (!gap) continue;
    const gapStart = boundaries[i] + rawGap.indexOf(gap);
    const givenMatch = gap.match(/^\*{0,2}Given\b/im);

    const soThatPortion = givenMatch ? gap.slice(0, givenMatch.index).trim() : gap;
    const acPortion = givenMatch ? gap.slice(givenMatch.index).trim() : '';

    if (!acBlock && givenMatch) {
      acBlock = { text: acPortion, index: gapStart + givenMatch.index };
    }
    if (!soThat && soThatPortion) {
      const m = soThatPortion.match(SO_THAT_I_WANT_RE);
      if (m) soThat = { text: soThatPortion, index: gapStart, goal: m[1].trim(), need: m[2].trim() };
    }
  }
  return { acBlock: acBlock, soThat: soThat };
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

      // asf-s1: locate both unlabeled special-prose regions FIRST so every
      // sectionFor() call below can exclude them -- prevents either one
      // from being silently absorbed into whichever labeled field happens
      // to precede it in this document's actual field order.
      const _special = findSpecialRegions(fields, storyBlock);
      const acMatch = _special.acBlock;
      const soThatMatch = _special.soThat;
      const excludeStarts = [acMatch, soThatMatch].filter(Boolean).map(function(m) { return m.index; });
      const sectionForExcl = function(name) { return sectionFor(fields, name, storyBlock, excludeStarts); };

      const persona = fieldValue('Persona', 'Platform user');
      const domain = fieldValue('Domain', '');
      const architectureConstraints = sectionForExcl('Architecture constraints') || NONE_IDENTIFIED;
      const dependencies = sectionForExcl('Dependencies') || 'None';
      const complexity = fieldValue('Complexity', '2');
      const scopeStability = fieldValue('Scope stability', 'Stable');
      const benefitMetric = sectionForExcl('Benefit linkage');
      const acBlock = (acMatch && acMatch.text) || NOT_SPECIFIED;
      const outOfScope = sectionForExcl('Out of scope') || NOT_SPECIFIED;
      const nfr = sectionForExcl('NFR') || 'None identified';
      // asf-s1: the real "I want"/"So that" clauses, recovered from the
      // model's own "So that [goal], I need [need]." sentence -- never
      // reuse benefitMetric here, which is a different field (Benefit
      // Linkage) that already gets its own section below; doing so
      // previously produced verbatim-duplicated text and permanently
      // omitted "I want" entirely.
      const iWant = (soThatMatch && soThatMatch.need) || '[user need not specified by the definition session]';
      const soThatGoal = (soThatMatch && soThatMatch.goal) || '[observable outcome not specified by the definition session]';

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
        'I want **' + iWant + '**,',
        'So that **' + soThatGoal + '**.',
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
