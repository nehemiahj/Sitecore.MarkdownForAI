using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Mvc;
using Sitecore.Data;
using Sitecore.Data.Fields;
using Sitecore.Data.Items;
using Sitecore.Data.Managers;
using Sitecore.Data.Templates;
using Sitecore.Diagnostics;
using Sitecore.MarkdownForAI.Core;
using Sitecore.MarkdownForAI.Web;
using Sitecore.Resources.Media;

namespace Sitecore.MarkdownForAI.Html
{
    /// <summary>
    /// Writes the <c>&lt;ask-ai&gt;</c> web component from Sitecore items: an <c>Ask AI Settings</c>
    /// item (button label, prompt, menu actions) and its <c>AI Assistant</c> children (one menu entry
    /// each, in content tree order). Editors add an assistant by adding an item; no deploy needed.
    /// </summary>
    public static class AskAiHtml
    {
        private const string ScriptWrittenKey = "MarkdownForAI.AskAiScriptWritten";

        /// <summary>
        /// <c>@Html.AskAi()</c>: the button with the default settings item
        /// (<c>/sitecore/system/Modules/Markdown For AI/Ask AI</c>) or the given one.
        /// </summary>
        /// <param name="html">The view's HTML helper.</param>
        /// <param name="settings">An item based on <c>Ask AI Settings</c>; null for the default.</param>
        /// <param name="target">CSS selector of the article container, used when the page has no Markdown URL.</param>
        public static IHtmlString AskAi(this HtmlHelper html, Item settings = null, string target = null)
        {
            return new MvcHtmlString(Render(settings, target));
        }

        /// <summary>The same markup as a string, for other callers.</summary>
        public static string Render(Item settings, string target)
        {
            try
            {
                return Build(settings ?? DefaultSettings(), target);
            }
            catch (Exception ex)
            {
                Log.Error("MarkdownForAI: failed to render the Ask AI button", ex, typeof(AskAiHtml));
                return string.Empty;
            }
        }

        private static Item DefaultSettings()
        {
            Database database = Context.Database;
            return database == null ? null : database.GetItem(ItemIds.AskAiSettings);
        }

        private static string Build(Item settings, string target)
        {
            if (settings == null)
            {
                return string.Empty;
            }

            List<Item> assistants = settings.Children
                .Where(child => Inherits(child, ItemIds.AiAssistantTemplate) && IsChecked(child, AiAssistantFields.Enabled))
                .ToList();

            var actions = new List<string>();
            if (IsChecked(settings, AskAiSettingsFields.ShowCopyMarkdown))
            {
                actions.Add("copy");
            }

            if (IsChecked(settings, AskAiSettingsFields.ShowViewMarkdown))
            {
                actions.Add("view");
            }

            if (assistants.Count == 0 && actions.Count == 0)
            {
                return string.Empty;
            }

            var sb = new StringBuilder();
            AppendScript(sb);

            sb.Append("<ask-ai data-md-ignore");
            Attribute(sb, "label", settings[AskAiSettingsFields.ButtonLabel]);
            Attribute(sb, "prompt", settings[AskAiSettingsFields.Prompt]);
            Attribute(sb, "actions", string.Join(" ", actions), allowEmpty: true);
            Attribute(sb, "max-url-length", settings[AskAiSettingsFields.MaxLinkLength]);
            // The page's .md URL, which the assistants are asked to read. Without it (a site not in
            // MarkdownForAI.Sites) the links use the HTML page URL and copy/view use the page text.
            Attribute(sb, "md-src", CurrentPageMarkdownUrl());
            Attribute(sb, "target", target);

            // With no assistant items, an empty providers attribute keeps the built-in ones out.
            if (assistants.Count == 0)
            {
                Attribute(sb, "providers", string.Empty, allowEmpty: true);
            }

            sb.Append('>');
            foreach (Item assistant in assistants)
            {
                sb.Append("<ask-ai-provider");
                Attribute(sb, "name", assistant[AiAssistantFields.Name]);
                Attribute(sb, "url", assistant[AiAssistantFields.LinkPattern]);
                Attribute(sb, "label", assistant[AiAssistantFields.MenuLabel]);
                Attribute(sb, "hint", assistant[AiAssistantFields.Hint]);
                Attribute(sb, "prompt", assistant[AiAssistantFields.Prompt]);
                Attribute(sb, "icon", IconUrl(assistant));
                sb.Append("></ask-ai-provider>");
            }

            sb.Append("</ask-ai>");
            return sb.ToString();
        }

        /// <summary>
        /// Absolute Markdown URL of the current page, or null when <c>/page.md</c> would not answer: the module
        /// is off for this site, or the page does not use an MVC layout.
        /// </summary>
        private static string CurrentPageMarkdownUrl()
        {
            if (!MarkdownSettings.Enabled || Context.Site == null || !Context.PageMode.IsNormal ||
                !MarkdownSettings.IsSiteAllowed(Context.Site.Name))
            {
                return null;
            }

            string layoutPath = Context.Page == null ? null : Context.Page.FilePath;
            if (string.IsNullOrEmpty(layoutPath) || !layoutPath.EndsWith(".cshtml", StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            Uri page = RequestUrls.CurrentPageUrl();
            return page == null ? null : MarkdownPath.ToMarkdownUrl(page.GetLeftPart(UriPartial.Path), MarkdownSettings.Extension);
        }

        /// <summary>The module script, once per page, however many buttons the page has.</summary>
        private static void AppendScript(StringBuilder sb)
        {
            HttpContext context = HttpContext.Current;
            if (context != null)
            {
                if (context.Items[ScriptWrittenKey] != null)
                {
                    return;
                }

                context.Items[ScriptWrittenKey] = true;
            }

            string url = MarkdownSettings.AskAiScriptUrl;
            if (!string.IsNullOrWhiteSpace(url))
            {
                sb.Append("<script type=\"module\" src=\"").Append(HttpUtility.HtmlAttributeEncode(url)).Append("\"></script>");
            }
        }

        private static string IconUrl(Item assistant)
        {
            ImageField icon = assistant.Fields[AiAssistantFields.Icon];
            if (icon == null || icon.MediaItem == null)
            {
                return null;
            }

            return MediaManager.GetMediaUrl(icon.MediaItem);
        }

        private static void Attribute(StringBuilder sb, string name, string value, bool allowEmpty = false)
        {
            if (value == null || (!allowEmpty && value.Trim().Length == 0))
            {
                return;
            }

            sb.Append(' ').Append(name).Append("=\"").Append(HttpUtility.HtmlAttributeEncode(value.Trim())).Append('"');
        }

        private static bool IsChecked(Item item, string field)
        {
            return MainUtil.GetBool(item[field], false);
        }

        private static bool Inherits(Item item, ID templateId)
        {
            if (item.TemplateID == templateId)
            {
                return true;
            }

            Template template = TemplateManager.GetTemplate(item);
            return template != null && template.InheritsFrom(templateId);
        }
    }
}
