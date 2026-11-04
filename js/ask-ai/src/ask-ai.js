/**
 * <ask-ai> web component.
 *
 * A menu button for human visitors: "Ask AI about this page" opens a menu with one entry per
 * AI assistant (ChatGPT, Claude, Perplexity, ...) plus "Copy page as Markdown" and "View as
 * Markdown". Framework free, no dependencies.
 *
 * Assistants, first match wins:
 *   1. <ask-ai-provider> child elements (what Sitecore.MarkdownForAI writes from its items)
 *        name      Assistant name, e.g. "ChatGPT"
 *        url       Link pattern; {prompt} is replaced with the URL-encoded prompt. Must be https.
 *                  Without {prompt} the page is copied to the clipboard and the link opened as is.
 *        label     Menu text (default "Open in {name}")
 *        hint      Second line of the menu entry
 *        icon      Image URL shown next to the label
 *        prompt    Overrides the prompt for this assistant
 *   2. The built-in assistants named in the providers attribute (default "chatgpt claude perplexity")
 *
 * Markdown source, first match wins:
 *   1. md-src attribute (URL of the page's Markdown, e.g. /article.md)
 *   2. <link rel="alternate" type="text/markdown" href="..."> in the document head
 *   3. <script type="text/markdown"> inside the target element
 *   4. The target element's HTML, converted in the browser
 *
 * Attributes:
 *   label           Button text (default "Ask AI about this page")
 *   providers       Built-in assistants when there are no <ask-ai-provider> children
 *   actions         Extra menu entries: "copy view" (default), "copy", "view" or "" for none
 *   target          CSS selector of the article container (default: "article, main")
 *   md-src          URL of the Markdown version of the page
 *   prompt          Text sent to the assistant. {url} = Markdown URL, {page} = page URL, {title} = page title
 *   max-url-length  Longest link before falling back to the clipboard (default 6000)
 *   no-link         Never send the .md link; always send the text itself
 *   theme           "light" (default), "dark", or "auto" to follow the visitor's system setting
 *
 * Events: "askai:action" with detail { action: "open" | "copy" | "view", provider, mode, ok }.
 */
import { htmlToMarkdown, RAW_MARKDOWN_TYPES } from './html-to-markdown.js';

/** Assistants that accept a prefilled prompt in the URL. Sites can add more with <ask-ai-provider>. */
export const BUILT_IN_PROVIDERS = {
  chatgpt: { name: 'ChatGPT', url: 'https://chatgpt.com/?q={prompt}' },
  claude: { name: 'Claude', url: 'https://claude.ai/new?q={prompt}' },
  perplexity: { name: 'Perplexity', url: 'https://www.perplexity.ai/search?q={prompt}' },
};

const DEFAULT_LABEL = 'Ask AI about this page';
const DEFAULT_HINT = 'Ask questions about this page';
const DEFAULT_LINK_PROMPT = 'Read this page so I can ask you questions about it: {url}';
const DEFAULT_TEXT_PROMPT = 'Here is an article titled "{title}" ({page}). Please read it so I can ask you questions about it.';
const CLIPBOARD_PROMPT = 'I copied an article titled "{title}" to my clipboard ({page}). I will paste it in my next message; please wait for it before answering.';

/** True for absolute https URLs; assistant links never use other schemes (no javascript: or data:). */
export function isSafeProviderUrl(url) {
  return typeof url === 'string' && /^https:\/\/[^\s]+$/i.test(url.trim());
}

/** Pure helper, exported for tests: decides how to hand the page to an assistant. */
export function buildAskLink({ urlPattern, markdown, markdownUrl, pageUrl, title, prompt, maxUrlLength = 6000, allowLink = true }) {
  const fill = (template) => template
    .replace(/\{url\}/g, markdownUrl || pageUrl || '')
    .replace(/\{page\}/g, pageUrl || '')
    .replace(/\{title\}/g, title || 'this page');

  if (!urlPattern.includes('{prompt}')) return { mode: 'clipboard', url: urlPattern, prefilled: false };
  const link = (text) => urlPattern.replace('{prompt}', encodeURIComponent(text));

  if (allowLink && markdownUrl && /^https?:\/\//i.test(markdownUrl)) {
    const url = link(fill(prompt || DEFAULT_LINK_PROMPT));
    if (url.length <= maxUrlLength) return { mode: 'link', url, prefilled: true };
  }

  const inline = link(fill(prompt && !prompt.includes('{url}') ? prompt : DEFAULT_TEXT_PROMPT) + '\n\n' + (markdown || ''));
  if (markdown && inline.length <= maxUrlLength) return { mode: 'inline', url: inline, prefilled: true };

  return { mode: 'clipboard', url: link(fill(CLIPBOARD_PROMPT)), prefilled: true };
}

/** Pure helper, exported for tests: the assistants for an element, from children or built-ins. */
export function resolveProviders(children, providersAttribute) {
  const fromChildren = children.map((el) => ({
    name: (el.getAttribute('name') || '').trim(),
    url: (el.getAttribute('url') || '').trim(),
    label: el.getAttribute('label'),
    hint: el.getAttribute('hint'),
    icon: el.getAttribute('icon'),
    prompt: el.getAttribute('prompt'),
  }));
  const list = fromChildren.length
    ? fromChildren
    : (providersAttribute == null ? 'chatgpt claude perplexity' : providersAttribute)
      .split(/[\s,]+/).map((id) => BUILT_IN_PROVIDERS[id.toLowerCase()]).filter(Boolean).map((p) => ({ ...p }));
  return list
    .filter((p) => p.name && isSafeProviderUrl(p.url))
    .map((p) => ({ ...p, label: p.label || 'Open in ' + p.name, hint: p.hint == null ? DEFAULT_HINT : p.hint }));
}

const STYLE = `
:host { --askai-bg: #ffffff; --askai-fg: #1f1e1d; --askai-border: #d6d3cc; --askai-hover: #f3f1ec; --askai-accent: #1f6f5c;
  --askai-radius: 8px; --askai-font: inherit; display: inline-block; position: relative; font-family: var(--askai-font); }
@media (prefers-color-scheme: dark) {
  :host([theme="auto"]) { --askai-bg: #262624; --askai-fg: #f5f4ef; --askai-border: #45443f; --askai-hover: #30302e; }
}
:host([theme="dark"]) { --askai-bg: #262624; --askai-fg: #f5f4ef; --askai-border: #45443f; --askai-hover: #30302e; }
button { font: inherit; font-size: 14px; color: var(--askai-fg); background: transparent; border: 0; cursor: pointer;
  padding: 7px 12px; display: inline-flex; align-items: center; gap: 8px; min-height: 36px; }
button:hover { background: var(--askai-hover); }
button:focus-visible { outline: 2px solid var(--askai-accent); outline-offset: -2px; }
.trigger { border: 1px solid var(--askai-border); border-radius: var(--askai-radius); background: var(--askai-bg); }
.menu { position: absolute; left: 0; top: calc(100% + 4px); min-width: 250px; z-index: 1000; background: var(--askai-bg);
  border: 1px solid var(--askai-border); border-radius: var(--askai-radius); padding: 4px; box-shadow: 0 6px 24px rgba(0,0,0,.12); }
.menu[hidden] { display: none; }
.menu button { width: 100%; justify-content: flex-start; border-radius: 6px; text-align: left; }
.menu hr { border: 0; border-top: 1px solid var(--askai-border); margin: 4px 0; }
.text { display: flex; flex-direction: column; }
.hint { font-size: 12px; opacity: .7; }
.toast { position: absolute; left: 0; top: calc(100% + 4px); white-space: nowrap; font-size: 13px; color: var(--askai-bg);
  background: var(--askai-fg); padding: 6px 10px; border-radius: 6px; }
.toast:empty { display: none; }
svg, img { width: 16px; height: 16px; flex: none; }
img { object-fit: contain; }
`;

const ICON_SPARK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 1l1.6 4.4L14 7l-4.4 1.6L8 13 6.4 8.6 2 7l4.4-1.6z"/></svg>';
const ICON_CHEVRON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" d="M4 6l4 4 4-4"/></svg>';
const ICON_COPY = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="9" height="9" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M11 3.5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h.5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';
const ICON_DOC = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 1.5h5.5L13 5v9.5H4z" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M6 8h5M6 11h5" stroke="currentColor" stroke-width="1.4"/></svg>';

// Lets Node import the pure helpers for tests without a DOM.
const ElementBase = typeof HTMLElement === 'undefined' ? class {} : HTMLElement;

export class AskAi extends ElementBase {
  constructor() {
    super();
    this._markdown = null;
    this._loading = null;
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (this._rendered) return;
    this._rendered = true;
    this._providers = resolveProviders(Array.from(this.querySelectorAll(':scope > ask-ai-provider')), this.getAttribute('providers'));
    const actionsAttribute = this.getAttribute('actions');
    this._actions = (actionsAttribute == null ? 'copy view' : actionsAttribute).toLowerCase().split(/[\s,]+/).filter(Boolean);

    this.shadowRoot.innerHTML = `<style>${STYLE}</style>
      <button class="trigger" type="button" part="button">${ICON_SPARK}<span class="label"></span></button>
      <div class="menu" role="menu" hidden part="menu"></div>
      <div class="toast" role="status" aria-live="polite"></div>`;
    this._trigger = this.shadowRoot.querySelector('.trigger');
    this._menu = this.shadowRoot.querySelector('.menu');
    this._toast = this.shadowRoot.querySelector('.toast');
    this.shadowRoot.querySelector('.label').textContent = this.getAttribute('label') || DEFAULT_LABEL;

    this._entries = [];
    this._providers.forEach((provider) => this._addEntry(provider.label, provider.hint, provider.icon, ICON_SPARK, () => this.openIn(provider)));
    if (this._providers.length && this._actions.length) this._menu.appendChild(document.createElement('hr'));
    if (this._actions.includes('copy')) this._addEntry('Copy page as Markdown', 'For pasting into any AI tool', null, ICON_COPY, () => this.copyMarkdown());
    if (this._actions.includes('view')) this._addEntry('View as Markdown', 'Plain text version of this page', null, ICON_DOC, () => this.viewMarkdown());

    if (!this._entries.length) {
      this.hidden = true;
      return;
    }

    // One assistant and nothing else in the menu: the button opens it directly.
    this._direct = this._entries.length === 1 && this._providers.length === 1;
    if (!this._direct) {
      this._trigger.insertAdjacentHTML('beforeend', ICON_CHEVRON);
      this._trigger.setAttribute('aria-haspopup', 'menu');
      this._trigger.setAttribute('aria-expanded', 'false');
    }

    this._trigger.addEventListener('click', () => (this._direct ? this.openIn(this._providers[0]) : this._setOpen(this._menu.hidden)));
    this._trigger.addEventListener('pointerenter', () => this.loadMarkdown(), { once: true });
    this._trigger.addEventListener('focus', () => this.loadMarkdown(), { once: true });
    this.shadowRoot.addEventListener('keydown', (e) => this._onKeyDown(e));
    this._onOutside = (e) => { if (!e.composedPath().includes(this)) this._setOpen(false); };
    document.addEventListener('pointerdown', this._onOutside);
  }

  disconnectedCallback() {
    document.removeEventListener('pointerdown', this._onOutside);
    this._rendered = false;
  }

  _addEntry(label, hint, iconUrl, fallbackIcon, run) {
    const item = document.createElement('button');
    item.type = 'button';
    item.setAttribute('role', 'menuitem');
    if (iconUrl) {
      const img = document.createElement('img');
      img.src = iconUrl;
      img.alt = '';
      item.appendChild(img);
    } else {
      item.insertAdjacentHTML('beforeend', fallbackIcon);
    }
    const text = document.createElement('span');
    text.className = 'text';
    const main = document.createElement('span');
    main.textContent = label;
    text.appendChild(main);
    if (hint) {
      const second = document.createElement('span');
      second.className = 'hint';
      second.textContent = hint;
      text.appendChild(second);
    }
    item.appendChild(text);
    item.addEventListener('click', () => {
      this._setOpen(false);
      this._trigger.focus();
      run();
    });
    this._menu.appendChild(item);
    this._entries.push(item);
  }

  /** Absolute URL of the Markdown version, if the page declares one. */
  get markdownUrl() {
    const explicit = this.getAttribute('md-src');
    const alternate = document.querySelector('link[rel~="alternate"][type="text/markdown"]');
    const href = explicit || (alternate && alternate.getAttribute('href'));
    if (!href) return null;
    try {
      return new URL(href, document.baseURI).href;
    } catch (e) {
      return null;
    }
  }

  get pageUrl() {
    const canonical = document.querySelector('link[rel="canonical"]');
    return (canonical && canonical.href) || location.href.split('#')[0];
  }

  /** Loads (once) and returns the page's Markdown. */
  loadMarkdown() {
    if (this._markdown !== null) return Promise.resolve(this._markdown);
    if (!this._loading) {
      this._loading = this._resolveMarkdown()
        .then((md) => { this._markdown = md; return md; })
        .finally(() => { this._loading = null; });
    }
    return this._loading;
  }

  async _resolveMarkdown() {
    const url = this.markdownUrl;
    if (url) {
      try {
        const response = await fetch(url, { credentials: 'same-origin', headers: { Accept: 'text/markdown, text/plain' } });
        if (response.ok) return (await response.text()).trim();
      } catch (e) {
        // Fall through to the in-page sources.
      }
    }

    const target = document.querySelector(this.getAttribute('target') || 'article, main') || document.body;
    const inline = Array.from(target.querySelectorAll('script')).find((s) => RAW_MARKDOWN_TYPES.includes((s.type || '').toLowerCase()));
    if (inline) return inline.textContent.trim();

    const body = htmlToMarkdown(target.innerHTML, { baseUrl: document.baseURI });
    const title = (document.title || '').trim();
    const startsWithHeading = /^#\s/.test(body);
    return [startsWithHeading || !title ? '' : '# ' + title, 'Source: ' + this.pageUrl, body].filter(Boolean).join('\n\n');
  }

  /** Opens the page in one assistant: a prefilled prompt when the URL allows it, otherwise via the clipboard. */
  async openIn(provider) {
    // Open the tab synchronously so popup blockers allow it, then point it at the assistant.
    const tab = window.open('about:blank', '_blank');
    if (tab) tab.opener = null;
    let ok = false;
    let mode = null;
    try {
      const markdown = await this.loadMarkdown();
      const plan = buildAskLink({
        urlPattern: provider.url,
        markdown,
        markdownUrl: this.markdownUrl,
        pageUrl: this.pageUrl,
        title: document.title,
        prompt: provider.prompt || this.getAttribute('prompt'),
        maxUrlLength: parseInt(this.getAttribute('max-url-length'), 10) || 6000,
        allowLink: !this.hasAttribute('no-link'),
      });
      mode = plan.mode;
      if (plan.mode === 'clipboard') {
        await this._writeClipboard(markdown);
        this._say('Page copied. Paste it into ' + provider.name + '.');
      }
      if (tab) tab.location.href = plan.url;
      else window.location.href = plan.url;
      ok = true;
    } catch (e) {
      if (tab) tab.close();
      this._say('Could not open ' + provider.name + '. Try "Copy page as Markdown".');
    }
    this._emit('open', provider.name, mode, ok);
  }

  async copyMarkdown() {
    let ok = false;
    try {
      await this._writeClipboard(await this.loadMarkdown());
      this._say('Copied as Markdown.');
      ok = true;
    } catch (e) {
      this._say('Copy failed.');
    }
    this._emit('copy', null, null, ok);
  }

  async viewMarkdown() {
    const url = this.markdownUrl;
    if (url) {
      window.open(url, '_blank', 'noopener');
      this._emit('view', null, 'link', true);
      return;
    }
    const tab = window.open('about:blank', '_blank');
    const blob = new Blob([await this.loadMarkdown()], { type: 'text/plain;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    if (tab) tab.location.href = blobUrl;
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    this._emit('view', null, 'blob', !!tab);
  }

  async _writeClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(area);
    area.select();
    const done = document.execCommand('copy');
    area.remove();
    if (!done) throw new Error('copy failed');
  }

  _setOpen(open) {
    if (this._direct) return;
    this._menu.hidden = !open;
    this._trigger.setAttribute('aria-expanded', String(open));
    if (open) {
      this.loadMarkdown();
      this._entries[0].focus();
    }
  }

  _onKeyDown(e) {
    if (this._direct) return;
    if (this._menu.hidden) {
      if (e.key === 'ArrowDown' && e.target === this._trigger) {
        e.preventDefault();
        this._setOpen(true);
      }
      return;
    }
    const index = this._entries.indexOf(this.shadowRoot.activeElement);
    if (e.key === 'Escape') {
      e.preventDefault();
      this._setOpen(false);
      this._trigger.focus();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      this._entries[(index + step + this._entries.length) % this._entries.length].focus();
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      this._entries[e.key === 'Home' ? 0 : this._entries.length - 1].focus();
    } else if (e.key === 'Tab') {
      this._setOpen(false);
    }
  }

  _say(message) {
    this._toast.textContent = message;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => { this._toast.textContent = ''; }, 3500);
  }

  _emit(action, provider, mode, ok) {
    this.dispatchEvent(new CustomEvent('askai:action', { bubbles: true, composed: true, detail: { action, provider, mode, ok } }));
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('ask-ai')) {
  customElements.define('ask-ai', AskAi);
}
