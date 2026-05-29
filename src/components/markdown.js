// src/components/markdown.js — Mini parser de markdown sin dependencias.
// Soporta: headings, bold, italic, code inline, code blocks, links,
// listas, tablas, blockquotes.

export function renderMarkdown(md) {
  if (!md) return '';
  const lines = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const out = [];
  let inCode = false;
  let codeLang = '';
  let codeBuf = [];
  let inList = false;
  let listType = 'ul';
  let inTable = false;
  let tableBuf = [];
  let inBlockquote = false;
  let bqBuf = [];

  const inline = (s) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-img">')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  const flushList = () => { if (inList) { out.push(`</${listType}>`); inList = false; } };
  const flushTable = () => {
    if (!inTable) return;
    const rows = tableBuf.filter(r => r.trim());
    if (rows.length >= 2) {
      const headers = rows[0].split('|').slice(1, -1).map(s => s.trim());
      const bodyRows = rows.slice(2);
      out.push('<table>');
      out.push('<thead><tr>' + headers.map(h => `<th>${inline(h)}</th>`).join('') + '</tr></thead>');
      out.push('<tbody>');
      bodyRows.forEach(r => {
        const cells = r.split('|').slice(1, -1).map(s => s.trim());
        out.push('<tr>' + cells.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>');
      });
      out.push('</tbody></table>');
    }
    tableBuf = []; inTable = false;
  };
  const flushBlockquote = () => {
    if (!inBlockquote) return;
    out.push('<blockquote>' + bqBuf.map(l => `<p>${inline(l)}</p>`).join('') + '</blockquote>');
    bqBuf = []; inBlockquote = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCode) {
        out.push(`<pre><code class="lang-${codeLang}">${codeBuf.join('\n').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code></pre>`);
        codeBuf = []; inCode = false; codeLang = '';
      } else {
        flushList(); flushTable(); flushBlockquote();
        inCode = true; codeLang = line.slice(3).trim();
      }
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }

    if (line.includes('|') && line.trim().startsWith('|')) {
      flushList(); flushBlockquote();
      inTable = true;
      tableBuf.push(line);
      continue;
    } else if (inTable) {
      flushTable();
    }

    const trimmed = line.trimStart();

    if (trimmed.startsWith('>')) {
      flushList();
      inBlockquote = true;
      bqBuf.push(trimmed.replace(/^>\s?/, ''));
      continue;
    } else if (inBlockquote) {
      flushBlockquote();
    }

    if (/^---+$/.test(trimmed)) { flushList(); flushTable(); flushBlockquote(); out.push('<hr>'); continue; }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { flushList(); out.push(`<h${h[1].length}>${inline(h[2].trimEnd())}</h${h[1].length}>`); continue; }

    const ul = trimmed.match(/^[-*+]\s+(.*)$/);
    const ol = trimmed.match(/^\d+\.\s+(.*)$/);
    if (ul || ol) {
      const t = ul ? 'ul' : 'ol';
      if (!inList || listType !== t) {
        flushList();
        out.push(`<${t}>`); inList = true; listType = t;
      }
      out.push(`<li>${inline((ul || ol)[1])}</li>`);
      continue;
    } else {
      flushList();
    }

    if (!line.trim()) { continue; }

    out.push(`<p>${inline(line)}</p>`);
  }
  flushList(); flushTable(); flushBlockquote();
  return out.join('\n');
}

export const fmtUSD = (n) => {
  const num = Number(n);
  if (num >= 1000) return '$' + Math.round(num).toLocaleString('en-US');
  return '$' + num.toFixed(2);
};
export const pct = (cur, prev) => prev === 0 ? 0 : ((cur - prev) / prev) * 100;
