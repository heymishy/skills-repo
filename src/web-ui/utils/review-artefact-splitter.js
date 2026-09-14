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
//
// asf-s1: real model output sometimes ignores the instructed per-story
// HIGH/MEDIUM/LOW findings + flat "**Verdict:** PASS|FAIL" shape and falls
// back to skills/review/SKILL.md's own native Category A-E structure
// instead (e.g. "### Verdict: **FAIL** (Category C)" -- heading-prefixed,
// with a trailing parenthetical, findings embedded as inline
// "**Finding N-XX:**" prose under "### Category C: AC Quality" rather than
// under a dedicated "### HIGH findings" heading). The original version of
// this file's verdict extraction defaulted unconditionally to 'PASS' on any
// non-match -- a review that could not be parsed silently became an
// apparent pass, unblocking /test-plan for stories that had actually
// failed. Fixed here: verdict extraction now also recognises the
// heading-prefixed/decorated form, and when a verdict genuinely cannot be
// determined under either recognised form, no split file is written for
// that story at all (matching splitDefinitionArtefact's own "return
// nothing rather than write something wrong" contract) -- never a silent
// default to PASS.

function fieldRegex(field) {
  // See the identical comment in definition-artefact-splitter.js: real
  // markdown bold closes AFTER the colon ("**Verdict:**"), not before it.
  // asf-s1: an optional "#{1,6} " heading prefix is now tolerated too --
  // real model output sometimes writes "### Verdict: ..." as a heading
  // rather than a flat bold line.
  return new RegExp('^#{0,6}\\s*\\*{0,2}' + field + '\\*{0,2}:\\*{0,2}\\s*(.*)$', 'im');
}

function extractField(block, field, fallback) {
  const m = block.match(fieldRegex(field));
  return m && m[1].trim() ? m[1].trim() : (fallback || '');
}

/**
 * asf-s1: resolves a story's verdict to exactly 'PASS' or 'FAIL', or null
 * if it cannot be confidently determined -- callers must never substitute
 * a default of their own for null (see splitReviewArtefact).
 * Recognises the instructed flat form ("**Verdict:** PASS") and the
 * heading-prefixed/decorated form real output sometimes uses instead
 * ("### Verdict: **FAIL** (Category C)") -- in either case, PASS/FAIL is
 * read from whatever the captured value actually says (a trailing
 * parenthetical or other decoration does not prevent a match), not from
 * position or formatting alone.
 * @param {string} block
 * @returns {'PASS'|'FAIL'|null}
 */
function extractVerdict(block) {
  const raw = extractField(block, 'Verdict', '');
  if (!raw) return null;
  const isFail = /\bFAIL\b/i.test(raw);
  const isPass = /\bPASS\b/i.test(raw);
  if (isFail && !isPass) return 'FAIL';
  if (isPass && !isFail) return 'PASS';
  return null; // both or neither present -- genuinely ambiguous, do not guess
}

/**
 * @returns {string|null}  the section's trimmed content, '' if the heading
 *   was found but its content is blank, or null if the heading itself was
 *   never found at all -- callers need this distinction to tell "genuinely
 *   no findings" apart from "this artefact doesn't use the instructed
 *   per-severity heading structure at all" (asf-s1).
 */
function extractSection(block, headingRe, nextHeadingRe) {
  const startM = block.match(headingRe);
  if (!startM) return null;
  const startIdx = block.indexOf(startM[0]) + startM[0].length;
  const restRe = new RegExp(nextHeadingRe.source, nextHeadingRe.flags.replace('g', ''));
  const rest = block.slice(startIdx);
  const endM = rest.match(restRe);
  return (endM ? rest.slice(0, endM.index) : rest).trim();
}

const FINDINGS_FORMAT_NOTE = '[Could not reliably extract per-severity findings from this artefact\'s format -- see the source review turn directly for details. The Outcome above is still accurate.]';

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

    const verdict = extractVerdict(storyBlock);
    if (!verdict) {
      // asf-s1: fail safe, not silently PASS -- skip this story's split
      // file entirely rather than write one with a guessed outcome. The
      // flat review artefact this was derived from remains the durable,
      // accurate record.
      console.warn(JSON.stringify({ event: 'review_split_verdict_unparseable', storySlug: storySlug }));
      return;
    }

    const highRaw = extractSection(storyBlock, /### HIGH findings\s*\n/i, /\n### (MEDIUM|LOW) findings/i);
    const mediumRaw = extractSection(storyBlock, /### MEDIUM findings\s*\n/i, /\n### LOW findings/i);
    const lowRaw = extractSection(storyBlock, /### LOW findings\s*\n/i, /\n(### Score|\*\*Verdict:\*\*)/i);
    // asf-s1: null (heading never found) gets the honest format-mismatch
    // note, not "None." -- "None." must only ever mean the heading was
    // present and genuinely empty.
    const highFindings = highRaw === null ? FINDINGS_FORMAT_NOTE : (highRaw || 'None.');
    const mediumFindings = mediumRaw === null ? FINDINGS_FORMAT_NOTE : (mediumRaw || 'None.');
    const lowFindings = lowRaw === null ? FINDINGS_FORMAT_NOTE : (lowRaw || 'None.');
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
