'use strict';

function extractArtefactFromEvents(events) {
  if (!Array.isArray(events)) { return { content: null, complete: false }; }
  let content  = null;
  let complete = false;
  for (const event of events) {
    if (event && event.type === 'artefact') {
      content  = event.content != null ? event.content : content;
      if (event.phase === 'complete') { complete = true; }
    }
  }
  return { content, complete };
}

module.exports = { extractArtefactFromEvents };
