# Changelog

## 0.1.0 (unreleased)

- Ask AI button: *Ask AI about this page* opens a dropdown with one entry per AI assistant (ChatGPT, Claude and Perplexity by default) plus *Copy page as Markdown* and *View as Markdown*. Configured in Sitecore: `Ask AI Settings` and `AI Assistant` templates, default items under `/sitecore/system/Modules/Markdown For AI/Ask AI` (create-only on push), the `Ask AI` rendering, `ask-ai` placeholder settings and `@Html.AskAi()`.
- `<ask-ai>` web component, framework free. Without a Markdown URL it falls back to the page's plain text.
- Markdown versions of Sitecore MVC pages at `/page.md`, which the Ask AI prompts point to. Only the page's placeholders are rendered; renderings in `MarkdownForAI.ExcludedPlaceholders` are skipped at any depth; `data-md-ignore` removes markup. Other layout types answer `/page.md` with 404.
- Front matter (`MarkdownForAI.FrontMatterFields`): title, description, url, language, last_updated. A title of `*` is always left out.
- Caching: finished Markdown per site, database, language, item, version, device, host and URL path, served before layout resolution; one build per page under concurrency; size limit; query strings ignored by default; only `200` responses stored; never for logged-in users or `master` content; cleared on publish without letting in-flight builds store stale results.
- Markdown requests never use the rendering (HTML) cache; works with custom `SetCacheability` and `GenerateCacheKey` processors.
- No third-party dependencies: built-in HTML parser and converter. GitHub alerts are kept intact.
- Module items under Modules folders, outside the Helix paths that solutions serialize.
- Release files: a Sitecore package (built offline from the serialized items by `tools/New-SitecorePackage.ps1`), a files zip with the Sitecore CLI serialization, and a NuGet package that also publishes the module config, Ask AI view and script with the referencing web project and copies the settings `.example` on first build.
- Settings go in `App_Config/Include/MarkdownForAI/z.MarkdownForAI.Site.config` (shipped as `.example`).
- Sitecore 10.1 to 10.5, rule-based config, compiled against ASP.NET MVC 5.2.4.
- Features of the earlier, larger version (llms.txt, WebForms, field mappings, per-component rules, Markdown views, discovery headers, `?format=md`, `Accept` negotiation, HTTP validators) are documented in `docs/extending.md` and kept on the `full-feature` branch.
