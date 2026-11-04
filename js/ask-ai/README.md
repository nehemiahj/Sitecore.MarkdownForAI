# ask-ai

A web component that lets readers ask an AI assistant about the current article. One button, **Ask AI about this page**, opens a menu:

- **Open in ChatGPT**, **Open in Claude**, **Open in Perplexity**, or any assistant you add
- **Copy page as Markdown** and **View as Markdown**

No dependencies, no build step, and it works on any site, not only Sitecore.

```html
<script type="module" src="/scripts/markdownforai/ask-ai.js"></script>

<ask-ai target="article"></ask-ai>
```

With Sitecore.MarkdownForAI you don't write this by hand: the **Ask AI** rendering (or `@Html.AskAi()`) writes it from Sitecore items, so editors change the text and the assistants without a deploy. See the main README.

## Choosing the assistants

Without children, the component shows the built-in assistants named in `providers` (default `chatgpt claude perplexity`, in that order). Add `<ask-ai-provider>` children to define your own list instead:

```html
<ask-ai label="Ask AI about this article">
  <ask-ai-provider name="ChatGPT" url="https://chatgpt.com/?q={prompt}"></ask-ai-provider>
  <ask-ai-provider name="Claude" url="https://claude.ai/new?q={prompt}" label="Ask Claude"></ask-ai-provider>
  <ask-ai-provider name="Copilot" url="https://copilot.microsoft.com/" hint="Copies the page, then opens Copilot"></ask-ai-provider>
</ask-ai>
```

| Attribute | Description |
|---|---|
| `name` | Assistant name, used in messages |
| `url` | Link pattern. `{prompt}` is replaced with the URL-encoded prompt. Must be `https`; other schemes are ignored |
| `label` | Menu text (default `Open in {name}`) |
| `hint` | Second line of the menu entry (default "Ask questions about this page"; empty hides it) |
| `icon` | Image URL shown next to the label |
| `prompt` | Prompt for this assistant only |

An assistant whose link has no `{prompt}` still works: the page is copied to the clipboard and the link opens, so the reader can paste it.

Prefill links such as `chatgpt.com/?q=` and `claude.ai/new?q=` are how these web apps accept a starting prompt, not documented public APIs. They can change, which is why the list is data, not code. Check each one in a logged-in browser now and then.

## Where the Markdown comes from

The first source that works wins:

1. **`md-src`** attribute, e.g. `md-src="/pet-health/cat-kidney-disease.md"`.
2. **`<link rel="alternate" type="text/markdown" href="...">`** in the page head. `@Html.MarkdownAlternateLink()` from Sitecore.MarkdownForAI writes this tag.
3. **`<script type="text/markdown">`** inside the target element, for sites that keep the raw Markdown in the page.
4. **The target element's HTML**, converted in the browser with the same rules as the server converter.

The Markdown is fetched once, on hover, focus or when the menu opens, so clicks respond quickly.

## How a page is handed over

| Situation | What happens |
|---|---|
| Public `.md` URL available | Opens the assistant with a short prompt containing the `.md` URL |
| No URL, article fits in `max-url-length` | Puts the prompt and the Markdown in the link |
| Article too long, or no `{prompt}` in the link | Copies the Markdown to the clipboard and opens the assistant |

The tab is opened synchronously on click, so popup blockers allow it.

## Attributes

| Attribute | Default | Description |
|---|---|---|
| `label` | `Ask AI about this page` | Button text |
| `providers` | `chatgpt claude perplexity` | Built-in assistants, used when there are no `<ask-ai-provider>` children |
| `actions` | `copy view` | Extra menu entries: `copy`, `view`, both, or empty for none |
| `target` | `article, main` | CSS selector of the content container |
| `md-src` | none | URL of the page's Markdown |
| `prompt` | see source | Prompt text. `{url}` = Markdown URL, `{page}` = page URL, `{title}` = page title |
| `max-url-length` | `6000` | Longest link before falling back to the clipboard |
| `no-link` | off | Always send the text, never the `.md` link |
| `theme` | `light` | `dark`, or `auto` to follow the visitor's system setting |

With one assistant and no extra actions, the button opens that assistant directly instead of a menu.

## Styling

The component uses Shadow DOM. You can theme it with CSS custom properties or `::part()`:

```css
ask-ai {
  --askai-accent: #0b6e4f;
  --askai-radius: 999px;
  --askai-font: "Inter", sans-serif;
}
ask-ai::part(button) { font-weight: 600; }
```

The available variables are `--askai-bg`, `--askai-fg`, `--askai-border`, `--askai-hover`, `--askai-accent`, `--askai-radius` and `--askai-font`. The parts are `button` and `menu`.

## Events

```js
document.addEventListener('askai:action', (e) => {
  // e.detail = { action: 'open' | 'copy' | 'view', provider: 'ChatGPT' | null,
  //              mode: 'link' | 'inline' | 'clipboard' | 'blob' | null, ok: true }
  analytics.track('ask_ai_' + e.detail.action, e.detail);
});
```

## Accessibility

- The button has `aria-haspopup` and `aria-expanded`, and the menu items use `role="menuitem"`.
- Arrow keys, Home and End move between items. Escape and Tab close the menu.
- Focus returns to the button when the menu closes.
- Status messages are announced through an `aria-live` region.

## Notes

- **AI agents don't click buttons.** For agents, serve `.md` URLs and `/llms.txt` from the server.
- **Converting in the browser** sees the page as rendered, including content added by scripts. Mark anything you don't want sent with `data-md-ignore`.
- **Labels, hints and icons** are inserted as text and image sources, never as HTML.

## Tests

```bash
npm test
```
