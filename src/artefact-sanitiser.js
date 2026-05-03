'use strict';

const SCRIPT_BLOCK   = /<script[\s\S]*?<\/script>/gi;
const IFRAME_BLOCK   = /<iframe[\s\S]*?(?:<\/iframe>|>)/gi;
const EVENT_ATTRS    = /\s(on\w+)="[^"]*"/gi;
const DANGEROUS_TAGS = /<(embed|object|form|input|button|link|meta)[^>]*>/gi;

function sanitiseArtefactContent(raw) {
  if (typeof raw !== 'string') { return ''; }
  let clean = raw;
  clean = clean.replace(SCRIPT_BLOCK, '');
  clean = clean.replace(IFRAME_BLOCK, '');
  clean = clean.replace(EVENT_ATTRS, '');
  clean = clean.replace(DANGEROUS_TAGS, '');
  return clean;
}

module.exports = { sanitiseArtefactContent };
