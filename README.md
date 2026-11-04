# Sitecore.MarkdownForAI

An **Ask AI** button for Sitecore pages. Visitors pick ChatGPT, Claude or Perplexity, and the assistant reads a clean Markdown copy of the page.

```
[ Ask AI about this page ▾ ]
    Open in ChatGPT
    Open in Claude
    Open in Perplexity
    Copy page as Markdown
    View as Markdown
```

Every page also gets a Markdown version, without the header, menus or footer:

```
https://www.example.com/articles/dental-care      the page
https://www.example.com/articles/dental-care.md   the same page as Markdown
```

Sitecore 10.1 to 10.5, MVC.

## Get started

1. Install `Sitecore.MarkdownForAI-<version>.zip` with the Installation Wizard.
2. Rename `App_Config/Include/MarkdownForAI/z.MarkdownForAI.Site.config.example` to `.config` and set your site name.
3. Publish the `Markdown For AI` items.
4. Add the **Ask AI** rendering to your page.

Editors change the button text and the list of assistants under `/sitecore/system/Modules/Markdown For AI/Ask AI`. No deploy needed.

## More

- [Configuration](docs/configuration.md): install options, settings, caching, troubleshooting
- [Extending](docs/extending.md): more features you can add back
- [Ask AI web component](js/ask-ai/README.md)
- [Blog post: An Ask AI Button for Sitecore MVC Pages](https://www.nehemiahj.com/2026/11/sitecoremarkdownforai-ask-ai-button-for.html)

## License

[MIT](LICENSE)
