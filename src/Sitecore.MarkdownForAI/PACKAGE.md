# Sitecore.MarkdownForAI

Serves Markdown versions of Sitecore MVC and WebForms pages for AI agents: `/page.md`, `?format=md`, `/llms.txt`, `/llms-full.txt` and an Ask AI button. Sitecore 10.1 to 10.5.

Reference this package from the web project you publish. It has no dependencies; your solution already references Sitecore and ASP.NET MVC.

## What the package does

- **Assembly:** `Sitecore.MarkdownForAI.dll`, referenced like any other.
- **Files:** publishes the module's files with your project, at the same paths in the web root: `App_Config/Modules/MarkdownForAI/Sitecore.MarkdownForAI.config`, `Views/MarkdownForAI/AskAi.cshtml`, `layouts/MarkdownForAI/AskAi.ascx` and `scripts/markdownforai/*.js`. They come from the package, not your source tree, so upgrading is a version bump. Set the MSBuild property `MarkdownForAIPublishFiles` to `false` to deploy them yourself.
- **Your settings file:** the first build copies `z.MarkdownForAI.Site.config.example` into `App_Config/Include/MarkdownForAI/` in your project (only if that folder does not exist). Set `MarkdownForAICopySiteConfig` to `false` to skip this.

## What you do

1. Rename `App_Config/Include/MarkdownForAI/z.MarkdownForAI.Site.config.example` to `z.MarkdownForAI.Site.config`, set your sites and excluded placeholders, and add it to the project as content.
2. Add the items: copy `serialization/` from the GitHub repository or the release's files zip into your repository, include it in `sitecore.json`, then `dotnet sitecore ser push` and publish. Or install the Sitecore package on the CM once.

Full documentation: https://github.com/nehemiahj/Sitecore.MarkdownForAI
