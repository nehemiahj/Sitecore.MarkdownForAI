# Extending: features of the full version

The module started as a larger Markdown-for-AI toolkit. The first release keeps only what the Ask AI
button needs: `/page.md` for MVC pages, excluded placeholders, a page cache and the button itself.
Everything below was built, tested and then taken out to keep the module small. This page records what
each feature did and how it plugged in, so it can be added back when a site needs it.

## Where the code is

| Source | Contents |
|---|---|
| Branch **`full-feature`** of this repository | The complete implementation (commit `696579d`), with items, docs and tests |
| [Sitecore.MarkdownForAI.Legacy](https://github.com/nehemiahj/Sitecore.MarkdownForAI.Legacy) | The same features for Sitecore 8.0 to 10.0 (no Ask AI). Archived, not maintained |

Restore a file with `git checkout full-feature -- <path>`. Each section lists the files involved.
Namespaces did not change, so restored files compile against the current code with small edits
(noted per feature).

## Shared building blocks

Several features need these. Restore them first when bringing one back.

- **Request kinds.** `MarkdownRequest` is now a single flag (`IsActive`). The full version had
  `MarkdownRequestKind` (`None`, `Page`, `LlmsTxt`, `LlmsFullTxt`) and `FromExtension`, so `?format=md`
  could fall back to HTML while `/page.md` answered 404.
- **HTTP validators.** `Core/CachedText.cs` held the body plus a strong ETag (FNV-1a hash) and
  Last-Modified, and `ResponseWriter.Cached` answered `304 Not Modified` and sent
  `Cache-Control: public, max-age=HttpCacheMinutes` to anonymous visitors. The cache now stores plain
  strings. Restoring it means changing `MarkdownCache` back to `CachedText`.
- **Markdown modes.** `MarkdownMode.cs` (`Include`, `Exclude`, parser) and
  `Rendering/MarkdownModeResolver.cs`, used by component rules and WebForms.

## Discovery: Link header, alternate link, Accept header, query string

| Feature | What it did | Files | Settings |
|---|---|---|---|
| `Link` header | HTML pages answered with `Link: <https://host/page.md>; rel="alternate"; type="text/markdown"` | `Pipelines/AddMarkdownLinkHeader.cs` (httpRequestBegin, after `LayoutResolver`) | `LinkHeader` (true) |
| `<link>` tag | `@Html.MarkdownAlternateLink()` wrote the same link into `<head>`; also `@Html.MarkdownUrl()` | `Html/HtmlHelperExtensions.cs` | |
| `?format=md` | The normal URL with a switch served Markdown; the switch was removed from the canonical URL | `DetectMarkdownRequest`, `MarkdownPath.RemoveQueryParameter`, `RequestUrls.CurrentPageUrl` | `QueryStringKey` (format), `QueryStringValue` (md) |
| `Accept: text/markdown` | Content negotiation on the normal URL | `DetectMarkdownRequest` | `AcceptHeader` (false) |

**Known issue to fix when restoring:** with `AcceptHeader` on, HTML responses also need `Vary: Accept`
(the full version sent it only on Markdown responses), or a CDN can serve the wrong version. The fix is
to append `Vary: Accept` in `AddMarkdownLinkHeader` when the setting is on.

## llms.txt and llms-full.txt

`/llms.txt` listed the pages that inherit `_LlmsPage` and have **LlmsInclude** checked, grouped by
**LlmsSection** (pages with **LlmsOptional** under `## Optional`), each linking to its `.md` URL.
`/llms-full.txt` concatenated their full Markdown, capped by size. The site start item's **LlmsTitle**
and **LlmsSummary** became the header.

- **Files:** `LlmsTxt/LlmsTxtService.cs`, `Core/LlmsTxtWriter.cs` (pure, unit tested),
  `ModuleItems.cs` (`LlmsFields`, item IDs), `docs/llms-txt.md`, `examples/llms.txt`.
- **Hooks:** `DetectMarkdownRequest` flagged `/llms.txt` and rewrote it to `/` (before
  `FilterUrlExtensions`); `ValidateMarkdownRequest` built and wrote it once the site was known.
- **Items:** template `_LlmsPage` (`{5DF73228-24F4-4350-852D-169D884FFA28}`) with LlmsInclude,
  LlmsOptional, LlmsTitle, LlmsSummary, LlmsSection.
- **Sources:** `tree` (walk the content tree) or `index` (ContentSearch query on `llmsinclude`; needs
  the `Sitecore.ContentSearch` and `Sitecore.ContentSearch.Linq` package references).
- **Settings:** `LlmsTxt.Enabled`, `LlmsTxt.FullEnabled`, `LlmsTxt.Source`, `LlmsTxt.IndexName`,
  `LlmsTxt.MaxItems` (5000), `LlmsTxt.FullMaxChars` (5000000), `LlmsTxt.CacheMinutes` (60).

**Known issues to fix when restoring:**

1. The llms.txt cache key ignored `Context.IsLoggedIn`: a logged-in build could list restricted pages and
   be served to anonymous visitors. Return a null key when logged in.
2. `/llms.txt` was intercepted on every site; check `File.Exists(request.PhysicalPath)` first so a static
   file wins.
3. Make LlmsTitle, LlmsSummary and LlmsSection **Unversioned** so they can be translated (LlmsInclude and
   LlmsOptional stay Shared).
4. With `Source=index` the list is in item path order, not tree order.

## Per-component rules

The full version decided per rendering, first match wins:

1. placeholder in `ExcludedPlaceholders` (kept in this version)
2. `md` rendering parameter on the placement (`include` / `exclude`)
3. `md=` in the rendering definition item's **Parameters** field (the component default)
4. rendering IDs in `ExcludedRenderings` / `IncludedRenderings`
5. `DefaultMode` (`include`, or `exclude` for opt-in sites where only the article component is converted)

- **Files:** `Rendering/MarkdownModeResolver.cs`, `MarkdownMode.cs`, `Pipelines/ApplyMarkdownMode.cs`
  (replace the current `FilterMarkdownRenderings` with it), `docs/component-controls.md`.
- **Items:** template `_MarkdownRenderingParameters` (`{79C0AFAF-6C18-4668-8F26-44707F0980A8}`) with an
  **md** droplist, and option items `/sitecore/system/Modules/Markdown For AI/Modes/include|exclude`.
- **Settings:** `ParameterName` (md), `ExcludedRenderings`, `IncludedRenderings`, `DefaultMode`.

## Markdown views (`Foo.md.cshtml`)

On Markdown requests a view rendering used `Foo.md.cshtml` next to `Foo.cshtml` when it existed, so a
component could write Markdown by hand. `@Html.ToMarkdown(html)` converted a fragment inside such a view.

- **Files:** `Rendering/MarkdownViewEngine.cs`, `Pipelines/RegisterMarkdownViewEngine.cs` (initialize
  pipeline), `HtmlHelperExtensions.ToMarkdown`, `examples/sitecore/ArticleBody.md.cshtml`.

## Field mapping and custom sources

Markdown built straight from item fields, without rendering the page: a `<mapping template="..."
title="Title" summary="Summary" body="Body" meta="Author|Published Date|Topics" />` per template.
Body fields went through `FieldRenderer` (links and media URLs expanded); `meta` fields went into the
front matter (reference fields as display names, dates as `yyyy-MM-dd`). Custom logic implemented
`IMarkdownSource` and was registered in the `sources` list.

- **Files:** `Sources/IMarkdownSource.cs` (`MarkdownSourceList`), `Sources/FieldMappingSource.cs`,
  `ItemMetadata.FrontMatterValues`, the `<markdownForAI><sourceList>` block in the module config.
- **Hook:** `MarkdownPageRenderer` asked the sources first and fell back to rendering.
- Mapped pages also put their full text into `llms-full.txt`.

## WebForms

Pages with `.aspx` layouts were converted with the same rules:

- `insertRenderings` (last processor): excluded renderings and sublayouts removed before their controls
  were created; the rest bypassed the HTML cache.
- `renderLayout` (last processor): each top-level `sc:placeholder` wrapped in comment markers, and a
  response filter converted only the marked HTML (fallback: the body without the server form).
- `CheckMarkdownLayout` let a field mapping answer before the page rendered.
- **Ask AI Sublayout** (`layouts/MarkdownForAI/AskAi.ascx`, item `{BB299BE4-6A32-4A44-85C2-DA51BDA760B6}`)
  rendered the button on WebForms pages.

- **Files:** `WebForms/FilterMarkdownRenderings.cs`, `WebForms/PrepareMarkdownPage.cs`,
  `WebForms/MarkdownResponseFilter.cs`, `Core/MarkedRegions.cs` (unit tested), `layouts/`.
- **Settings:** `WebForms.Enabled` (true).

**Known issue to fix when restoring:** when the response is not 200 or conversion fails, the filter
passes the HTML through while the content type is already `text/markdown`.

## Ask AI: in-browser converter

`js/ask-ai/src/html-to-markdown.js` (a JavaScript port of the server converter, with tests) let the
button convert the page in the browser when there was no `.md` URL, and read a
`<script type="text/markdown">` block. This version falls back to the page's plain text instead.

## Fixes already in this version

Found in a review of the full version and fixed here, so keep them when restoring code:

- Only 200 responses are cached; a status set earlier (such as 404) is kept on cached answers.
- A page build still running when a publish clears the cache does not store its result in the new cache.
- List settings are parsed once per value, not on every read.
- Front matter dates use the invariant culture.
