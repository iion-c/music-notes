/**
 * Markdown ligero para apuntes. Todo el texto se escapa antes de dar formato,
 * así que el HTML resultante es seguro aunque venga de un archivo importado.
 *
 *   **negrita**  *cursiva*  ==resaltado==  ~~tachado~~  `código`
 *   - viñeta   1. lista   > cita   [ ] / [x] casilla
 *   (#) ♯  (b) ♭  (n) ♮  ->  →  =>  ⇒
 */

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inline(s: string): string {
  let out = escapeHtml(s);
  out = out
    .replace(/\(#\)/g, '♯')
    .replace(/\(b\)/g, '♭')
    .replace(/\(n\)/g, '♮')
    .replace(/=&gt;/g, '⇒')
    .replace(/-&gt;/g, '→')
    .replace(/&lt;-/g, '←');
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  out = out.replace(/==([^=]+)==/g, '<mark>$1</mark>');
  out = out.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  return out;
}

export function renderMarkdownLite(text: string): string {
  const lines = text.split('\n');
  return lines
    .map((line) => {
      if (line.trim() === '') return '<div class="md-empty"></div>';
      let m = line.match(/^(\s*)[-*•]\s+\[( |x|X)\]\s+(.*)$/);
      if (m) {
        const pad = Math.floor(m[1].length / 2) * 1.4;
        const done = m[2].toLowerCase() === 'x';
        return `<div class="md-li" style="padding-left:${pad}em"><span class="md-bullet">${done ? '☑' : '☐'}</span><span${done ? ' style="opacity:.6;text-decoration:line-through"' : ''}>${inline(m[3])}</span></div>`;
      }
      m = line.match(/^(\s*)[-*•]\s+(.*)$/);
      if (m) {
        const level = Math.floor(m[1].length / 2);
        const bullet = ['•', '◦', '▪'][level % 3];
        return `<div class="md-li" style="padding-left:${level * 1.4}em"><span class="md-bullet">${bullet}</span><span>${inline(m[2])}</span></div>`;
      }
      m = line.match(/^(\s*)(\d+|[a-z])[.)]\s+(.*)$/);
      if (m) {
        const level = Math.floor(m[1].length / 2);
        return `<div class="md-li" style="padding-left:${level * 1.4}em"><span class="md-bullet" style="width:auto;min-width:1em">${escapeHtml(m[2])}.</span><span>${inline(m[3])}</span></div>`;
      }
      m = line.match(/^>\s?(.*)$/);
      if (m) return `<div class="md-quote">${inline(m[1])}</div>`;
      return `<div>${inline(line)}</div>`;
    })
    .join('');
}
