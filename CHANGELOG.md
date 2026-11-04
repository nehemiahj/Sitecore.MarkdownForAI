# Changelog

## 0.1.0 (unreleased)

- Markdown versions of Sitecore MVC and WebForms pages: `/page.md`, `?format=md`, optional `Accept: text/markdown`.
- WebForms: excluded renderings and sublayouts are removed in `insertRenderings`; only top-level `sc:placeholder` content is converted (response filter); field mappings answer before rendering; `Ask AI Sublayout`. Other layout types answer `/page.md` with 404.
- Component controls: excluded placeholders, `md` rendering parameter, component default in the rendering definition's Parameters field, config ID lists, default mode, `data-md-ignore`, `*.md.cshtml` views.
- Field mapping source and `IMarkdownSource` extension point.
- `/llms.txt` and `/llms-full.txt` from items inheriting `_LlmsPage`.
- Discovery: HTML pages send `Link: <page.md>; rel="alternate"; type="text/markdown"` (`MarkdownForAI.LinkHeader`, on by default), alongside `@Html.MarkdownAlternateLink()`. The Ask AI button carries the server Markdown URL (`md-src`) itself, so it does not depend on the layout.
- Module items (templates, option items and Ask AI, fixed IDs) under Modules folders (`/sitecore/templates/Modules/Markdown For AI`, `/sitecore/system/Modules/Markdown For AI`, `Renderings/Modules`, `Placeholder Settings/Modules`), outside the Helix paths that solutions serialize.
- Release files: a Sitecore package for the Installation Wizard (built offline from the serialized items by `tools/New-SitecorePackage.ps1`; module items are merged on upgrade, Ask AI items and shared parent folders are skipped when they exist), a files zip with the Sitecore CLI serialization, and a NuGet package with the assembly that also publishes the module config, Ask AI view, sublayout and scripts with the referencing web project (`build/Sitecore.MarkdownForAI.targets`) and copies the settings `.example` into the project on first build.
- Settings go in `App_Config/Include/MarkdownForAI/z.MarkdownForAI.Site.config` (shipped as `.example`), so upgrades can replace the module config.
- Sitecore 10.1 to 10.5, rule-based config. Sitecore 8.0 to 10.0 is covered by the separate Sitecore.MarkdownForAI.Legacy repository.
- `<ask-ai>` web component (ChatGPT, Claude, Perplexity or custom assistants, Copy and View as Markdown) and a JavaScript port of the converter.
- Ask AI button configured in Sitecore: `Ask AI Settings` and `AI Assistant` templates, default items under `/sitecore/system/Modules/Markdown For AI/Ask AI` (create-only on push), the `Ask AI` rendering, `ask-ai` placeholder settings and `@Html.AskAi()`.
- Caching: finished Markdown per site, language, item, version, device and host, served before layout resolution; one build per page under concurrency; ETag, Last-Modified and 304; `Cache-Control: public` for anonymous visitors; size limit; query strings ignored by default.
- Content from `master` is never cached (`MarkdownForAI.NoCacheDatabases`), so local development and preview sites show edits immediately; content delivery (`web`) is cached as before.
- The page cache key includes the URL path, so an item that serves many URLs (such as a wildcard) is cached per URL.
- `MarkdownForAI.FrontMatterFields` chooses the front matter lines (`none` for no front matter); a title of `*` is always left out.
- Markdown requests never use the rendering (HTML) cache; works with custom `SetCacheability` and `GenerateCacheKey` processors.
- Compiled against ASP.NET MVC 5.2.4, the version Sitecore 10.1 to 10.5 ship.
- GitHub alerts (`> [!NOTE]`, `> [!WARNING]`, ...) are kept intact by both converters.
