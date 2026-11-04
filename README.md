# Sitecore.MarkdownForAI

**Give AI agents and AI assistants a clean Markdown copy of every page on a server-rendered Sitecore site: MVC or WebForms.**

For Sitecore **10.1 to 10.5** sites that render on the server, with **MVC** renderings, **WebForms** sublayouts, or both. (Sitecore 8.0 to 10.0: see [Sitecore.MarkdownForAI.Legacy](#supported-versions). Headless sites are out of scope; they already have Layout Service.)

```
https://www.example.com/pet-health/cat-kidney-disease       normal HTML page, unchanged
https://www.example.com/pet-health/cat-kidney-disease.md    the same page as Markdown: no header, footer, menus or scripts
https://www.example.com/llms.txt                            an index of your articles for AI agents
```

## Why

Headless sites (JSS, XM Cloud) already have Layout Service JSON that an AI tool can read. Server-rendered sites, MVC and WebForms alike, only have full HTML pages: the article is buried between navigation, cookie banners, footers and kilobytes of script. AI agents and assistants such as ChatGPT, Claude and Perplexity read that noise, waste their context on it and sometimes quote your footer instead of your article.

This module gives server-rendered sites what headless sites get for free. It is aimed at content-heavy sites (articles, guides, knowledge bases) that want those pages to be easy for AI to read, without re-platforming.

## What you get

| Feature | What it does |
|---|---|
| **Markdown pages** | `/any-page.md` (or `?format=md`) returns the page as Markdown with YAML front matter. Works for MVC and WebForms layouts. Only the content components are rendered. |
| **Component control** | Choose per placeholder, per component or per placement what goes into the Markdown. Header and footer are out by default. |
| **llms.txt** | `/llms.txt` lists the pages you opt in, grouped by section, with links to their `.md` versions. `/llms-full.txt` holds the full text. |
| **Ask AI button** | A button for readers: *Ask AI about this page* opens ChatGPT, Claude, Perplexity or any assistant you add, plus *Copy as Markdown* and *View as Markdown*. Text and assistants are Sitecore items, so editors change them without a deploy. |
| **Caching** | The finished Markdown is cached and served before Sitecore resolves the layout, with ETags and `304 Not Modified`. Your HTML rendering cache is not touched. |
| **SEO safe** | Every Markdown response sends `Link: rel="canonical"` to the HTML page and `X-Robots-Tag: noindex`. |

No third-party dependencies: the HTML parser and converter are built in, so there are no HtmlAgilityPack version clashes with any Sitecore release.

## Quick start

The fastest way to see it working, on one CM or a single (Standalone) instance:

1. **Install** `Sitecore.MarkdownForAI-<version>.zip` with **Desktop > Development Tools > Installation Wizard**.
2. **Configure:** rename `App_Config/Include/MarkdownForAI/z.MarkdownForAI.Site.config.example` to `z.MarkdownForAI.Site.config` and set two values:
   - `MarkdownForAI.Sites`: your site name(s) from `<sites>`, for example `mysite`.
   - `MarkdownForAI.ExcludedPlaceholders`: the placeholders that hold your header, navigation and footer.
3. **Publish** the `Markdown For AI` items (templates, system, renderings, placeholder settings).
4. **Open** any page with `.md` added: `https://yoursite/about-us.md`, or `/index.md` for the home page.

Markdown is answered on **Standalone** and **ContentDelivery** servers only, so on a separate CM nothing happens; test on a CD or a Standalone instance. For CI deployments (NuGet and Sitecore CLI), see [Install](#install). Something not working? See [Troubleshooting](#troubleshooting).

## Contents

- [Quick start](#quick-start)
- [Supported versions](#supported-versions)
- [Install](#install)
- [Next steps](#next-steps)
- [How agents find the Markdown](#how-agents-find-the-markdown)
- [Choosing what goes into the Markdown](#choosing-what-goes-into-the-markdown)
- [WebForms pages](#webforms-pages)
- [llms.txt](#llmstxt)
- [The Ask AI button](#the-ask-ai-button)
- [Caching](#caching)
- [Troubleshooting](#troubleshooting)
- [Settings reference](#settings-reference)
- [How it works](#how-it-works)
- [Limitations](#limitations)
- [Building from source](#building-from-source)
- [Content licensing](#content-licensing)

## Supported versions

| Repository | Sitecore | .NET | Config | Items |
|---|---|---|---|---|
| **Sitecore.MarkdownForAI** (this one) | 10.1 to 10.5, MVC and WebForms | `net48`, compiled against 10.1 and ASP.NET MVC 5.2.4 | Rule-based (`role:require`) in `App_Config/Modules/MarkdownForAI` | Sitecore package or Sitecore CLI serialization |
| **Sitecore.MarkdownForAI.Legacy** | 8.0 to 10.0, MVC and WebForms | `net45`, compiled against 8.0 | Include files in `App_Config/Include/MarkdownForAI` | Sitecore package, or created at startup by a built-in installer |

Both editions convert MVC and WebForms pages, cache the result and serve `llms.txt`. The **Ask AI** button ships with this edition only.

## Install

Each release has three files. Use the one that matches how you deploy:

| File | Use it when |
|---|---|
| `Sitecore.MarkdownForAI-<version>.zip` | **Sitecore package.** You install modules on the CM with the Installation Wizard. Contains the files and the items. |
| `Sitecore.MarkdownForAI-<version>-files.zip` | You deploy from source control and CI. The same files laid out like the web root, plus the Sitecore CLI serialization. |
| `Sitecore.MarkdownForAI.<version>.nupkg` | You build in CI. The assembly plus the module's config, view and scripts, published with your web project. |

Run `./build.ps1` to build all three yourself (see [Building from source](#building-from-source)).

### Option A: Sitecore package (quickest)

1. On the CM, open **Desktop > Development Tools > Installation Wizard** and install `Sitecore.MarkdownForAI-<version>.zip`.
2. Rename `App_Config/Include/MarkdownForAI/z.MarkdownForAI.Site.config.example` to `z.MarkdownForAI.Site.config` and set your sites (see [Your settings](#your-settings)).
3. Publish the items listed under [Items](#items).
4. Copy the same files to every CD server: the package installs files on the CM only.

### Option B: NuGet and Sitecore CLI (CI deployment)

1. **Package:** add the `Sitecore.MarkdownForAI` NuGet package to the web project you publish. Besides the assembly, it publishes the module's files with your project at the right web root paths, so every server gets them and an upgrade is a version bump:

   | Path in the web root | Notes |
   |---|---|
   | `App_Config/Modules/MarkdownForAI/Sitecore.MarkdownForAI.config` | The module config. Do not edit it; upgrades replace it. |
   | `Views/MarkdownForAI/AskAi.cshtml` | Ask AI rendering (MVC) |
   | `layouts/MarkdownForAI/AskAi.ascx` | Ask AI sublayout (WebForms) |
   | `scripts/markdownforai/ask-ai.js`, `html-to-markdown.js` | Ask AI web component |

   These come from the package, not your source tree. To deploy them yourself instead, set the MSBuild property `MarkdownForAIPublishFiles` to `false` and commit them from the files zip.
2. **Your settings:** the first build copies `z.MarkdownForAI.Site.config.example` into `App_Config/Include/MarkdownForAI/` in your project. Rename it to `z.MarkdownForAI.Site.config`, set your sites and placeholders (see [Your settings](#your-settings)), and add it to the project as content. (Set `MarkdownForAICopySiteConfig` to `false` to skip the copy.)
3. **Items:** either install the Sitecore package on the CM (the wizard asks before it overwrites files you have already deployed), or serialize them with Sitecore CLI: copy `serialization/` into your repository, for example as `MarkdownForAI/serialization/`, and add it to the module list in `sitecore.json`:

   ```json
   "modules": [ "src/*/*/*.module.json", "MarkdownForAI/serialization/*.module.json" ]
   ```

   ```
   dotnet sitecore ser push
   ```
4. Publish the items.

The config uses role rules: the Markdown pipelines run on **ContentDelivery** and **Standalone** only. On a CM server the module stays idle, apart from the Ask AI button in preview.

### Items

| Item | Purpose |
|---|---|
| `/sitecore/templates/Modules/Markdown For AI/_LlmsPage` | Base template for pages listed in `llms.txt` |
| `/sitecore/templates/Modules/Markdown For AI/_MarkdownRenderingParameters` | Adds an **md** droplist (include, exclude) to a rendering's parameters |
| `/sitecore/templates/Modules/Markdown For AI/Ask AI Settings`, `AI Assistant` | Templates for the Ask AI button |
| `/sitecore/system/Modules/Markdown For AI/Modes` | The include and exclude options of the **md** droplist |
| `/sitecore/system/Modules/Markdown For AI/Ask AI` | Button settings, with ChatGPT, Claude and Perplexity below it |
| `/sitecore/layout/Renderings/Modules/Markdown For AI/Ask AI`, `Ask AI Sublayout` | The Ask AI button for MVC and for WebForms |
| `/sitecore/layout/Placeholder Settings/Modules/Markdown For AI/ask-ai` | Lets editors add the button to an `ask-ai` placeholder |

Everything sits under **Modules** folders, outside the `Foundation`, `Feature` and `Project` folders that Helix solutions serialize. A solution whose own serialization tracks `/sitecore/templates/Foundation` with `createUpdateAndDelete` would otherwise delete the module's items on its next push. `/sitecore/templates/Modules` and `/sitecore/layout/Placeholder Settings/Modules` are created if missing (with the same ID Sitecore PowerShell Extensions uses for `/sitecore/templates/Modules`) and are never overwritten.

Upgrades keep editors' work. The **Ask AI** items are create-only: the package skips them when they exist, and Sitecore CLI pushes add missing defaults without overwriting or deleting what editors changed. The module's templates, renderings and options are updated.

### Your settings

Keep every change in `App_Config/Include/MarkdownForAI/z.MarkdownForAI.Site.config`, never in the module config. It patches the module config with `set:value`, and upgrades leave it alone:

```xml
<configuration xmlns:patch="http://www.sitecore.net/xmlconfig/" xmlns:set="http://www.sitecore.net/xmlconfig/set/">
  <sitecore>
    <settings>
      <setting name="MarkdownForAI.Sites" set:value="website|blog" />
      <setting name="MarkdownForAI.ExcludedPlaceholders" set:value="header|footer|navigation|breadcrumb|cookie-banner" />
    </settings>
  </sitecore>
</configuration>
```

The settings most sites change, all in the `.example` file:

| Setting (`MarkdownForAI.`) | Set it to |
|---|---|
| `Sites` | Your site names from `<sites>`, pipe separated. The default `website` only fits the sample site. |
| `ExcludedPlaceholders` | The placeholders of your header, navigation, footer and other page chrome. |
| `DefaultMode` | `include` (everything except what you exclude) or `exclude` (only what you mark, see [Only the article component](#only-the-article-component)). |
| `ExcludedRenderings`, `IncludedRenderings` | Rendering item IDs, when a placeholder rule is too coarse. |

Any other setting from the [Settings reference](#settings-reference) works the same way. Check the result in `/sitecore/admin/showconfig.aspx`.

## Next steps

1. Open a few page types with `.md` added and check the output. If the header, menus or footer still appear, add their placeholders to `MarkdownForAI.ExcludedPlaceholders` in [your settings file](#your-settings).
2. Add `_LlmsPage` as a base template to your article templates, check **LlmsInclude** on the articles, publish, and open `/llms.txt`.
3. Add the **Ask AI** rendering to your article template's Standard Values (see [The Ask AI button](#the-ask-ai-button)).
4. Optional: add the discovery link to the layout's `<head>`. Every page already sends it as a `Link` HTTP header; the tag also helps agents that only read the HTML:

   ```cshtml
   @using Sitecore.MarkdownForAI.Html
   @Html.MarkdownAlternateLink()
   ```

A Markdown page looks like this:

```markdown
---
title: "Dental Care for Dogs: A Simple Home Routine"
description: "Why dental disease is so common in dogs, the signs to look for, and a daily routine."
url: "https://www.example.com/articles/dental-care-for-dogs"
language: "en"
last_updated: "2026-10-29"
---

# Dental Care for Dogs: A Simple Home Routine

## Why it matters

Most dogs show some sign of dental disease by the age of three. ...
```

## How agents find the Markdown

There is no single standard yet, so the module offers every common route:

| Route | How it works |
|---|---|
| `Link` header | Every HTML page the module can convert answers with `Link: <https://host/page.md>; rel="alternate"; type="text/markdown"`. Agents see it in the response headers without parsing the page. On by default (`MarkdownForAI.LinkHeader`). |
| `<link>` in the `<head>` | `@Html.MarkdownAlternateLink()` writes the same link into the HTML, like an RSS feed link. |
| `/llms.txt` | One index of the article library with `.md` links and summaries ([llms.txt](#llmstxt)). |
| Ask AI button | Hands the assistant the `.md` URL directly, so nothing has to be discovered ([The Ask AI button](#the-ask-ai-button)). |
| `Accept: text/markdown` | Optional content negotiation on the normal URL (`MarkdownForAI.AcceptHeader`, off by default because CDNs must then vary on `Accept`). |

Search engine crawlers mostly still fetch the HTML; the `.md` responses carry `X-Robots-Tag: noindex` so the HTML page keeps ranking.

## Choosing what goes into the Markdown

The page layout itself is **never** rendered on a Markdown request: anything the layout file writes directly (a header partial, scripts, a footer bound in code) is gone automatically. Only placeholders are rendered, and every rendering in them is checked in this order. The first rule that matches wins:

| # | Rule | Set in | Example |
|---|---|---|---|
| 1 | **Excluded placeholder** | `MarkdownForAI.ExcludedPlaceholders` | `header\|footer` (any depth; dynamic suffixes such as `footer-{GUID}-0` match) |
| 2 | **Per placement** | the **md** rendering parameter in Presentation Details | `include` or `exclude` |
| 3 | **Per component** | the rendering item's **Parameters** field | `md=exclude` |
| 4 | **Config lists** | `MarkdownForAI.ExcludedRenderings` / `IncludedRenderings` | rendering item IDs |
| 5 | **Default** | `MarkdownForAI.DefaultMode` | `include` |

An excluded rendering is skipped before its controller or view runs, so it costs nothing.

Inside an included component:

- **`data-md-ignore`** on any element removes it: `<div class="share-buttons" data-md-ignore>`.
- **`Foo.md.cshtml`** next to `Foo.cshtml` is used instead on Markdown requests (view and controller renderings). Write Markdown in it; it is passed through as written.

More examples and the editor experience: [docs/component-controls.md](docs/component-controls.md).

### Only the article component

When a page has many components and only one holds the article, switch to **opt-in**, so nothing goes in unless it is marked:

1. Set `MarkdownForAI.DefaultMode` to `exclude`.
2. Mark the article component as included: `md=include` in its rendering item's **Parameters** field (no deploy needed), or its ID in `MarkdownForAI.IncludedRenderings`.

Things to know:

- **Every page type is affected.** A listing page whose list component is not included returns an empty body. Include the main component of each page type you care about.
- **Containers count.** If the article component sits inside a container rendering (grid, tabs, two columns), include the container too. An excluded container never renders its children.

### Field mapping: no rendering at all

For templates where the content lives in fields, build the Markdown straight from them:

```xml
<!-- in z.MarkdownForAI.Site.config, inside <sitecore> (the .example file has this block commented out) -->
<markdownForAI>
  <sourceList>
    <sources>
      <fieldMapping>
        <mappings>
          <mapping template="{YOUR-ARTICLE-TEMPLATE-ID}" title="Title" summary="Summary"
                   body="Body" meta="Author|Published Date|Topics" />
        </mappings>
      </fieldMapping>
    </sources>
  </sourceList>
</markdownForAI>
```

`meta` fields go into the front matter; reference fields become display names and dates become `yyyy-MM-dd`. Mapped pages also put their full text in `llms-full.txt`. For anything else, implement `Sitecore.MarkdownForAI.Sources.IMarkdownSource` and add it to the `sources` list.

## WebForms pages

Pages with a WebForms layout (`.aspx`, sublayouts in `sc:placeholder` controls) work the same way, with the same rules and settings:

- **Excluded renderings and sublayouts never run.** They are removed in the `insertRenderings` pipeline, after personalization, using the same five rules as for MVC (placeholder, `md` parameter, component default, ID lists, default mode).
- **Only placeholder content is converted.** The page renders normally, so server forms, ViewState and sublayout code behave as usual. The module marks each top-level `sc:placeholder` and converts only what is inside. Markup typed straight into the `.aspx` (header, footer, scripts) is left out, just as an MVC layout is never rendered.
- **No placeholders?** A layout without Sitecore placeholders falls back to the page body, minus the `<form runat="server">` wrapper.
- **Field mappings** answer before the page renders at all.
- **Caching** works the same: the finished Markdown is cached and later requests are answered before the layout runs.

`data-md-ignore` works inside sublayouts too. `MarkdownForAI.WebForms.Enabled` set to `false` turns WebForms conversion off (then `/page.md` returns 404 on WebForms pages instead of serving HTML).

## llms.txt

[llms.txt](https://llmstxt.org/) is a plain index that tells AI agents which pages matter.

- **`/llms.txt`** lists pages that inherit `_LlmsPage` and have **LlmsInclude** checked, grouped by **LlmsSection**, each linking to its `.md` URL. Pages with **LlmsOptional** checked go under `## Optional`.
- **`/llms-full.txt`** has the full Markdown of listed pages that use a field mapping (other pages contribute their summary). It is capped by `MarkdownForAI.LlmsTxt.FullMaxChars`.
- The site start item's **LlmsTitle** and **LlmsSummary** become the header.
- `MarkdownForAI.LlmsTxt.Source` is `tree` (walks the content tree; fine for a few thousand pages) or `index` (ContentSearch).

`/llms.txt` is answered at the site root. If your IIS or CDN blocks `.txt` or `.md` requests, allow them for these paths. Writing a good llms.txt: [docs/llms-txt.md](docs/llms-txt.md).

## The Ask AI button

One button, **Ask AI about this page**, opens a menu with one entry per AI assistant, then **Copy page as Markdown** and **View as Markdown**. Each assistant opens with a prompt that points at the page's `.md` URL, so it reads the clean version.

It is a rendering: **Ask AI** (`/sitecore/layout/Renderings/Modules/Markdown For AI/Ask AI`).

### Adding it to pages

| Who | How | Result |
|---|---|---|
| Developer, once (recommended) | Add **Ask AI** to the article template's `__Standard Values` presentation, in a placeholder near the title | Every article has the button; editors do nothing |
| Editor, per page | Experience Editor: **Add here** in an `ask-ai` placeholder, pick **Ask AI**. Content Editor: Presentation > Details > Add | The button on that page only |
| Developer, in code | `@Html.AskAi()` in a view or the layout | No rendering; same Sitecore settings |
| WebForms | Use **Ask AI Sublayout** instead of **Ask AI**, the same three ways | Same button, same settings |

For editors to add it in Experience Editor, put an `ask-ai` placeholder near the article title. The module's placeholder settings already allow **Ask AI** there:

```cshtml
@Html.Sitecore().Placeholder("ask-ai")
```

On WebForms, `<sc:placeholder key="ask-ai" runat="server" />` in a sublayout does the same; both the rendering and the sublayout are allowed there.

To allow the button in another placeholder, add **Ask AI** to that placeholder's **Allowed Controls**.

### Changing the text and the assistants

Editors change everything under `/sitecore/system/Modules/Markdown For AI/Ask AI` and publish:

| Item | Fields |
|---|---|
| **Ask AI** (template `Ask AI Settings`) | Button Label, Prompt (`{url}`, `{page}`, `{title}`), Show Copy Markdown, Show View Markdown, Max Link Length |
| **ChatGPT**, **Claude**, **Perplexity** (template `AI Assistant`) | Assistant Name, Link Pattern (e.g. `https://chatgpt.com/?q={prompt}`), Menu Label, Hint, Prompt, Icon, Enabled |

- **Add an assistant:** insert an `AI Assistant` item under **Ask AI** and fill in its link pattern. No code, no deploy.
- **Order:** the menu follows the content tree order.
- **Per site:** create another `Ask AI Settings` item (with its own assistants) and pick it as the rendering's data source.
- **Link patterns:** `{prompt}` is replaced with the URL-encoded prompt. Without `{prompt}`, the page is copied to the clipboard and the link opens, so the reader pastes it. Only `https` links are accepted.

The rendering item has `md=exclude`, so the button never appears in the Markdown itself. The web component works on any site, with or without Sitecore: [js/ask-ai/README.md](js/ask-ai/README.md).

The prefill links (`?q=`) are how these assistants accept a starting prompt in their web apps. They are not documented public APIs and can change, which is why they are data you can edit.

## Caching

Rendering a page and converting it costs CPU, so the finished result is cached, not the parts:

| Level | What happens | Settings |
|---|---|---|
| **Page** | Finished Markdown per site, database, language, item, version, device, host and URL path, in memory on each server. Cache hits are answered in `httpRequestBegin`, before Sitecore resolves the layout. Concurrent requests for an uncached page build it once. Logged-in visitors are never cached, and neither is content from `master` (local development and preview sites, where a save changes the page and no publish clears the cache). Cleared on `publish:end` and `publish:end:remote`. | `CacheMinutes` (30), `CacheSizeMB` (100), `CacheVaryByQueryString` (false), `NoCacheDatabases` (master) |
| **HTTP** | Cached responses send `ETag` and `Last-Modified` and answer `304 Not Modified`. Anonymous visitors also get `Cache-Control: public, max-age`, so CDNs and agents can keep a copy. The first response after a publish carries Sitecore's own headers. | `HttpCacheMinutes` (10) |
| **llms.txt** | Built once per site, language and host, with the same HTTP headers. | `LlmsTxt.CacheMinutes` (60) |

Query strings are ignored by default, so links with `?utm_source=` share one cache entry and cannot fill memory.

Markdown requests **never** read or write Sitecore's rendering (HTML) cache. The module switches caching off on each rendering in the first `mvc.renderRendering` processor, so it works alongside solutions that replace `SetCacheability` or `GenerateCacheKey` with their own processors.

## Troubleshooting

| What you see | Why | What to do |
|---|---|---|
| `/page.md` returns 404 | The site is not in `MarkdownForAI.Sites`, the request reached a CM server, or the layout is neither MVC nor WebForms | Add the site name; test on a CD or Standalone instance. If IIS or a CDN blocks `.md`, allow it or use `?format=md` |
| `?format=md` shows the normal HTML page, and HTML pages have no `Link` header | The module is not loaded on this server (DLL or config missing) | Check `/sitecore/admin/showconfig.aspx` for `DetectMarkdownRequest` |
| The header, menu or footer is in the Markdown | Their placeholders are not excluded, or they sit inside an included container | Add the placeholder keys to `ExcludedPlaceholders`, or mark the components `md=exclude` |
| A page returns an almost empty Markdown body | `DefaultMode` is `exclude` and the page's main component (or its container) is not included | Mark the component and its container `md=include` |
| Edits do not show in the `.md`, but the HTML page has them | The Markdown is cached until the next publish, and your browser or CDN may keep it for `HttpCacheMinutes` | Publish. Sites served from `master` (local development) are never cached. Hard refresh (Ctrl+F5) to skip the browser copy |
| **View as Markdown** opens a `blob:` URL | The button found no server Markdown URL for the page (the site is not in `Sites`, or an older module version), so it converted the page in the browser | Add the site to `Sites`; the button then uses the `.md` URL |
| The AI assistant says it cannot open the page | The `.md` URL is not reachable from the internet (local or intranet host) | Use **Copy page as Markdown** and paste it into the assistant |
| `/llms.txt` lists nothing | No published page inherits `_LlmsPage` with **LlmsInclude** checked, under this site's start item | Add the base template, check the box, publish |

## Settings reference

Defaults live in `App_Config/Modules/MarkdownForAI/Sitecore.MarkdownForAI.config`. Change them in [your settings file](#your-settings) with `set:value`.

| Setting (`MarkdownForAI.`) | Default | Description |
|---|---|---|
| `Enabled` | `true` | Master switch |
| `WebForms.Enabled` | `true` | Convert pages with WebForms (`.aspx`) layouts. `false` = `/page.md` returns 404 for them |
| `Sites` | `website` | Sites that answer Markdown requests, pipe separated. `*` = all non-system sites |
| `Extension` | `.md` | `/page.md` serves `/page` as Markdown |
| `QueryStringKey`, `QueryStringValue` | `format`, `md` | `?format=md` also works. Empty key turns it off |
| `AcceptHeader` | `false` | Serve Markdown for `Accept: text/markdown` on the normal URL. Your CDN must then vary on `Accept` |
| `ExcludedPathPrefixes` | `/sitecore/\|/-/\|/api/\|...` | Paths never treated as Markdown requests |
| `ExcludedPlaceholders` | `header\|footer\|navigation\|nav\|breadcrumb` | Placeholders left out at any depth |
| `ParameterName` | `md` | Rendering parameter that includes or excludes a component |
| `ExcludedRenderings`, `IncludedRenderings` | empty | Rendering item IDs, pipe separated |
| `DefaultMode` | `include` | `exclude` for opt-in |
| `Placeholders` | empty | Top-level placeholders to render, in order. Empty = all on the page |
| `SkipTags` | `script\|style\|form\|nav\|...` | HTML elements always removed |
| `IgnoreClasses` | empty | CSS classes whose elements are removed |
| `IncludeImages` | `true` | Keep images as Markdown images |
| `TitleFields`, `DescriptionFields` | `LlmsTitle\|Title\|...` | Fields for the front matter title and description, first non-empty wins |
| `FrontMatterFields` | `title\|description\|url\|language\|last_updated` | Front matter lines to write. Remove any you do not want (for example `title`), or `none` for no front matter. A title of `*` (a wildcard item) is always left out |
| `CacheMinutes` | `30` | Minutes to keep generated Markdown in memory. 0 = off |
| `CacheSizeMB` | `100` | Memory limit of the cache |
| `CacheVaryByQueryString` | `false` | One cache entry per query string |
| `NoCacheDatabases` | `master` | Databases whose content is never cached, in memory or by browsers and CDNs |
| `HttpCacheMinutes` | `10` | `max-age` for CDNs and agents. 0 = always revalidate |
| `NoIndexHeader` | `true` | Send `X-Robots-Tag: noindex` |
| `LinkHeader` | `true` | HTML pages send a `Link` header pointing to their Markdown version |
| `Scheme` | empty | Force `https` in generated URLs (e.g. behind an SSL offloader) |
| `LlmsTxt.Enabled`, `LlmsTxt.FullEnabled` | `true` | Turn `/llms.txt` and `/llms-full.txt` on or off |
| `LlmsTxt.Source` | `tree` | `tree` or `index` |
| `LlmsTxt.IndexName` | empty | Index for `index`. Empty = `sitecore_{database}_index` |
| `LlmsTxt.MaxItems` | `5000` | Most pages listed |
| `LlmsTxt.FullMaxChars` | `5000000` | Size cap of `llms-full.txt` |
| `LlmsTxt.CacheMinutes` | `60` | Minutes to keep `llms.txt` in memory |
| `AskAi.ScriptUrl` | `/scripts/markdownforai/ask-ai.js` | Where the Ask AI script is served from. Empty = load it yourself |

## How it works

```
preprocessRequest    DetectMarkdownRequest     /page.md -> rewrite to /page and flag the request
                                               /llms.txt -> flag (before FilterUrlExtensions)
httpRequestBegin     ValidateMarkdownRequest   site allowed? normal page mode? answer llms.txt here
                     ...ItemResolver and your custom resolvers run as usual...
                     ServeCachedMarkdown       cached? write it now (no layout, MVC or conversion)
mvc.getPageRendering UseMarkdownPageRenderer   swap the layout renderer for MarkdownPageRenderer
MarkdownPageRenderer                           1. a source (field mapping) returns Markdown, or
                                               2. render the top-level placeholders, convert the HTML
mvc.renderRendering  ApplyMarkdownMode         skip excluded renderings before they execute,
                                               keep the rest out of the HTML rendering cache
initialize           MarkdownViewEngine        prefer Foo.md.cshtml on Markdown requests
```

WebForms pages take this route after `LayoutResolver`:

```
httpRequestBegin     CheckMarkdownLayout       .aspx layout: a source (field mapping) answers here, or continue
insertRenderings     FilterMarkdownRenderings  drop excluded renderings and sublayouts, bypass their HTML cache
renderLayout         PrepareMarkdownPage       mark the top-level sc:placeholder controls, attach a response filter
(response filter)    MarkdownResponseFilter    convert the marked HTML, cache it, write Markdown
```

Layouts that are neither MVC (`.cshtml`) nor WebForms (`.aspx`) answer `/page.md` with 404 instead of serving HTML under a Markdown URL.

Because the `.md` suffix is removed before item resolution, wildcard items, custom item resolvers and language prefixes work exactly as they do for the HTML page.

## Limitations

- **Server-rendered sites only.** MVC and WebForms are supported. Headless sites (JSS, XM Cloud) should use Layout Service.
- **WebForms `*.md` views:** the hand-written `Foo.md.cshtml` override is MVC only. On WebForms, use `data-md-ignore` and the component rules.
- **Personalization:** the Markdown follows the same rules as the HTML for the visitor making the request. Only anonymous output is cached.
- **`llms-full.txt`** includes full text only for pages with a field mapping or a custom source.
- **The Ask AI links** hand the assistant the page's `.md` URL, so the assistant must be able to reach it. On an intranet or a local host, use **Copy page as Markdown** instead, or set `no-link` on the web component.

## Building from source

```powershell
./build.ps1             # build, run the .NET and JavaScript tests, write dist/
./build.ps1 -SkipTests
```

Requirements: .NET SDK 6 or later (builds the `net48` target with reference packages), Node 18 or later for the JavaScript tests, and access to `https://nuget.sitecore.com/resources/v3/index.json`.

| Folder | Contents |
|---|---|
| `src/` | The module |
| `tests/` | xUnit tests for the Sitecore-free core |
| `config/` | App_Config files |
| `serialization/` | Sitecore CLI module and items (also the source of the Sitecore package) |
| `tools/` | `New-SitecorePackage.ps1`: builds the Sitecore package from the serialized items, no Sitecore instance needed |
| `views/`, `layouts/` | The Ask AI rendering view (MVC) and sublayout (WebForms) |
| `js/ask-ai/` | The Ask AI web component and its tests |
| `docs/` | Component controls, llms.txt guide, content style guide |
| `examples/` | Example article, Markdown view, layout snippet, browser demo |

## Content licensing

Serving pages as Markdown, listing them in `llms.txt` and sending them to AI tools is a new form of distribution. If parts of your content are licensed from a third party (syndicated articles, stock text), check that the licence allows it. Exclude those pages with `md=exclude`, a placeholder rule, or by leaving **LlmsInclude** unchecked.

## License

[MIT](LICENSE)
