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
      /* tree diagram */
      '.cv-tree-wrap { padding:6px 2px; }',
      '.cv-tree-root-node { display:inline-block;background:var(--accent-soft);border:1.5px solid var(--accent);border-radius:6px;padding:6px 14px;font-size:12px;font-weight:600;color:var(--accent-ink);margin-bottom:6px;margin-left:12px; }',
      '.cv-tree-list { list-style:none;margin:0 0 0 20px;padding:0; }',
      '.cv-tree-item { position:relative;padding:3px 0 3px 20px; }',
      '.cv-tree-item::before { content:"";position:absolute;left:0;top:13px;width:16px;height:1.5px;background:var(--muted-2); }',
      '.cv-tree-item::after { content:"";position:absolute;left:0;top:0;bottom:0;width:1.5px;background:var(--muted-2); }',
      '.cv-tree-item:last-child::after { height:13px;bottom:auto; }',
      '.cv-tree-node-box { display:inline-block;background:var(--surface);border:1px solid var(--line);border-radius:5px;padding:5px 10px;font-size:12px;color:var(--ink);line-height:1.4; }',
      '.cv-tree-sub { list-style:none;margin:4px 0 0 16px;padding:0; }',
      '.cv-tree-sub .cv-tree-item { padding:2px 0 2px 16px; }',
      '.cv-tree-sub .cv-tree-item::before { top:11px;width:12px; }',
      '.cv-tree-sub .cv-tree-item:last-child::after { height:11px; }',
      '.cv-tree-sub .cv-tree-node-box { font-size:11px;color:var(--ink-2); }',
      /* section toggle buttons */
      '.sw-section-toggle,.sw-section-expand { background:none;border:none;cursor:pointer;color:var(--muted);padding:2px 5px;border-radius:4px;font-size:11px;line-height:1;flex-shrink:0; }',
      '.sw-section-toggle:hover,.sw-section-expand:hover { background:var(--line);color:var(--ink); }',
      '.sw-section-expand { font-size:13px; }',
      /* artefact panel + fullscreen */
      '#sw-artefact-pane.ad-fs { position:fixed;top:0;left:0;right:0;bottom:0;z-index:999;border-radius:0;max-height:100vh; }',
      '.ad-fs-btn { background:none;border:none;cursor:pointer;color:var(--muted);padding:2px 6px;border-radius:4px;font-size:14px;line-height:1;transition:color 0.1s; }',
      '.ad-fs-btn:hover { color:var(--ink); }',
      /* artefact markdown */
      '.ad-h1 { font-size:1.2rem;font-weight:700;margin:18px 0 8px;line-height:1.3; }',
      '.ad-h2 { font-size:1rem;font-weight:600;margin:14px 0 5px;border-bottom:1px solid var(--line);padding-bottom:3px; }',
      '.ad-h3 { font-size:0.88rem;font-weight:600;margin:10px 0 4px;color:var(--ink-2,var(--ink)); }',
      '.ad-p { margin:4px 0;font-size:13px;line-height:1.65;color:var(--ink); }',
      '.ad-ul,.ad-ol { margin:4px 0 8px 16px;padding:0; }',
      '.ad-ul li,.ad-ol li { font-size:13px;margin:2px 0;line-height:1.5; }',
      '.ad-hr { border:0;border-top:1px solid var(--line);margin:14px 0; }',
      '.ad-pre { display:block;background:var(--line-2);padding:8px 12px;border-radius:6px;overflow-x:auto;font-family:var(--mono);font-size:11.5px;line-height:1.5;margin:8px 0; }',
      '.ad-code { font-family:var(--mono);font-size:11px;background:var(--line-2);padding:1px 4px;border-radius:3px; }',
      '.ad-table { width:100%;border-collapse:collapse;font-size:12px;margin:8px 0 12px; }',
      '.ad-table th { border:1px solid var(--line);padding:5px 8px;background:var(--line-2);font-weight:600;text-align:left; }',
      '.ad-table td { border:1px solid var(--line);padding:5px 8px;color:var(--ink-2,var(--ink)); }',
      /* sub-step gate */
      '.sw-gate-substeps { display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-bottom:10px;margin-bottom:10px;border-bottom:1px solid var(--line); }',
      '.sw-gate-substep-lbl { font-size:11px;font-weight:500;color:var(--muted);white-space:nowrap; }',
      '.sw-gate-substep-btn { font-size:12px;padding:4px 10px;border-radius:6px;border:1px solid var(--line);background:transparent;color:var(--ink);cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:4px;font-family:inherit; }',
      '.sw-gate-substep-btn:hover { border-color:var(--accent,#2563eb); }',
      '.sw-gate-substep-btn--rec { border-color:var(--accent,#2563eb);color:var(--accent,#2563eb); }',
      '.sw-est-form { display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;padding:10px 12px;background:var(--line-2);border-radius:8px;margin-bottom:8px; }',
      '.sw-est-field { display:flex;flex-direction:column;gap:3px; }',
      '.sw-est-field label { font-size:11px;color:var(--muted);font-weight:500; }',
      '.sw-est-field input,.sw-est-field select { padding:4px 8px;border:1px solid var(--line);border-radius:5px;background:var(--surface);color:var(--ink);font-size:12px;width:80px; }',
      '.cv-table { width:100%;border-collapse:collapse; }',
      '.cv-table th,.cv-table td { border:1px solid var(--line);padding:5px 9px;font-size:12px;text-align:left; }',
      '.cv-table th { background:var(--line-2);font-weight:600;color:var(--ink); }',
      '.cv-table td { color:var(--ink-2); }',
      '.cv-text p { font-size:13px;color:var(--ink);line-height:1.6;margin:4px 0; }',
      /* definition story map */
      '.dm-canvas{padding:12px 16px}',
      '.dm-hdr{display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap}',
      '.dm-count{font-size:11px;color:var(--muted);font-weight:500}',
      '.dm-badge{background:var(--accent-soft,#eaf1fb);color:var(--accent-ink,#1d4ed8);font-size:10px;font-weight:600;padding:2px 9px;border-radius:10px;text-transform:uppercase;letter-spacing:0.4px}',
      '.dm-epic{margin-bottom:20px}',
      '.dm-epic-hd{display:flex;align-items:center;gap:7px;padding:5px 0;border-bottom:2px solid var(--accent,#2563eb);margin-bottom:10px}',
      '.dm-epic-tag{font-size:10px;font-weight:700;background:var(--accent,#2563eb);color:#fff;border-radius:4px;padding:1px 7px;flex-shrink:0}',
      '.dm-epic-name{font-size:12px;font-weight:600;color:var(--ink);flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.dm-epic-count{font-size:10px;color:var(--muted);flex-shrink:0;background:var(--line-2);padding:1px 6px;border-radius:10px;white-space:nowrap}',
      '.dm-cards{display:flex;flex-wrap:wrap;gap:6px}',
      '.dm-card{cursor:pointer;border:1px solid var(--line);border-radius:8px;padding:8px 10px;background:var(--surface);text-align:left;min-width:96px;max-width:144px;display:flex;flex-direction:column;gap:3px;font-family:inherit;line-height:1;transition:border-color 0.15s,box-shadow 0.15s}',
      '.dm-card:hover{border-color:var(--accent,#2563eb);box-shadow:0 2px 7px rgba(0,0,0,.09)}',
      '.dm-card-id{font-size:9px;font-weight:700;font-family:var(--mono);color:var(--muted);text-transform:uppercase;letter-spacing:0.3px}',
      '.dm-card-title{font-size:11px;font-weight:500;color:var(--ink);line-height:1.35;margin:2px 0}',
      '.dm-cx{font-size:9px;font-weight:600;margin-top:2px}',
      '.dm-cx--l{color:#2da44e}.dm-cx--m{color:#ca8a04}.dm-cx--h{color:#dc2626}',
      '.dm-empty{padding:24px 16px;font-size:13px;color:var(--muted);font-style:italic}',
      /* story detail modal */
      '.dm-modal{display:none;position:fixed;top:0;left:0;right:0;bottom:0;z-index:10000;align-items:center;justify-content:center}',
      '.dm-mo{position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.4)}',
      '.dm-mb{position:relative;background:var(--bg);border-radius:12px;width:700px;max-width:95vw;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,.28)}',
      '.dm-mh{display:flex;align-items:flex-start;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--line);flex-shrink:0;gap:12px}',
      '.dm-mt{font-size:14px;font-weight:600;color:var(--ink);line-height:1.4}',
      '.dm-mx{border:none;background:none;cursor:pointer;font-size:16px;color:var(--muted);padding:2px 6px;border-radius:4px;line-height:1;flex-shrink:0;font-family:inherit}',
      '.dm-mx:hover{color:var(--ink);background:var(--line)}',
      '.dm-mbd{overflow-y:auto;padding:20px 24px}',
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

      // RIGHT: ideate → 3-panel; all other skills → artefact draft panel
      (data.skillName === 'ideate' || data.isIdeate === true
        ? [
          '<section class="sw-chat-pane" style="display:flex;flex-direction:column">',
            '<div class="ci-section-head">',
              '<span class="ci-section-label">Conditions</span>',
              '<button id="sw-toggle-conditions" class="sw-section-toggle" onclick="swToggleSection(\'condition-items\',this)" title="Collapse/expand" aria-label="Toggle conditions">▾</button>',
            '</div>',
            '<div id="condition-items" role="region" aria-label="Condition items" style="flex:0 0 auto;max-height:28%;overflow-y:auto;padding:10px 12px;border-bottom:1px solid var(--line);display:flex;flex-direction:column;gap:6px">',
              '<p style="margin:0;font-size:12px;color:var(--muted)">No conditions identified yet</p>',
            '</div>',
            '<div class="ac-section-head">',
              '<span class="ac-section-label">Assumptions</span>',
              '<div style="display:flex;align-items:center;gap:6px">',
                '<div class="ac-badges" id="ac-badges">',
                  '<span class="ac-badge ac-badge-amber" id="ac-badge-unconf" style="display:none">0 unconfirmed</span>',
                  '<span class="ac-badge ac-badge-green" id="ac-badge-conf"   style="display:none">0 confirmed</span>',
                '</div>',
                '<button id="sw-toggle-assumptions" class="sw-section-toggle" onclick="swToggleSection(\'assumption-cards\',this)" title="Collapse/expand" aria-label="Toggle assumptions">▾</button>',
              '</div>',
            '</div>',
            '<div id="assumption-cards" role="region" aria-label="Assumption cards" style="flex:0 0 auto;max-height:42%;overflow-y:auto;padding:10px 12px;border-bottom:1px solid var(--line);display:flex;flex-direction:column;gap:6px">',
              '<p style="margin:0;font-size:12px;color:var(--muted)">No assumptions identified yet</p>',
            '</div>',
            '<div class="cv-section-head">',
              '<span class="cv-section-label">Canvas</span>',
              '<div style="display:flex;align-items:center;gap:6px">',
                '<div class="cv-pips" id="cv-pips">',
                  '<span class="cv-pip" data-lens="A" title="Lens A">A</span>',
                  '<span class="cv-pip" data-lens="B" title="Lens B">B</span>',
                  '<span class="cv-pip" data-lens="C" title="Lens C">C</span>',
                  '<span class="cv-pip" data-lens="D" title="Lens D">D</span>',
                  '<span class="cv-pip" data-lens="E" title="Lens E">E</span>',
                '</div>',
                '<button id="sw-toggle-canvas" class="sw-section-toggle" onclick="swToggleSection(\'canvas-panel\',this)" title="Collapse/expand" aria-label="Toggle canvas">▾</button>',
                '<button id="sw-expand-canvas" class="sw-section-expand" onclick="swExpandCanvas()" title="Maximise canvas" aria-label="Maximise canvas">⊞</button>',
              '</div>',
            '</div>',
            '<div id="canvas-panel" role="region" aria-label="Canvas" style="flex:1 1 auto;overflow-y:auto;padding:16px">',
              '<p class="cv-empty">Lens output will appear here as the session progresses.</p>',
              (draftSections || ''),
            '</div>',
          '</section>',
        ].join('')
        : [
          '<section class="sw-chat-pane" id="sw-artefact-pane" style="display:flex;flex-direction:column">',
            '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid var(--line);background:var(--line-2);flex-shrink:0">',
              '<span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted)">' + (data.skillName === 'definition' ? 'Story Map' : 'Artefact Draft') + '</span>',
              '<button id="sw-artefact-fs-btn" class="ad-fs-btn" onclick="swToggleArtefactFs()" title="Toggle fullscreen" aria-label="Toggle fullscreen">⊞</button>',
            '</div>',
            '<div id="artefact-panel" role="region" aria-label="' + (data.skillName === 'definition' ? 'Story map' : 'Artefact draft') + '" style="flex:1 1 auto;overflow-y:auto;padding:' + (data.skillName === 'definition' ? '0' : '16px 20px') + '">',
              '<p style="margin:0;font-size:12px;color:var(--muted);padding:16px 20px">' + (data.skillName === 'definition' ? 'Story map will appear here as epics and stories are generated.' : 'Artefact will appear here as the session progresses.') + '</p>',
            '</div>',
          '</section>',
        ].join('')
      ),

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
      'function swToggleArtefactFs(){var p=document.getElementById("sw-artefact-pane");var b=document.getElementById("sw-artefact-fs-btn");if(!p)return;p.classList.toggle("ad-fs");b.textContent=p.classList.contains("ad-fs")?"⊡":"⊞";}',
      '// SSE pump wires: appendConditionItem, appendCanvasBlock defined in the IIFE (skills.js)',
      'document.addEventListener("keydown",function(e){',
        'if((e.metaKey||e.ctrlKey)&&e.key==="Enter"){',
          'var f=document.getElementById("chat-form");if(f)f.submit();',
        '}',
      '});',
    '</script>'
  ].join('');
}

module.exports = { renderChat };
