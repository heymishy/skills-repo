'use strict';
// sanitiseArtefactContent(raw) → string
// Strips <script>, <iframe>, and all other HTML tags from artefact content.
// Preserves clean markdown.
module.exports = { sanitiseArtefactContent };
function sanitiseArtefactContent(raw) {
  if (typeof raw !== 'string') { return ''; }
  // Strip <script>...</script> blocks (including content)
  var result = raw.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  // Strip <iframe>...</iframe> blocks
  result = result.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '');
  // Strip remaining HTML tags (but NOT their text content)
  result = result.replace(/<[^>]+>/g, '');
  return result;
}
