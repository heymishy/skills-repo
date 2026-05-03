'use strict';
// extractArtefactFromEvents(events) → { content: string|null, complete: boolean }
// Scans ParsedEvent array for type:'artefact' events. Last one wins.
// phase:'complete' → complete:true. No artefact events → {content:null, complete:false}.
module.exports = { extractArtefactFromEvents };
function extractArtefactFromEvents(events) {
  var content = null;
  var complete = false;
  for (var i = 0; i < events.length; i++) {
    var ev = events[i];
    if (ev.type === 'artefact') {
      content = ev.content;
      if (ev.phase === 'complete') { complete = true; }
    }
  }
  return { content: content, complete: complete };
}
