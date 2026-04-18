// Tiny markdown → HTML renderer. Good enough for artefact docs.
// Handles: headings, paragraphs, bold/italic/code, links, lists,
// ordered lists, blockquotes, code fences, tables, hr, task lists.
(function () {
  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function inline(text) {
    text = escapeHtml(text);
    // code spans
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    // bold
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    // italic
    text = text.replace(/(^|[\s(])\*([^*\s][^*]*[^*\s]|\S)\*(?=$|[\s.,;:!?)])/g, "$1<em>$2</em>");
    // links [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return text;
  }

  function parseTable(lines, i) {
    // Expect header | --- | --- rows
    const header = lines[i];
    const sep = lines[i + 1] || "";
    if (!/^\s*\|?.*\|.*\|?\s*$/.test(header)) return null;
    if (!/^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(sep)) return null;
    const splitRow = (r) => r.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map(s => s.trim());
    const cells = splitRow(header);
    let html = '<table><thead><tr>' + cells.map(c => `<th>${inline(c)}</th>`).join("") + '</tr></thead><tbody>';
    let j = i + 2;
    while (j < lines.length && /\|/.test(lines[j]) && lines[j].trim() !== "") {
      const row = splitRow(lines[j]);
      html += '<tr>' + row.map(c => `<td>${inline(c)}</td>`).join("") + '</tr>';
      j++;
    }
    html += '</tbody></table>';
    return { html, next: j };
  }

  function parseList(lines, i, ordered) {
    const marker = ordered ? /^(\s*)\d+\.\s+(.*)$/ : /^(\s*)[-*+]\s+(.*)$/;
    const items = [];
    let j = i;
    while (j < lines.length) {
      const m = lines[j].match(marker);
      if (!m) break;
      let content = m[2];
      // task list
      const tm = content.match(/^\[( |x|X)\]\s+(.*)$/);
      if (tm) {
        const checked = tm[1].toLowerCase() === "x";
        content = `<span class="task ${checked ? "checked" : ""}">${checked ? "▣" : "☐"}</span> ${tm[2]}`;
      }
      items.push(content);
      j++;
    }
    const tag = ordered ? "ol" : "ul";
    const html = `<${tag}>` + items.map(c => `<li>${inline(c)}</li>`).join("") + `</${tag}>`;
    return { html, next: j };
  }

  function render(md) {
    if (!md) return "";
    const lines = md.replace(/\r\n/g, "\n").split("\n");
    let html = "";
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      // blank
      if (!line.trim()) { i++; continue; }

      // hr
      if (/^\s*---+\s*$/.test(line)) { html += "<hr />"; i++; continue; }

      // heading
      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        const lvl = h[1].length;
        html += `<h${lvl}>${inline(h[2])}</h${lvl}>`;
        i++; continue;
      }

      // code fence
      if (/^\s*```/.test(line)) {
        const langMatch = line.match(/^\s*```(\w+)?\s*$/);
        const lang = langMatch?.[1] || "";
        i++;
        const buf = [];
        while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
          buf.push(lines[i]);
          i++;
        }
        i++; // closing fence
        html += `<pre class="lang-${lang}"><code>${escapeHtml(buf.join("\n"))}</code></pre>`;
        continue;
      }

      // blockquote (multi-line)
      if (/^\s*>/.test(line)) {
        const buf = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) {
          buf.push(lines[i].replace(/^\s*>\s?/, ""));
          i++;
        }
        html += `<blockquote>${render(buf.join("\n"))}</blockquote>`;
        continue;
      }

      // table
      if (/\|/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(lines[i + 1])) {
        const t = parseTable(lines, i);
        if (t) { html += t.html; i = t.next; continue; }
      }

      // unordered list
      if (/^\s*[-*+]\s+/.test(line)) {
        const l = parseList(lines, i, false);
        html += l.html; i = l.next; continue;
      }

      // ordered list
      if (/^\s*\d+\.\s+/.test(line)) {
        const l = parseList(lines, i, true);
        html += l.html; i = l.next; continue;
      }

      // paragraph (fold consecutive non-blank, non-structural lines)
      const buf = [line];
      i++;
      while (i < lines.length) {
        const nxt = lines[i];
        if (!nxt.trim()) break;
        if (/^(#{1,6}\s|```|\s*>|\s*[-*+]\s+|\s*\d+\.\s+|\s*---+\s*$)/.test(nxt)) break;
        buf.push(nxt);
        i++;
      }
      html += `<p>${inline(buf.join(" "))}</p>`;
    }
    return html;
  }

  window.renderMarkdown = render;
})();
