'use strict';

// annotation-utils.js — content validation, sanitisation, and formatting for artefact annotations (wuce.8)
// Security: sanitiseAnnotationContent strips HTML/script tags server-side before any commit.
// Max length: 2000 characters enforced server-side via validateAnnotationLength.

const MAX_ANNOTATION_LENGTH = 2000;

/**
 * Strip HTML and script tags from annotation content.
 * Security constraint: called server-side before commitAnnotation — no raw HTML persisted (AC4).
 * @param {string} content
 * @returns {string}
 */
function sanitiseAnnotationContent(content) {
  if (typeof content !== 'string') return '';
  // First strip script blocks with their content (XSS prevention)
  let result = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  // Then strip all remaining HTML tags
  result = result.replace(/<[^>]*>/g, '');
  return result;
}

/**
 * Validate annotation length. Max 2000 characters (AC5).
 * @param {string} content
 * @returns {boolean} true if within limit, false if over
 */
function validateAnnotationLength(content) {
  if (typeof content !== 'string') return false;
  return content.length <= MAX_ANNOTATION_LENGTH;
}

/**
 * Build a markdown annotation block to append to an artefact's ## Annotations section.
 * @param {string} annotatorName - GitHub display name of the annotating user
 * @param {string} sectionHeading - the section heading being annotated
 * @param {string} annotationText - the annotation body (already sanitised)
 * @param {string} timestamp - ISO 8601 timestamp
 * @returns {string} formatted annotation block (no leading ## Annotations heading)
 */
function buildAnnotationBlock(annotatorName, sectionHeading, annotationText, timestamp) {
  return (
    '### On section: ' + sectionHeading + '\n\n' +
    '**' + annotatorName + '** \u2014 ' + timestamp + '\n\n' +
    annotationText + '\n'
  );
}

/**
 * Append an annotation to artefact markdown. Creates ## Annotations section if absent.
 * @param {string} artefactContent - full artefact markdown
 * @param {string} annotatorName
 * @param {string} sectionHeading
 * @param {string} annotationText
 * @param {string} timestamp
 * @returns {string} updated markdown with annotation appended
 */
function appendAnnotation(artefactContent, annotatorName, sectionHeading, annotationText, timestamp) {
  const block = buildAnnotationBlock(annotatorName, sectionHeading, annotationText, timestamp);
  const HEADER = '## Annotations';
  const idx = artefactContent.indexOf(HEADER);
  if (idx !== -1) {
    return artefactContent.trimEnd() + '\n\n' + block;
  }
  return artefactContent.trimEnd() + '\n\n' + HEADER + '\n\n' + block;
}

/**
 * Parse existing annotations from artefact markdown (AC3).
 * Returns array of { annotatorName, date, sectionHeading, text }.
 * Returns [] if no ## Annotations section exists.
 * @param {string} artefactContent
 * @returns {Array<{ annotatorName: string, date: string, sectionHeading: string, text: string }>}
 */
function parseExistingAnnotations(artefactContent) {
  if (typeof artefactContent !== 'string') return [];
  // Normalise CRLF to LF so regex matches consistently across platforms
  const normalised = artefactContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const HEADER = '## Annotations';
  const idx = normalised.indexOf(HEADER);
  if (idx === -1) return [];

  const section = normalised.slice(idx + HEADER.length).trim();
  if (!section) return [];

  const results = [];
  const blockRe = /### On section: ([^\n]+)\n\n\*\*([^*]+)\*\* \u2014 ([^\n]+)\n\n([\s\S]*?)(?=\n### On section:|\s*$)/g;
  let m;
  while ((m = blockRe.exec(section)) !== null) {
    results.push({
      sectionHeading: m[1].trim(),
      annotatorName:  m[2].trim(),
      date:           m[3].trim(),
      text:           m[4].trim()
    });
  }
  return results;
}

module.exports = {
  sanitiseAnnotationContent,
  validateAnnotationLength,
  buildAnnotationBlock,
  appendAnnotation,
  parseExistingAnnotations,
  MAX_ANNOTATION_LENGTH
};
