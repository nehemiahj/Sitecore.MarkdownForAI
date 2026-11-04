/**
 * Dependency-free HTML to Markdown converter. A JavaScript port of the module's C#
 * MarkdownConverter so the browser fallback produces the same output as the server.
 * Works in browsers and in Node (it parses strings itself and never touches the DOM).
 */

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const RAW_TEXT = new Set(['script', 'style', 'textarea', 'title', 'xmp', 'noscript', 'template']);
const CLOSES_P = new Set(['address', 'article', 'aside', 'blockquote', 'details', 'div', 'dl', 'fieldset', 'figcaption', 'figure',
  'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'main', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'ul']);
const P_SCOPE = new Set(['div', 'li', 'td', 'th', 'blockquote', 'section', 'article', 'aside', 'main', 'header', 'footer', 'body',
  'html', 'dd', 'dt', 'figure', 'button', 'table', 'nav', 'form']);
const BLOCK = new Set(['address', 'article', 'aside', 'blockquote', 'body', 'caption', 'center', 'dd', 'details', 'dialog', 'dir',
  'div', 'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hgroup',
  'hr', 'html', 'li', 'main', 'menu', 'nav', 'ol', 'p', 'pre', 'section', 'summary', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead',
  'tr', 'ul']);
const INLINE = new Set(['a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'data', 'del', 'dfn', 'em', 'font', 'i', 'img', 'ins',
  'kbd', 'label', 'mark', 'q', 's', 'samp', 'small', 'span', 'strike', 'strong', 'sub', 'sup', 'time', 'tt', 'u', 'var', 'wbr']);

// GitHub alert marker at the start of a blockquote, as escaped by the text escaper: \[!WARNING\]
const ALERT_MARKER = /^\\?\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\\?\][ \t]*\n?/i;

/** Keeps GitHub alerts intact: unescapes the marker and puts it on its own line. */
function restoreAlertMarker(quote) {
  const m = ALERT_MARKER.exec(quote);
  if (!m) return quote;
  const rest = quote.slice(m[0].length).replace(/^ +/, '');
  const marker = '[!' + m[1].toUpperCase() + ']';
  return rest ? marker + '\n' + rest : marker;
}

export const DEFAULT_SKIP_TAGS = ['script', 'style', 'noscript', 'template', 'iframe', 'svg', 'canvas', 'form', 'button', 'input',
  'select', 'textarea', 'object', 'embed', 'video', 'audio', 'head', 'meta', 'link', 'title', 'nav', 'map', 'dialog'];

export const RAW_MARKDOWN_TYPES = ['text/x-markdown', 'text/markdown'];

const HARD_BREAK = '\u0001';
const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '©', reg: '®',
  trade: '™', hellip: '…', mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’', ldquo: '“',
  rdquo: '”', bull: '•', middot: '·', deg: '°', plusmn: '±', times: '×', divide: '÷',
  frac12: '½', frac14: '¼', frac34: '¾', micro: 'µ', le: '≤', ge: '≥', ne: '≠', eacute: 'é' };

export function decodeEntities(text) {
  if (!text || text.indexOf('&') < 0) return text || '';
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (match, code) => {
    if (code[0] === '#') {
      const n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : match;
    }
    const named = NAMED_ENTITIES[code.toLowerCase()];
    return named === undefined ? match : named;
  });
}

function node(kind, name, text) {
  return { kind, name: name || null, text: text === undefined ? null : text, attrs: new Map(), children: [], parent: null };
}

function append(parent, child) {
  child.parent = parent;
  parent.children.push(child);
}

/** Parses HTML into a light tree: { kind: 'document'|'element'|'text'|'comment', name, attrs, children, text }. */
export function parseHtml(html) {
  const doc = node('document');
  if (!html) return doc;
  const stack = [doc];
  const current = () => stack[stack.length - 1];
  let text = '';
  let i = 0;
  const n = html.length;

  const flush = () => {
    if (text) {
      append(current(), node('text', null, decodeEntities(text)));
      text = '';
    }
  };

  const closeOpen = (name, scope) => {
    for (let k = stack.length - 1; k > 0; k--) {
      if (stack[k].name === name) { stack.length = k; return; }
      if (scope.has(stack[k].name)) return;
    }
  };

  const open = (el) => {
    const name = el.name;
    if (CLOSES_P.has(name)) closeOpen('p', P_SCOPE);
    if (name === 'li') closeOpen('li', new Set(['ul', 'ol', 'menu']));
    if (name === 'dt' || name === 'dd') { closeOpen('dt', new Set(['dl'])); closeOpen('dd', new Set(['dl'])); }
    if (name === 'tr') closeOpen('tr', new Set(['table', 'thead', 'tbody', 'tfoot']));
    if (name === 'td' || name === 'th') { closeOpen('td', new Set(['tr', 'table'])); closeOpen('th', new Set(['tr', 'table'])); }
    if (name === 'thead' || name === 'tbody' || name === 'tfoot') {
      for (const t of ['thead', 'tbody', 'tfoot']) closeOpen(t, new Set(['table']));
    }
    append(current(), el);
    stack.push(el);
  };

  while (i < n) {
    const c = html[i];
    if (c === '<' && i + 1 < n) {
      const next = html[i + 1];
      if (next === '!') {
        flush();
        if (html.startsWith('<!--', i)) {
          const end = html.indexOf('-->', i + 4);
          append(current(), node('comment', null, end < 0 ? html.slice(i + 4) : html.slice(i + 4, end)));
          i = end < 0 ? n : end + 3;
        } else if (html.startsWith('<![CDATA[', i)) {
          const end = html.indexOf(']]>', i + 9);
          append(current(), node('text', null, end < 0 ? html.slice(i + 9) : html.slice(i + 9, end)));
          i = end < 0 ? n : end + 3;
        } else {
          const end = html.indexOf('>', i);
          i = end < 0 ? n : end + 1;
        }
        continue;
      }
      if (next === '?') {
        flush();
        const end = html.indexOf('>', i);
        i = end < 0 ? n : end + 1;
        continue;
      }
      if (next === '/') {
        const m = /^[A-Za-z0-9:_-]+/.exec(html.slice(i + 2, i + 64));
        if (m) {
          flush();
          const name = m[0].toLowerCase();
          const end = html.indexOf('>', i + 2 + m[0].length);
          i = end < 0 ? n : end + 1;
          if (!VOID.has(name)) {
            for (let k = stack.length - 1; k > 0; k--) {
              if (stack[k].name === name) { stack.length = k; break; }
            }
          }
          continue;
        }
      } else if (/[A-Za-z]/.test(next)) {
        flush();
        i = readStartTag(html, i, stack, open);
        continue;
      }
    }
    text += c;
    i++;
  }
  flush();
  return doc;
}

function readStartTag(html, start, stack, open) {
  const n = html.length;
  let i = start + 1;
  const nameMatch = /^[A-Za-z0-9:_-]+/.exec(html.slice(i, i + 64));
  const name = nameMatch[0].toLowerCase();
  i += nameMatch[0].length;
  const el = node('element', name);
  let selfClosing = false;

  while (i < n) {
    const c = html[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '>') { i++; break; }
    if (c === '/') {
      if (html[i + 1] === '>') { selfClosing = true; i += 2; break; }
      i++;
      continue;
    }
    const attrStart = i;
    while (i < n && !/[\s=>/]/.test(html[i])) i++;
    const attrName = html.slice(attrStart, i).toLowerCase();
    while (i < n && /\s/.test(html[i])) i++;
    let value = '';
    if (html[i] === '=') {
      i++;
      while (i < n && /\s/.test(html[i])) i++;
      if (html[i] === '"' || html[i] === "'") {
        const quote = html[i];
        let end = html.indexOf(quote, i + 1);
        if (end < 0) end = n;
        value = html.slice(i + 1, end);
        i = Math.min(n, end + 1);
      } else {
        const valueStart = i;
        while (i < n && !/[\s>]/.test(html[i])) i++;
        value = html.slice(valueStart, i);
      }
    }
    if (attrName && !el.attrs.has(attrName)) el.attrs.set(attrName, decodeEntities(value));
  }

  open(el);
  if (VOID.has(name) || selfClosing) {
    stack.pop();
    return i;
  }
  if (RAW_TEXT.has(name)) {
    const lower = html.toLowerCase();
    const close = lower.indexOf('</' + name, i);
    const raw = html.slice(i, close < 0 ? n : close);
    if (raw) append(el, node('text', null, name === 'textarea' || name === 'title' ? decodeEntities(raw) : raw));
    stack.pop();
    if (close < 0) return n;
    const end = html.indexOf('>', close);
    return end < 0 ? n : end + 1;
  }
  return i;
}

// ------------------------------------------------------------------ converter

const isEl = (n, name) => n.kind === 'element' && (name === undefined || n.name === name);
const attr = (n, name) => (n.attrs.has(name) ? n.attrs.get(name) : null);

export function htmlToMarkdown(input, options = {}) {
  const opts = {
    baseUrl: options.baseUrl || null,
    skipTags: new Set((options.skipTags || DEFAULT_SKIP_TAGS).map((t) => t.toLowerCase())),
    ignoreClasses: new Set(options.ignoreClasses || []),
    ignoreAttribute: options.ignoreAttribute === undefined ? 'data-md-ignore' : options.ignoreAttribute,
    includeImages: options.includeImages !== false,
  };
  const root = typeof input === 'string' ? parseHtml(input) : input;
  if (!root) return '';
  const blockCache = new WeakMap();

  const isRawMarkdown = (n) => isEl(n, 'script') && RAW_MARKDOWN_TYPES.includes((attr(n, 'type') || '').toLowerCase());

  const isSkipped = (n) => {
    if (n.kind === 'comment') return true;
    if (n.kind !== 'element') return false;
    if (isRawMarkdown(n)) return false;
    if (opts.skipTags.has(n.name)) return true;
    if ((opts.ignoreAttribute && n.attrs.has(opts.ignoreAttribute)) || n.attrs.has('hidden') ||
        (attr(n, 'aria-hidden') || '').toLowerCase() === 'true') return true;
    const style = (attr(n, 'style') || '').replace(/\s/g, '').toLowerCase();
    if (style.includes('display:none') || style.includes('visibility:hidden')) return true;
    if (opts.ignoreClasses.size) {
      const classes = (attr(n, 'class') || '').split(/\s+/);
      if (classes.some((c) => opts.ignoreClasses.has(c))) return true;
    }
    return false;
  };

  const isBlock = (n) => {
    if (BLOCK.has(n.name) || isRawMarkdown(n)) return true;
    if (INLINE.has(n.name)) return false;
    if (!blockCache.has(n)) blockCache.set(n, n.children.some((c) => c.kind === 'element' && !isSkipped(c) && isBlock(c)));
    return blockCache.get(n);
  };

  const resolveUrl = (url) => {
    if (!opts.baseUrl || /^(mailto|tel):/i.test(url)) return url;
    try {
      return new URL(url, opts.baseUrl).href;
    } catch (e) {
      return url;
    }
  };
  const escapeUrl = (url) => url.replace(/ /g, '%20').replace(/\(/g, '%28').replace(/\)/g, '%29');

  const rawText = (n) => n.children.map((c) => (c.kind === 'text' ? c.text : isEl(c, 'br') ? '\n' : c.kind === 'element' ? rawText(c) : '')).join('');

  const rawMarkdown = (n) => dedent(n.children.map((c) => c.text || '').join('').replace(/<\\\/script/gi, '</script').replace(/\r\n/g, '\n'));

  // ---- inline
  const renderInline = (nodes) => nodes.map(inline).join('');

  function inline(n) {
    if (isSkipped(n)) return '';
    if (n.kind === 'text') return escapeText((n.text || '').replace(/\s+/g, ' '));
    if (n.kind !== 'element') return '';
    if (isRawMarkdown(n)) return ' ' + rawMarkdown(n) + ' ';
    switch (n.name) {
      case 'br': return HARD_BREAK;
      case 'strong': case 'b': return wrap(n, '**');
      case 'em': case 'i': case 'cite': case 'dfn': case 'var': return wrap(n, '*');
      case 'del': case 's': case 'strike': return wrap(n, '~~');
      case 'code': case 'kbd': case 'samp': case 'tt': {
        const code = rawText(n).replace(/\s+/g, ' ').trim();
        if (!code) return '';
        return code.includes('`') ? '`` ' + code + ' ``' : '`' + code + '`';
      }
      case 'a': return link(n);
      case 'img': return image(n);
      case 'q': return '"' + renderInline(n.children) + '"';
      default: {
        const block = isBlock(n);
        const inner = renderInline(n.children);
        return block ? ' ' + inner + ' ' : inner;
      }
    }
  }

  function wrap(n, marker) {
    const inner = renderInline(n.children);
    const trimmed = inner.replace(new RegExp('^[ ' + HARD_BREAK + ']+|[ ' + HARD_BREAK + ']+$', 'g'), '');
    if (!trimmed) return inner;
    if (trimmed.startsWith(marker) && trimmed.endsWith(marker) && trimmed.length > marker.length * 2) return inner;
    return (inner[0] === ' ' ? ' ' : '') + marker + trimmed + marker + (inner[inner.length - 1] === ' ' ? ' ' : '');
  }

  function link(n) {
    const inner = renderInline(n.children);
    const href = (attr(n, 'href') || '').trim();
    if (!href || href[0] === '#' || /^javascript:/i.test(href)) return inner;
    const url = resolveUrl(href);
    let text = inner.split(HARD_BREAK).join(' ').trim();
    if (!text) text = escapeText(attr(n, 'aria-label') || attr(n, 'title') || url);
    return (inner[0] === ' ' ? ' ' : '') + '[' + text.replace(/\s+/g, ' ') + '](' + escapeUrl(url) + ')' +
      (inner.length > 1 && inner[inner.length - 1] === ' ' ? ' ' : '');
  }

  function image(n) {
    if (!opts.includeImages) return '';
    let src = attr(n, 'src');
    if (!src || !src.trim() || /^data:/i.test(src)) src = attr(n, 'data-src');
    if (!src || !src.trim() || /^data:/i.test(src)) return '';
    const alt = escapeText((attr(n, 'alt') || '').replace(/\s+/g, ' ').trim());
    return '![' + alt + '](' + escapeUrl(resolveUrl(src.trim())) + ')';
  }

  // ---- blocks
  function renderBlocks(nodes) {
    const blocks = [];
    let pending = [];
    const flush = () => {
      if (!pending.length) return;
      const text = finishInline(renderInline(pending));
      pending = [];
      if (text) blocks.push({ text: escapeLineStart(text), kind: 'p' });
    };
    for (const n of nodes) {
      if (isSkipped(n)) continue;
      if (n.kind === 'element' && isBlock(n)) {
        flush();
        blockElement(n, blocks);
      } else {
        pending.push(n);
      }
    }
    flush();
    return blocks;
  }

  const join = (blocks) => blocks.map((b) => b.text).join('\n\n');

  function blockElement(n, blocks) {
    if (isRawMarkdown(n)) {
      const raw = rawMarkdown(n);
      if (raw) blocks.push({ text: raw, kind: 'other' });
      return;
    }
    switch (n.name) {
      case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': {
        const heading = singleLine(renderInline(n.children));
        if (heading) blocks.push({ text: '#'.repeat(Number(n.name[1])) + ' ' + heading, kind: 'other' });
        return;
      }
      case 'hr':
        blocks.push({ text: '---', kind: 'other' });
        return;
      case 'pre': {
        let code = rawText(n).replace(/\r\n/g, '\n');
        if (code.startsWith('\n')) code = code.slice(1);
        code = code.replace(/[\n \t]+$/, '');
        if (!code.trim()) return;
        const codeEl = n.children.find((c) => isEl(c, 'code'));
        const lang = language(n) || (codeEl ? language(codeEl) : '') || '';
        let fence = '```';
        while (code.includes(fence)) fence += '`';
        blocks.push({ text: fence + lang + '\n' + code + '\n' + fence, kind: 'other' });
        return;
      }
      case 'blockquote': {
        const quote = restoreAlertMarker(join(renderBlocks(n.children)));
        if (quote) blocks.push({ text: quote.split('\n').map((l) => (l ? '> ' + l : '>')).join('\n'), kind: 'other' });
        return;
      }
      case 'ul': case 'ol': case 'menu': case 'dir': {
        const list = renderList(n);
        if (list) blocks.push({ text: list, kind: 'list' });
        return;
      }
      case 'table':
        renderTable(n, blocks);
        return;
      case 'dl':
        for (const c of n.children) {
          if (c.kind !== 'element' || isSkipped(c)) continue;
          if (c.name === 'dt') {
            const term = singleLine(renderInline(c.children));
            if (term) blocks.push({ text: '**' + term + '**', kind: 'p' });
          } else {
            blocks.push(...renderBlocks(c.children));
          }
        }
        return;
      case 'summary': {
        const summary = singleLine(renderInline(n.children));
        if (summary) blocks.push({ text: '**' + summary + '**', kind: 'p' });
        return;
      }
      default:
        blocks.push(...renderBlocks(n.children));
    }
  }

  function language(n) {
    const cls = (attr(n, 'class') || '').split(/\s+/).find((c) => /^(language|lang)-/.test(c));
    return cls ? cls.slice(cls.indexOf('-') + 1) : null;
  }

  function renderList(list) {
    const ordered = list.name === 'ol';
    let number = ordered && /^\d+$/.test(attr(list, 'start') || '') ? parseInt(attr(list, 'start'), 10) : 1;
    const out = [];
    let lastIndent = 0;
    for (const child of list.children) {
      if (isSkipped(child)) continue;
      if (child.kind === 'text' && !child.text.trim()) continue;
      if (isEl(child, 'ul') || isEl(child, 'ol')) {
        const nested = renderList(child);
        if (nested) out.push(...nested.split('\n').map((l) => (l ? ' '.repeat(lastIndent) + l : '')));
        continue;
      }
      const inner = renderBlocks(isEl(child, 'li') ? child.children : [child]);
      if (!inner.length) continue;
      const marker = ordered ? number++ + '. ' : '- ';
      const lines = joinListItem(inner).split('\n');
      out.push(marker + lines[0]);
      for (const line of lines.slice(1)) out.push(line ? ' '.repeat(marker.length) + line : '');
      lastIndent = marker.length;
    }
    return out.join('\n');
  }

  function joinListItem(blocks) {
    return blocks.map((b, i) => (i === 0 ? '' : b.kind === 'list' && blocks[i - 1].kind !== 'list' ? '\n' : '\n\n') + b.text).join('');
  }

  function renderTable(table, blocks) {
    const rows = [];
    let caption = null;
    const cells = (tr) => tr.children.filter((c) => (isEl(c, 'td') || isEl(c, 'th')) && !isSkipped(c));
    for (const child of table.children) {
      if (child.kind !== 'element' || isSkipped(child)) continue;
      if (child.name === 'tr') rows.push(cells(child));
      else if (['thead', 'tbody', 'tfoot'].includes(child.name)) {
        for (const tr of child.children) if (isEl(tr, 'tr') && !isSkipped(tr)) rows.push(cells(tr));
      } else if (child.name === 'caption') caption = child;
    }
    const nonEmpty = rows.filter((r) => r.length);
    if (!nonEmpty.length) return;
    const columns = Math.max(...nonEmpty.map((r) => r.length));
    if (columns === 1) {
      for (const row of nonEmpty) blocks.push(...renderBlocks(row[0].children));
      return;
    }
    if (caption) {
      const captionText = singleLine(renderInline(caption.children));
      if (captionText) blocks.push({ text: '**' + captionText + '**', kind: 'p' });
    }
    const cellText = (cell) => renderBlocks(cell.children).map((b) => b.text).join(' ')
      .replace(/ {2}\n/g, ' ').replace(/\n/g, ' ').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
    const row = (r) => '|' + Array.from({ length: columns }, (_, c) => {
      const text = c < r.length ? cellText(r[c]) : '';
      return ' ' + text + (text ? ' |' : '|');
    }).join('');
    const lines = [row(nonEmpty[0]), '|' + ' --- |'.repeat(columns), ...nonEmpty.slice(1).map(row)];
    blocks.push({ text: lines.join('\n'), kind: 'other' });
  }

  return join(renderBlocks(root.children)).trim();
}

function finishInline(text) {
  return text
    .replace(/[ \t\r\n]+/g, ' ')
    .replace(new RegExp(' *' + HARD_BREAK + ' *', 'g'), HARD_BREAK)
    .replace(new RegExp('^[ ' + HARD_BREAK + ']+|[ ' + HARD_BREAK + ']+$', 'g'), '')
    .split(HARD_BREAK).join('  \n');
}

function singleLine(text) {
  return text.split(HARD_BREAK).join(' ').replace(/\s+/g, ' ').trim();
}

export function escapeText(text) {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '\\' || c === '*' || c === '`' || c === '[' || c === ']') out += '\\' + c;
    else if (c === '_') {
      const inWord = i > 0 && i < text.length - 1 && /[\p{L}\p{N}]/u.test(text[i - 1]) && /[\p{L}\p{N}]/u.test(text[i + 1]);
      out += inWord ? c : '\\' + c;
    } else if (c === '<' && i < text.length - 1 && /[A-Za-z/!]/.test(text[i + 1])) out += '\\<';
    else out += c;
  }
  return out;
}

function escapeLineStart(text) {
  if (/^(#|>|[-+] |[-+]$)/.test(text)) return '\\' + text;
  return text.replace(/^(\d+)([.)])(\s|$)/, '$1\\$2$3');
}

export function dedent(text) {
  const lines = text.split('\n');
  const indents = lines.filter((l) => l.trim()).map((l) => /^[ \t]*/.exec(l)[0].length);
  if (!indents.length) return '';
  const min = Math.min(...indents);
  return lines.map((l) => (l.trim() ? l.slice(min).replace(/\s+$/, '') : '')).join('\n').replace(/^\n+|\n+$/g, '');
}
