using Sitecore.MarkdownForAI.Web;
using Sitecore.Pipelines.HttpRequest;
using Sitecore.Sites;

namespace Sitecore.MarkdownForAI.Pipelines
{
    /// <summary>
    /// httpRequestBegin, before ItemResolver. Once the site and database are known, answers 404 for
    /// <c>/page.md</c> on sites that are not in <c>MarkdownForAI.Sites</c> or outside normal page mode,
    /// rather than serving the HTML page under a Markdown URL.
    /// </summary>
    public class ValidateMarkdownRequest : HttpRequestProcessor
    {
        public override void Process(HttpRequestArgs args)
        {
            if (!MarkdownRequest.IsActive)
            {
                return;
            }

            SiteContext site = Context.Site;
            bool allowed = site != null && Context.Database != null &&
                           MarkdownSettings.IsSiteAllowed(site.Name) && Context.PageMode.IsNormal;
            if (!allowed)
            {
                ResponseWriter.NotFound(args);
            }
        }
    }
}
