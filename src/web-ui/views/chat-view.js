'use strict';

// chat-view.js — split-pane skill chat (left: thread, right: live draft).
// Server-rendered each request from session state. No client JS.

const { escHtml } = require('../utils/html-shell');
const { pill, btn } = require('./components');

// minimal **bold** + *italic* + `code` for assistant turns.
// All input is escaped first.
function lightMarkdown(text) {
  let s = escHtml(text || '');
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*]+?)\*/g, '$1<em>$2</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  return s.replace(/\n/g, '<br>');
}

/**
 * @param {object} data
 * @param {string} data.skillName
 * @param {string} data.skillLabel              human-readable, e.g. 'Story shaping'
 * @param {string} data.featureSlug
 * @param {string} data.sessionId
 * @param {number} data.questionIndex           1-based
 * @param {number} data.totalQuestions
 * @param {string} data.currentQuestion         text of next question
 * @param {Array<{question, answer, modelResponse}>} data.priorQA
 * @param {Array<{title, body, state}>} data.draftSections   state ∈ 'drafted'|'pending'|'empty'
 * @param {boolean} data.pendingConfirmation
 */
function renderChat(data) {
  const messages = [];

  (data.priorQA || []).forEach(function(qa, i) {
    if (qa.question) {
      messages.push(
        '<div class="sw-chat-msg sw-chat-msg--assistant msg--assistant">' +
          '<div class="sw-avatar sw-avatar--assistant">✦</div>' +
          '<div class="sw-chat-body"><div class="sw-chat-from">Skill</div>' +
          '<div class="sw-chat-text">' + lightMarkdown(qa.question) + '</div></div>' +
        '</div>'
      );
    }
    messages.push(
      '<div class="sw-chat-msg msg--user">' +
        '<div class="sw-avatar">' + escHtml((data.userInitial || 'M')) + '</div>' +
        '<div class="sw-chat-body"><div class="sw-chat-from">You</div>' +
        '<div class="sw-chat-text">' + lightMarkdown(qa.answer) + '</div></div>' +
      '</div>'
    );
    if (qa.modelResponse) {
      messages.push(
        '<div class="sw-chat-insight">' +
          '<div class="sw-chat-insight-label">Coach insight</div>' +
          lightMarkdown(qa.modelResponse) +
        '</div>'
      );
    }
  });

  // Current question (assistant turn awaiting user)
  if (data.currentQuestion) {
    messages.push(
      '<div class="sw-chat-msg sw-chat-msg--assistant msg--assistant">' +
        '<div class="sw-avatar sw-avatar--assistant">✦</div>' +
        '<div class="sw-chat-body"><div class="sw-chat-from">Skill</div>' +
        '<div class="sw-chat-text">' + lightMarkdown(data.currentQuestion) + '</div></div>' +
      '</div>'
    );
  }

  const draftSections = (data.draftSections || []).map(function(s) {
    let pillHtml = '';
    if (s.state === 'drafted') pillHtml = pill('green',  'Drafted', { dot: false });
    else if (s.state === 'pending') pillHtml = pill('amber',  'Confirm',  { dot: false });
    else pillHtml = pill('neutral','Not yet',  { dot: false });

    const body = s.body
      ? '<div class="sw-draft-body" style="' +
          (s.state === 'pending' ? 'color:var(--muted);font-style:italic' : '') +
        '">' + escHtml(s.body) + '</div>'
      : '<div class="sw-draft-empty">— answer the next questions to draft this section —</div>';

    return '<div class="sw-draft-section">' +
      '<div class="sw-draft-head"><h2>' + escHtml(s.title) + '</h2>' + pillHtml + '</div>' +
      body +
    '</div>';
  }).join('');

  // Confirmation banner if a section draft is pending
  const confirmBanner = data.pendingConfirmation ? [
    '<div class="sw-chat-confirm">',
      '<div class="sw-chat-confirm-title">Section draft ready</div>',
      '<p>I\'ve drafted a section from your last few answers. Type <code>confirm</code> to accept,',
      ' or <code>edit: …</code> to provide your own version.</p>',
    '</div>'
  ].join('') : '';

  const formAction = '/api/skills/' + escHtml(data.skillName) + '/sessions/' +
    escHtml(data.sessionId) + '/answer';

  return [
    '<style>',
      '.sw-chat { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 24px; height: calc(100vh - 48px - 64px); max-height: 820px; }',
      '.sw-chat-pane { display: flex; flex-direction: column; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; min-width: 0; }',
      '.sw-chat-head { padding: 14px 20px; border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; gap: 12px; }',
      '.sw-chat-head .sw-chat-title { font-size: 14px; font-weight: 600; }',
      '.sw-chat-head .sw-chat-sub   { font-size: 12px; color: var(--muted); margin-top: 2px; }',
      '.sw-chat-progress { display: flex; gap: 4px; align-items: center; }',
      '.sw-chat-thread { flex: 1; overflow: auto; padding: 20px 20px 8px; display: flex; flex-direction: column; gap: 18px; }',
      '.sw-chat-system { align-self: center; font-size: 12px; color: var(--muted); padding: 4px 12px; background: var(--line-2); border-radius: 12px; }',
      '.sw-chat-msg { display: flex; gap: 10px; align-items: flex-start; }',
      '.sw-chat-msg .sw-avatar { flex: 0 0 24px; width: 24px; height: 24px; }',
      '.sw-avatar--assistant { background: var(--ink) !important; color: #fff !important; }',
      '.sw-chat-body { flex: 1; min-width: 0; }',
      '.sw-chat-from { font-size: 12px; color: var(--muted); margin-bottom: 3px; }',
      '.sw-chat-text { font-size: 14px; color: var(--ink); line-height: 1.6; }',
      '.sw-chat-insight { margin-left: 32px; padding: 10px 12px; background: var(--accent-soft); border: 1px solid #DDD6FE; border-radius: 8px; font-size: 13px; color: var(--accent-ink); line-height: 1.55; }',
      '.sw-chat-insight-label { font-size: 11px; font-weight: 600; letter-spacing: 0.3px; text-transform: uppercase; margin-bottom: 4px; opacity: 0.8; }',
      '.sw-chat-foot { border-top: 1px solid var(--line); padding: 12px; background: var(--bg); }',
      '.sw-chat-input { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 10px; }',
      '.sw-chat-input textarea { width: 100%; min-height: 56px; border: none; background: transparent; resize: none; outline: none; font-family: inherit; font-size: 14px; line-height: 1.5; color: var(--ink); }',
      '.sw-chat-input-row { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }',
      '.sw-chat-confirm { margin: 0 0 8px; padding: 10px 12px; background: var(--amber-soft); border: 1px solid #FDE68A; border-radius: 8px; font-size: 13px; color: var(--amber); }',
      '.sw-chat-confirm-title { font-weight: 600; margin-bottom: 4px; }',
      '.sw-chat-confirm code { background: rgba(180,83,9,0.1); padding: 1px 5px; border-radius: 3px; font-family: var(--mono); font-size: 12px; }',
      '.sw-draft-body { font-family: var(--serif); font-size: 14.5px; line-height: 1.65; color: var(--ink-2); white-space: pre-wrap; }',
      '.sw-draft-empty { font-size: 13px; color: var(--muted-2); }',
      '.sw-draft-section { margin-bottom: 24px; }',
      '.sw-draft-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }',
      '.sw-draft-head h2 { margin: 0; font-size: 15px; font-weight: 600; font-family: var(--sans); }',
    '</style>',
    '<div class="sw-chat">',

      // LEFT: chat thread
      '<section class="sw-chat-pane">',
        '<header class="sw-chat-head">',
          '<div>',
            '<div class="sw-chat-title">' + escHtml(data.skillLabel) + '</div>',
          '</div>',
          (data.modelLabel ? '<span style="font-size:11px;color:var(--muted);background:var(--line-2);padding:2px 8px;border-radius:10px;font-family:var(--mono)">' + escHtml(data.modelLabel) + '</span>' : ''),
        '</header>',
        '<div class="sw-chat-thread" id="chat-messages">' + messages.join('') + '</div>',
        '<footer class="sw-chat-foot">',
          confirmBanner,
          '<form method="POST" action="' + formAction + '" id="chat-form">',
            '<div class="sw-chat-input">',
              '<textarea id="chat-input" name="answer" placeholder="Type your answer…" autofocus></textarea>',
              '<div class="sw-chat-input-row">',
                '<span style="font-size:12px;color:var(--muted)">Press ⌘↵ or Ctrl+↵ to send</span>',
                btn('primary', 'Send →', { type: 'submit' }),
              '</div>',
            '</div>',
          '</form>',
        '</footer>',
      '</section>',

      // RIGHT: live draft
      '<section class="sw-chat-pane">',
        '<header class="sw-chat-head">',
          '<div>',
            '<div class="sw-chat-title">Live draft · ' + escHtml(data.featureSlug || '') + '</div>',
            '<div class="sw-chat-sub">Updates as you answer</div>',
          '</div>',
        '</header>',
        '<div id="draft-content" style="flex:1;overflow:auto;padding:24px 28px">',
          '<div style="font-size:12px;color:var(--muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.4px;font-weight:500">Draft</div>',
          '<h1 style="font-family:var(--serif);font-size:24px;font-weight:600;margin:0 0 24px;letter-spacing:-0.3px">' +
            escHtml(data.skillLabel + ' — ' + (data.featureSlug || '')) + '</h1>',
          (draftSections || '<p style="color:var(--muted);font-size:13px">The draft will build up here as you answer.</p>'),
        '</div>',
      '</section>',

    '</div>',
    // Cmd/Ctrl+Enter to submit (one tiny inline script — kept here so the
    // chat keystroke lives next to the form it acts on)
    '<script>',
      'document.addEventListener("keydown",function(e){',
        'if((e.metaKey||e.ctrlKey)&&e.key==="Enter"){',
          'var f=document.getElementById("chat-form");if(f)f.submit();',,
        '}',
      '});',
    '</script>'
  ].join('');
}

module.exports = { renderChat };
