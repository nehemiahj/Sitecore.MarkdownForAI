using System;
using Sitecore.MarkdownForAI.Web;
using Sitecore.Pipelines.HttpRequest;

namespace Sitecore.MarkdownForAI.Pipelines
{
    /// <summary>
    /// httpRequestBegin, after LayoutResolver. Only MVC (<c>.cshtml</c>) layouts are converted; any
    /// other layout (such as WebForms <c>.aspx</c>) answers <c>/page.md</c> with 404 instead of serving
    /// HTML under a Markdown URL. Pages without a layout are left to Sitecore.
    /// </summary>
    public class CheckMarkdownLayout : HttpRequestProcessor
    {
        public override void Process(HttpRequestArgs args)
        {
            if (!MarkdownRequest.IsActive || Context.Page == null)
            {
                return;
            }

            string layoutPath = Context.Page.FilePath;
            if (!string.IsNullOrEmpty(layoutPath) && !layoutPath.EndsWith(".cshtml", StringComparison.OrdinalIgnoreCase))
            {
                ResponseWriter.NotFound(args);
            }
        }
    }
}
