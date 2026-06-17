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
      '.sw-avatar--assistant { background: var(--ink) !important; color: var(--bg) !important; }',
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
      '@keyframes sw-dot-pulse { 0%,60%,100% { opacity:0.25; transform:translateY(0); } 30% { opacity:1; transform:translateY(-3px); } }',
      '.sw-thinking { display:inline-flex; gap:4px; align-items:center; padding:2px 0; }',
      '.sw-reasoning-block { margin:2px 32px 10px; }',
      '.sw-reasoning-summary { font-size:11.5px; color:var(--muted); cursor:pointer; user-select:none; list-style:none; display:flex; align-items:center; gap:5px; }',
      '.sw-reasoning-summary::-webkit-details-marker { display:none; }',
      '.sw-reasoning-summary::before { content:"◆"; font-size:7px; opacity:0.45; }',
      '.sw-reasoning-body { margin-top:5px; font-size:11px; color:var(--muted); font-family:var(--mono); line-height:1.55; white-space:pre-wrap; max-height:200px; overflow-y:auto; padding:8px 10px; background:var(--line-2); border-radius:6px; border-left:2px solid var(--line); }',
      '.sw-dot { width:7px; height:7px; border-radius:50%; background:var(--muted); display:inline-block; animation:sw-dot-pulse 1.2s infinite; }',
      '.sw-dot:nth-child(1) { animation-delay:0s; }',
      '.sw-dot:nth-child(2) { animation-delay:0.2s; }',
      '.sw-dot:nth-child(3) { animation-delay:0.4s; }',
      '.chip-ok   { display:inline-flex;align-items:center;gap:3px;padding:2px 8px;background:#DCFCE7;color:#166534;border-radius:10px;font-size:12px;font-weight:500;border:1px solid #BBF7D0; }',
      '.chip-warn { display:inline-flex;align-items:center;gap:3px;padding:2px 8px;background:#FEF9C3;color:#713F12;border-radius:10px;font-size:12px;font-weight:500;border:1px solid #FDE68A; }',
      /* assumption card styles (iwu.3 mockup) */
      '.ac-section-head { display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid var(--line);background:var(--line-2);flex-shrink:0; }',
      '.ac-section-label { font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted); }',
      '.ac-badges { display:flex;gap:5px;align-items:center; }',
      '.ac-badge { font-size:10px;font-weight:500;padding:1px 7px;border-radius:10px; }',
      '.ac-badge-amber { background:#FEF3C7;color:#92400E;border:1px solid #FDE68A; }',
      '.ac-badge-green { background:#DCFCE7;color:#166534;border:1px solid #BBF7D0; }',
      '.assumption-card { border:1px solid var(--line);border-radius:8px;padding:10px 12px;background:var(--surface);display:flex;flex-direction:column;gap:6px;transition:border-color 0.15s; }',
      '.assumption-card[data-state="confirmed"] { border-color:#6EE7B7;background:#F0FDF4; }',
      '.assumption-card[data-state="flagged"]   { border-color:#FCA5A5;background:#FFF1F2; }',
      '.assumption-card-meta { display:flex;align-items:center;gap:5px;flex-wrap:wrap; }',
      '.ac-type-tag { font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;padding:1px 6px;border-radius:3px; }',
      '.ac-type-desirability { background:#EDE9FE;color:#3730A3; }',
      '.ac-type-viability    { background:#DBEAFE;color:#1E40AF; }',
      '.ac-type-feasibility  { background:#DCFCE7;color:#166534; }',
      '.ac-type-ethical      { background:#F3F4F6;color:#374151; }',
      '.ac-risk-dot { width:6px;height:6px;border-radius:50%;flex-shrink:0; }',
      '.ac-risk-high   { background:#EF4444; }',
      '.ac-risk-medium { background:#F59E0B; }',
      '.ac-risk-low    { background:#10B981; }',
      '.assumption-card-text { font-size:12px;line-height:1.5;color:var(--ink); }',
      '.assumption-card[data-state="confirmed"] .assumption-card-text { color:#166534; }',
      '.assumption-card[data-state="flagged"]   .assumption-card-text { color:#991B1B; }',
      '.assumption-card-actions { display:flex;gap:5px; }',
      '.btn-confirm,.btn-flag { font-size:11px;padding:2px 9px;border-radius:4px;border:1px solid var(--line);background:transparent;color:var(--muted);cursor:pointer;font-weight:500; }',
      '.btn-confirm:hover { background:#DCFCE7;color:#166534;border-color:#6EE7B7; }',
      '.btn-flag:hover    { background:#FFF1F2;color:#991B1B;border-color:#FCA5A5; }',
      '.btn-confirmed-state { background:#DCFCE7;color:#166534;border-color:#6EE7B7; }',
      '.btn-flagged-state   { background:#FFF1F2;color:#991B1B;border-color:#FCA5A5; }',
      /* inc2.1 — condition card styles */
      '.ci-section-head { display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid var(--line);background:var(--line-2);flex-shrink:0; }',
      '.ci-section-label { font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted); }',
      '.condition-card { border:1px solid var(--line);border-radius:8px;padding:8px 12px;background:var(--surface);display:flex;flex-direction:column;gap:5px; }',
      '.condition-card-meta { display:flex;align-items:center;gap:6px;flex-wrap:wrap; }',
      '.ci-type-tag { font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;padding:1px 6px;border-radius:3px; }',
      '.ci-type-constraint  { background:#FEE2E2;color:#991B1B; }',
      '.ci-type-dependency  { background:#DBEAFE;color:#1E40AF; }',
      '.ci-type-outcome     { background:#DCFCE7;color:#166534; }',
      '.ci-source { font-size:10px;color:var(--muted); }',
      '.condition-card-text { font-size:12px;line-height:1.5;color:var(--ink); }',
      /* inc4 — canvas panel extension */
      ':root { --teal: #0F766E; --teal-soft: #CCFBF1; }',
      '.cv-section-head { display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid var(--line);background:var(--line-2);flex-shrink:0; }',
      '.cv-section-label { font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted); }',
      '.cv-pips { display:flex;gap:4px; }',
      '.cv-pip { width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;background:var(--line-2);color:var(--muted);border:1px solid var(--line); }',
      '.cv-pip.active { background:var(--accent-soft);color:var(--accent-ink);border-color:var(--accent); }',
      '.canvas-block { border:1px solid var(--line);border-radius:8px;margin-bottom:10px;overflow:hidden; }',
      '.canvas-block-head { display:flex;align-items:center;gap:8px;padding:7px 12px;background:var(--line-2);border-bottom:1px solid var(--line); }',
      '.canvas-type-tag { font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;padding:1px 6px;border-radius:3px;background:var(--accent-soft);color:var(--accent-ink); }',
      '.canvas-block-title { font-size:13px;font-weight:600;color:var(--ink); }',
      '.canvas-block-body { padding:10px 12px; }',
      '.cv-empty { font-size:13px;color:var(--muted);margin:0; }',
      '.cv-tree ul { margin:0;padding-left:18px;list-style:disc; }',
      '.cv-tree li { font-size:13px;color:var(--ink);line-height:1.5;padding:2px 0; }',
      '.cv-table { width:100%;border-collapse:collapse; }',
      '.cv-table th,.cv-table td { border:1px solid var(--line);padding:5px 9px;font-size:12px;text-align:left; }',
      '.cv-table th { background:var(--line-2);font-weight:600;color:var(--ink); }',
      '.cv-table td { color:var(--ink-2); }',
      '.cv-text p { font-size:13px;color:var(--ink);line-height:1.6;margin:4px 0; }',
    '</style>',
    (data.contextManifestHtml ||
      '<div id="context-manifest" role="region" aria-label="Loaded context files"' +
      ' style="padding:6px 16px;border-bottom:1px solid var(--line);display:flex;flex-wrap:wrap;gap:6px;align-items:center;background:var(--bg)">' +
      '<span id="context-manifest-empty" style="font-size:12px;color:var(--muted)">no context loaded</span>' +
      '</div>'),
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

      // RIGHT: live draft (three sections: condition items + assumption cards + artefact draft)
      '<section class="sw-chat-pane" style="display:flex;flex-direction:column">',
        // inc2.1 — conditions section
        '<div class="ci-section-head">',
          '<span class="ci-section-label">Conditions</span>',
        '</div>',
        '<div id="condition-items" role="region" aria-label="Condition items" style="flex:0 0 auto;max-height:30%;overflow-y:auto;padding:10px 12px;border-bottom:1px solid var(--line);display:flex;flex-direction:column;gap:6px">',
          '<p style="margin:0;font-size:12px;color:var(--muted)">No conditions identified yet</p>',
        '</div>',
        '<div class="ac-section-head">',
          '<span class="ac-section-label">Assumptions</span>',
          '<div class="ac-badges" id="ac-badges">',
            '<span class="ac-badge ac-badge-amber" id="ac-badge-unconf" style="display:none">0 unconfirmed</span>',
            '<span class="ac-badge ac-badge-green" id="ac-badge-conf"   style="display:none">0 confirmed</span>',
          '</div>',
        '</div>',
        '<div id="assumption-cards" role="region" aria-label="Assumption cards" style="flex:0 0 auto;max-height:42%;overflow-y:auto;padding:10px 12px;border-bottom:1px solid var(--line);display:flex;flex-direction:column;gap:6px">',
          '<p style="margin:0;font-size:12px;color:var(--muted)">No assumptions identified yet</p>',
        '</div>',
        '<div class="cv-section-head">',
          '<span class="cv-section-label">Canvas</span>',
          '<div class="cv-pips" id="cv-pips">',
            '<span class="cv-pip" data-lens="A" title="Lens A">A</span>',
            '<span class="cv-pip" data-lens="B" title="Lens B">B</span>',
            '<span class="cv-pip" data-lens="C" title="Lens C">C</span>',
            '<span class="cv-pip" data-lens="D" title="Lens D">D</span>',
            '<span class="cv-pip" data-lens="E" title="Lens E">E</span>',
          '</div>',
        '</div>',
        '<div id="canvas-panel" role="region" aria-label="Canvas" style="flex:1 1 auto;overflow-y:auto;padding:16px">',
          '<p class="cv-empty">Lens output will appear here as the session progresses.</p>',
          (draftSections || ''),
        '</div>',
      '</section>',

    '</div>',
    // Cmd/Ctrl+Enter to submit + inc2.1 condition-item client rendering
    '<script>',
      'function escHtmlClient(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}',
      'function appendConditionItem(item){',
        'var container=document.getElementById("condition-items");',
        'if(!container)return;',
        'var p=container.querySelector("p");if(p)p.remove();',
        'var typeKey=(item.type||"").toLowerCase().replace(/[^a-z]/g,"");',
        'var typeClass=["constraint","dependency","outcome"].indexOf(typeKey)>=0?typeKey:"constraint";',
        'var cardEl=document.createElement("div");',
        'cardEl.className="condition-card";',
        'cardEl.innerHTML=\'<div class="condition-card-meta">\'+',
          '\'<span class="ci-type-tag ci-type-\'+typeClass+\'">\'+escHtmlClient(item.type||"constraint")+\'</span>\'+',
          '\'<span class="ci-source">\'+escHtmlClient(item.source||"model")+\'</span>\'+',
          '\'</div><div class="condition-card-text">\'+escHtmlClient(item.text||"")+\'</div>\';',
        'container.appendChild(cardEl);',
      '}',
      '// SSE pump wires: if(evt.conditionItem){appendConditionItem(evt.conditionItem);}',
      'function renderCanvasBlock(block){',
        'var type=block.type||"";',
        'var title=escHtmlClient(block.title||"");',
        'var content=block.content||{};',
        'var bodyHtml="";',
        'if(type==="cluster-tree"){',
          'var clusters=content.clusters||[];',
          'var listItems=clusters.map(function(c){',
            'var name=escHtmlClient(String(c&&c.name?c.name:c));',
            'var children=(c&&c.children)||[];',
            'var childItems=children.map(function(ch){return"<li>"+escHtmlClient(String(ch))+"</li>";}).join("");',
            'return"<li>"+name+(childItems?"<ul>"+childItems+"</ul>":"")+"</li>";',
          '}).join("");',
          'bodyHtml="<div class=\\"cv-tree\\"><ul>"+listItems+"</ul></div>";',
        '}else if(type==="table"){',
          'var headers=(content.headers||[]).map(function(h){return"<th>"+escHtmlClient(String(h))+"</th>";}).join("");',
          'var rows=(content.rows||[]).map(function(row){',
            'var cells=(Array.isArray(row)?row:Object.values(row)).map(function(c){return"<td>"+escHtmlClient(String(c))+"</td>";}).join("");',
            'return"<tr>"+cells+"</tr>";',
          '}).join("");',
          'bodyHtml="<table class=\\"cv-table\\"><thead><tr>"+headers+"</tr></thead><tbody>"+rows+"</tbody></table>";',
        '}else if(type==="text"){',
          'var paras=(content.paragraphs||[String(content.text||"")]).map(function(p){return"<p>"+escHtmlClient(String(p))+"</p>";}).join("");',
          'bodyHtml="<div class=\\"cv-text\\">"+paras+"</div>";',
        '}',
        'var typeTag="<span class=\\"canvas-type-tag\\">"+escHtmlClient(type)+"</span>";',
        'return\'<div class="canvas-block">\'+',
          '\'<div class="canvas-block-head">\'+typeTag+\' <span class="canvas-block-title">\'+title+"</span></div>"+',
          '\'<div class="canvas-block-body">\'+bodyHtml+"</div></div>";',
      '}',
      'function appendCanvasBlock(block){',
        'var container=document.getElementById("canvas-panel");',
        'if(!container)return;',
        'var p=container.querySelector("p.cv-empty");if(p)p.remove();',
        'var wrapper=document.createElement("div");',
        'wrapper.innerHTML=renderCanvasBlock(block);',
        'container.appendChild(wrapper.firstChild||wrapper);',
      '}',
      'document.addEventListener("keydown",function(e){',
        'if((e.metaKey||e.ctrlKey)&&e.key==="Enter"){',
          'var f=document.getElementById("chat-form");if(f)f.submit();',
        '}',
      '});',
    '</script>'
  ].join('');
}

module.exports = { renderChat };
