using System;
using System.Web;

namespace Sitecore.MarkdownForAI
{
    /// <summary>Per-request state, kept in <see cref="HttpContext.Items"/>.</summary>
    public static class MarkdownRequest
    {
        private const string ActiveKey = "MarkdownForAI.Active";
        private const string OriginalUrlKey = "MarkdownForAI.OriginalUrl";

        /// <summary>True while a page is being rendered as Markdown (<c>/page.md</c>).</summary>
        public static bool IsActive
        {
            get
            {
                HttpContext context = HttpContext.Current;
                return context != null && context.Items[ActiveKey] is bool && (bool)context.Items[ActiveKey];
            }
        }

        /// <summary>The URL the client asked for, before the module rewrote it.</summary>
        public static Uri OriginalUrl
        {
            get
            {
                HttpContext context = HttpContext.Current;
                return context == null ? null : (context.Items[OriginalUrlKey] as Uri ?? context.Request.Url);
            }
        }

        public static void Begin(HttpContext context)
        {
            context.Items[ActiveKey] = true;
            context.Items[OriginalUrlKey] = context.Request.Url;
        }

        public static void Cancel()
        {
            HttpContext context = HttpContext.Current;
            if (context != null)
            {
                context.Items[ActiveKey] = false;
            }
        }
    }
}
