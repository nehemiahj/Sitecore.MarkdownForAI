# Configuration

Everything beyond the [quick start](../README.md#get-started): install options, settings, the Ask AI items,
caching and troubleshooting.

## Install

Each release has three files:

| File | Use it when |
|---|---|
| `Sitecore.MarkdownForAI-<version>.zip` | **Sitecore package.** You install modules on the CM with the Installation Wizard. Contains the files and the items. |
| `Sitecore.MarkdownForAI-<version>-files.zip` | You deploy from source control and CI. The files laid out like the web root, plus the Sitecore CLI serialization. |
| `Sitecore.MarkdownForAI.<version>.nupkg` | You build in CI. The assembly plus the module's config, view and script, published with your web project. |

### Option A: Sitecore package

1. On the CM, install `Sitecore.MarkdownForAI-<version>.zip` with the Installation Wizard.
2. Rename the `.example` settings file and set your sites (see [Your settings](#your-settings)).
3. Publish the items listed under [Items](#items).
4. Copy the same files to every CD server: the package installs files on the CM only.

### Option B: NuGet and Sitecore CLI

1. **Package:** add the `Sitecore.MarkdownForAI` NuGet package to the web project you publish. It publishes these files with your project:

   | Path in the web root | Notes |
   |---|---|
   | `App_Config/Modules/MarkdownForAI/Sitecore.MarkdownForAI.config` | The module config. Do not edit it; upgrades replace it. |
   | `Views/MarkdownForAI/AskAi.cshtml` | The Ask AI rendering |
   | `scripts/markdownforai/ask-ai.js` | The Ask AI web component |

   Set the MSBuild property `MarkdownForAIPublishFiles` to `false` to deploy them yourself.
2. **Your settings:** the first build copies `z.MarkdownForAI.Site.config.example` into `App_Config/Include/MarkdownForAI/` in your project. Rename it, set your sites and placeholders, and add it to the project as content. (`MarkdownForAICopySiteConfig` set to `false` skips the copy.)
3. **Items:** install the Sitecore package on the CM, or copy `serialization/` into your repository and add it to `sitecore.json`:

   ```json
   "modules": [ "src/*/*/*.module.json", "MarkdownForAI/serialization/*.module.json" ]
   ```

   then `dotnet sitecore ser push`.
4. Publish the items.

### Items

| Item | Purpose |
|---|---|
| `/sitecore/templates/Modules/Markdown For AI/Ask AI Settings`, `AI Assistant` | Templates for the button and its assistants |
| `/sitecore/system/Modules/Markdown For AI/Ask AI` | Button settings, with ChatGPT, Claude and Perplexity below it |
| `/sitecore/layout/Renderings/Modules/Markdown For AI/Ask AI` | The Ask AI rendering |
| `/sitecore/layout/Placeholder Settings/Modules/Markdown For AI/ask-ai` | Lets editors add the button to an `ask-ai` placeholder |

Everything sits under **Modules** folders, outside the `Foundation`, `Feature` and `Project` folders that Helix solutions serialize. `/sitecore/templates/Modules` and `/sitecore/layout/Placeholder Settings/Modules` are created if missing and never overwritten. The **Ask AI** items are create-only: upgrades add missing defaults without overwriting what editors changed.

### Your settings

Keep every change in `App_Config/Include/MarkdownForAI/z.MarkdownForAI.Site.config`, never in the module config:

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

Any setting from the [Settings reference](#settings-reference) works the same way. Check the result in `/sitecore/admin/showconfig.aspx`.

## The Ask AI button

One button, **Ask AI about this page**, opens a dropdown with one entry per AI assistant, then **Copy page as Markdown** and **View as Markdown**. Each assistant opens with a prompt that points at the page's `.md` URL, so it reads the clean version.

### Adding the button

| Who | How | Result |
|---|---|---|
| Developer, once (recommended) | Add **Ask AI** to the article template's `__Standard Values` presentation, in a placeholder near the title | Every article has the button |
| Editor, per page | Experience Editor: **Add here** in an `ask-ai` placeholder, pick **Ask AI** | The button on that page only |
| Developer, in code | `@Html.AskAi()` in a view or the layout (`@using Sitecore.MarkdownForAI.Html`) | No rendering; same Sitecore settings |

For editors to add it in Experience Editor, put an `ask-ai` placeholder near the article title. The module's placeholder settings already allow **Ask AI** there:

```cshtml
@Html.Sitecore().Placeholder("ask-ai")
```

### Changing the text and the assistants

Editors change everything under `/sitecore/system/Modules/Markdown For AI/Ask AI` and publish:

| Item | Fields |
|---|---|
| **Ask AI** (template `Ask AI Settings`) | Button Label, Prompt (`{url}`, `{page}`, `{title}`), Show Copy Markdown, Show View Markdown, Max Link Length |
| **ChatGPT**, **Claude**, **Perplexity** (template `AI Assistant`) | Assistant Name, Link Pattern (e.g. `https://chatgpt.com/?q={prompt}`), Menu Label, Hint, Prompt, Icon, Enabled |

- **Add an assistant:** insert an `AI Assistant` item under **Ask AI** and fill in its link pattern. No code, no deploy.
- **Order:** the dropdown follows the content tree order.
- **Per site:** create another `Ask AI Settings` item (with its own assistants) and pick it as the rendering's data source.
- **Link patterns:** `{prompt}` is replaced with the URL-encoded prompt. Without `{prompt}`, the page is copied to the clipboard and the link opens, so the reader pastes it. Only `https` links are accepted.
- **Sites not in `MarkdownForAI.Sites`:** the button still works; the assistants get the normal page URL, and copy/view use the page's plain text.

The prefill links (`?q=`) are how these assistants accept a starting prompt in their web apps. They are not documented public APIs and can change, which is why they are data you can edit. The web component also works outside Sitecore: [js/ask-ai/README.md](../js/ask-ai/README.md).

## The Markdown version

`/page.md` renders only the page's placeholders, never the layout file itself, so anything the layout writes directly (a header partial, scripts, a footer bound in code) is gone automatically. Then:

- **Excluded placeholders:** renderings in `MarkdownForAI.ExcludedPlaceholders` are skipped at any depth, before their controller or view runs. Dynamic placeholder suffixes such as `footer-{GUID}-0` match.
- **`data-md-ignore`** on any element inside a rendering removes it: `<div class="share-buttons" data-md-ignore>`.
- **Only MVC layouts** are converted. Other layouts (such as WebForms `.aspx`) answer `/page.md` with 404 instead of serving HTML under a Markdown URL.

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

Because the `.md` suffix is removed before item resolution, wildcard items, custom item resolvers and language prefixes resolve the same item as for the HTML page. One difference: `Request.RawUrl` still holds the original `/page.md` URL, so a custom resolver that parses `RawUrl` should read `Request.Path` instead.

## Caching

The finished Markdown is cached per site, database, language, item, version, device, host and URL path, in memory on each server:

- Cache hits are answered in `httpRequestBegin`, before Sitecore resolves the layout. Concurrent requests for an uncached page build it once.
- Only `200` responses are cached; not-found and error pages are never stored or replayed.
- Logged-in visitors are never cached, and neither is content from `master` (local development and preview).
- Query strings are ignored by default, so `?utm_source=` links share one entry. The cache is capped by `CacheSizeMB`.
- Cleared on `publish:end` and `publish:end:remote`.

Markdown requests never read or write Sitecore's rendering (HTML) cache. The module switches caching off on each rendering in the first `mvc.renderRendering` processor, so it works alongside solutions that replace `SetCacheability` or `GenerateCacheKey`.

## Troubleshooting

| What you see | Why | What to do |
|---|---|---|
| `/page.md` returns 404 | The site is not in `MarkdownForAI.Sites`, the request reached a CM server, or the layout is not MVC | Add the site name; test on a CD or Standalone instance. If IIS or a CDN blocks `.md`, allow it |
| The header, menu or footer is in the Markdown | Their placeholders are not excluded | Add the placeholder keys to `ExcludedPlaceholders` |
| Edits do not show in the `.md`, but the HTML page has them | The Markdown is cached until the next publish | Publish. Sites served from `master` are never cached |
| The AI assistant says it cannot open the page | The `.md` URL is not reachable from the internet (local or intranet host) | Use **Copy page as Markdown** and paste it into the assistant |
| The button does not appear | No enabled assistant and both copy and view are off, or `ask-ai.js` is not served | Check the Ask AI items and `/scripts/markdownforai/ask-ai.js` |

## Settings reference

Defaults live in `App_Config/Modules/MarkdownForAI/Sitecore.MarkdownForAI.config`. Change them in [your settings file](#your-settings) with `set:value`.

| Setting (`MarkdownForAI.`) | Default | Description |
|---|---|---|
| `Enabled` | `true` | Master switch for `/page.md` |
| `Sites` | `website` | Sites that answer `/page.md`, pipe separated. `*` = all non-system sites |
| `Extension` | `.md` | `/page.md` serves `/page` as Markdown |
| `ExcludedPathPrefixes` | `/sitecore/\|/-/\|/api/\|...` | Paths never treated as Markdown requests |
| `ExcludedPlaceholders` | `header\|footer\|navigation\|nav\|breadcrumb` | Placeholders left out at any depth |
| `Placeholders` | empty | Top-level placeholders to render, in order. Empty = all on the page |
| `SkipTags` | `script\|style\|form\|nav\|...` | HTML elements always removed |
| `IgnoreClasses` | empty | CSS classes whose elements are removed |
| `IncludeImages` | `true` | Keep images as Markdown images |
| `TitleFields`, `DescriptionFields` | `Title\|Page Title\|Heading`, `Meta Description\|...` | Fields for the front matter title and description, first non-empty wins |
| `FrontMatterFields` | `title\|description\|url\|language\|last_updated` | Front matter lines to write, or `none`. A title of `*` (a wildcard item) is always left out |
| `CacheMinutes` | `30` | Minutes to keep generated Markdown in memory. 0 = off |
| `CacheSizeMB` | `100` | Memory limit of the cache |
| `CacheVaryByQueryString` | `false` | One cache entry per query string |
| `NoCacheDatabases` | `master` | Databases whose content is never cached |
| `NoIndexHeader` | `true` | Send `X-Robots-Tag: noindex` |
| `Scheme` | empty | Force `https` in generated URLs (e.g. behind an SSL offloader) |
| `AskAi.ScriptUrl` | `/scripts/markdownforai/ask-ai.js` | Where the Ask AI script is served from. Empty = load it yourself |

## How it works

```
preprocessRequest    DetectMarkdownRequest     /page.md -> rewrite to /page and flag the request
httpRequestBegin     ValidateMarkdownRequest   site allowed? normal page mode? otherwise 404
                     ...ItemResolver and your custom resolvers run as usual...
                     ServeCachedMarkdown       cached? write it now (no layout, MVC or conversion)
                     CheckMarkdownLayout       not an MVC layout? 404
mvc.getPageRendering UseMarkdownPageRenderer   swap the layout renderer for MarkdownPageRenderer
MarkdownPageRenderer                           render the top-level placeholders, convert the HTML, cache it
mvc.renderRendering  FilterMarkdownRenderings  skip renderings in excluded placeholders,
                                               keep the rest out of the HTML rendering cache
```

## Building from source

```powershell
./build.ps1             # build, run the .NET and JavaScript tests, write dist/
./build.ps1 -SkipTests
```

Requirements: .NET SDK 6 or later, Node 18 or later for the JavaScript tests, and access to `https://nuget.sitecore.com/resources/v3/index.json`.

| Folder | Contents |
|---|---|
| `src/` | The module |
| `tests/` | xUnit tests for the Sitecore-free core (converter, paths, placeholders) |
| `config/` | App_Config files |
| `serialization/` | Sitecore CLI module and items (also the source of the Sitecore package) |
| `tools/` | `New-SitecorePackage.ps1`: builds the Sitecore package from the serialized items |
| `views/` | The Ask AI rendering view |
| `js/ask-ai/` | The Ask AI web component and its tests |
| `docs/` | [extending.md](extending.md): features of the earlier version and how to add them back |
| `examples/` | Layout snippet |

## Content licensing

Serving pages as Markdown and sending them to AI tools is a new form of distribution. If parts of your content are licensed from a third party, check that the licence allows it, and keep those pages off the sites in `MarkdownForAI.Sites` or their content in an excluded placeholder.
