'use strict';

// review-artefact-splitter.js — splits the Web UI's consolidated review
// artefact (one turn, "## Story: [slug]" sections per story, per skills.js's
// upgraded REVIEW PROTOCOL) into individual per-story review files matching
// templates/review-report.md exactly, at the same
// artefacts/[feature]/review/[story-slug]-review-[N].md path convention a
// CLI-driven /review session already uses.
//
// Recognises only the "## Story: [slug]" boundary format the upgraded
// REVIEW PROTOCOL now asks the model to produce. An artefact that doesn't
// contain this marker (e.g. one saved before this fix, or a session that
// disregarded the format) returns [] rather than throwing -- the existing
// flat review.md write is completely unaffected either way.

function fieldRegex(field) {
  // See the identical comment in definition-artefact-splitter.js: real
  // markdown bold closes AFTER the colon ("**Verdict:**"), not before it.
  return new RegExp('^\\*{0,2}' + field + '\\*{0,2}:\\*{0,2}\\s*(.*)$', 'im');
}

function extractField(block, field, fallback) {
  const m = block.match(fieldRegex(field));
  return m && m[1].trim() ? m[1].trim() : (fallback || '');
}

function extractSection(block, headingRe, nextHeadingRe) {
  const startM = block.match(headingRe);
  if (!startM) return '';
  const startIdx = block.indexOf(startM[0]) + startM[0].length;
  const restRe = new RegExp(nextHeadingRe.source, nextHeadingRe.flags.replace('g', ''));
  const rest = block.slice(startIdx);
  const endM = rest.match(restRe);
  return (endM ? rest.slice(0, endM.index) : rest).trim();
}

/**
 * @param {string} md
 * @param {(storySlug: string) => number} nextRunNumber  returns the run
 *   number to use for a given story slug (e.g. existing-file-count + 1),
 *   supplied by the caller since it requires a disk check this pure
 *   function does not perform itself.
 * @returns {Array<{storySlug: string, runNumber: number, content: string}>}
 */
function splitReviewArtefact(md, nextRunNumber) {
  const results = [];
  if (!md) return results;
  // Normalise CRLF -> LF first -- see the identical comment in
  // definition-artefact-splitter.js for why this matters.
  md = md.replace(/\r\n/g, '\n');
  if (!/^## Story:\s*\S+/im.test(md)) return results;

  const today = new Date().toISOString().slice(0, 10);

  md.split(/\n## Story:\s*/).slice(1).forEach(function(storyBlock) {
    const firstLine = storyBlock.split('\n')[0];
    const storySlug = firstLine.trim();
    if (!storySlug) return;

    const highFindings = extractSection(storyBlock, /### HIGH findings\s*\n/i, /\n### (MEDIUM|LOW) findings/i) || 'None.';
    const mediumFindings = extractSection(storyBlock, /### MEDIUM findings\s*\n/i, /\n### LOW findings/i) || 'None.';
    const lowFindings = extractSection(storyBlock, /### LOW findings\s*\n/i, /\n(### Score|\*\*Verdict:\*\*)/i) || 'None.';
    const verdict = extractField(storyBlock, 'Verdict', 'PASS');
    const runNumber = nextRunNumber ? nextRunNumber(storySlug) : 1;

    const content = [
      '# Review Report: ' + storySlug + ' — Run ' + runNumber,
      '',
      '**Story reference:** artefacts/[feature]/stories/' + storySlug + '.md',
      '**Date:** ' + today,
      '**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness',
      '**Outcome:** ' + verdict,
      '',
      '---',
      '',
      '## HIGH findings — must resolve before /test-plan',
      '',
      highFindings,
      '',
      '---',
      '',
      '## MEDIUM findings — resolve or acknowledge in /decisions',
      '',
      mediumFindings,
      '',
      '---',
      '',
      '## LOW findings — note for retrospective',
      '',
      lowFindings,
      '',
      '---',
      '',
      '## Summary',
      '',
      '**Outcome:** ' + verdict
    ].join('\n') + '\n';

    results.push({ storySlug: storySlug, runNumber: runNumber, content: content });
  });

  return results;
}

module.exports = { splitReviewArtefact };
