using Sitecore.MarkdownForAI.Caching;
using Sitecore.MarkdownForAI.Web;
using Sitecore.Pipelines.HttpRequest;

namespace Sitecore.MarkdownForAI.Pipelines
{
    /// <summary>
    /// httpRequestBegin, before LayoutResolver (after every item resolver). When the Markdown of the
    /// context item is already cached, writes it straight away: no layout, MVC, rendering or
    /// conversion runs. On a miss the request continues and <c>MarkdownPageRenderer</c> builds and
    /// caches the page.
    /// </summary>
    public class ServeCachedMarkdown : HttpRequestProcessor
    {
        public override void Process(HttpRequestArgs args)
        {
            if (!MarkdownRequest.IsActive || Context.Item == null)
            {
                return;
            }

            string markdown = MarkdownCache.Get(MarkdownCacheKeys.Page(Context.Item));
            if (markdown != null)
            {
                ResponseWriter.Markdown(args, markdown, RequestUrls.CurrentPageUrl());
            }
        }
    }
}
