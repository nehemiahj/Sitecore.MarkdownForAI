using System;
using System.Collections.Generic;
using System.Linq;

namespace Sitecore.MarkdownForAI.Core
{
    /// <summary>Maps page URLs to their Markdown twins and back. No Sitecore dependencies.</summary>
    public static class MarkdownPath
    {
        /// <summary>
        /// Turns <c>/about/team.md</c> into <c>/about/team</c> and <c>/index.md</c> or
        /// <c>/blog/index.md</c> into <c>/</c> or <c>/blog/</c>.
        /// </summary>
        public static bool TryGetPagePath(string path, string extension, out string pagePath)
        {
            pagePath = null;
            if (string.IsNullOrEmpty(path) || string.IsNullOrEmpty(extension) ||
                path.Length <= extension.Length ||
                !path.EndsWith(extension, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            string page = path.Substring(0, path.Length - extension.Length);
            if (page.EndsWith("/index", StringComparison.OrdinalIgnoreCase))
            {
                page = page.Substring(0, page.Length - "index".Length);
            }

            if (page.Length == 0)
            {
                page = "/";
            }

            if (page.EndsWith("/", StringComparison.Ordinal) && page.Length > 1 && page.EndsWith("//", StringComparison.Ordinal))
            {
                return false;
            }

            pagePath = page;
            return true;
        }

        /// <summary>
        /// Appends the Markdown extension to a page URL, keeping any query string:
        /// <c>https://x/about?a=1</c> becomes <c>https://x/about.md?a=1</c>; <c>https://x/</c>
        /// becomes <c>https://x/index.md</c>.
        /// </summary>
        public static string ToMarkdownUrl(string pageUrl, string extension)
        {
            if (string.IsNullOrEmpty(pageUrl))
            {
                return pageUrl;
            }

            string suffix = string.Empty;
            int cut = pageUrl.IndexOfAny(new[] { '?', '#' });
            string path = pageUrl;
            if (cut >= 0)
            {
                suffix = pageUrl.Substring(cut);
                path = pageUrl.Substring(0, cut);
            }

            int schemeEnd = path.IndexOf("://", StringComparison.Ordinal);
            bool hostOnly = schemeEnd > 0 && path.IndexOf('/', schemeEnd + 3) < 0;
            if (hostOnly)
            {
                path += "/";
            }

            return (path.EndsWith("/", StringComparison.Ordinal) ? path + "index" + extension : path + extension) + suffix;
        }
    }
}
