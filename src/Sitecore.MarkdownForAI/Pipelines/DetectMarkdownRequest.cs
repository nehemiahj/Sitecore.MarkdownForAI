using System;
using System.IO;
using System.Linq;
using System.Web;
using Sitecore.Diagnostics;
using Sitecore.MarkdownForAI.Core;
using Sitecore.Pipelines.PreprocessRequest;

namespace Sitecore.MarkdownForAI.Pipelines
{
    /// <summary>
    /// preprocessRequest, before FilterUrlExtensions. Recognises <c>/page.md</c> and rewrites it to
    /// <c>/page</c>, so Sitecore's normal site, language and item resolution (including custom
    /// resolvers and wildcards) runs unchanged. Real files named <c>*.md</c> are left alone.
    /// </summary>
    public class DetectMarkdownRequest : PreprocessRequestProcessor
    {
        public override void Process(PreprocessRequestArgs args)
        {
            HttpContext context = HttpContext.Current;
            if (context == null || !MarkdownSettings.Enabled)
            {
                return;
            }

            try
            {
                HttpRequest request = context.Request;
                string path = request.FilePath ?? string.Empty;

                if (MarkdownSettings.ExcludedPathPrefixes.Any(prefix => path.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)))
                {
                    return;
                }

                string pagePath;
                if (MarkdownPath.TryGetPagePath(path, MarkdownSettings.Extension, out pagePath) && !File.Exists(request.PhysicalPath))
                {
                    MarkdownRequest.Begin(context);
                    context.RewritePath(pagePath, string.Empty, request.QueryString.ToString());
                }
            }
            catch (Exception ex)
            {
                Log.Error("MarkdownForAI: failed to inspect request " + context.Request.RawUrl, ex, this);
                MarkdownRequest.Cancel();
            }
        }
    }
}
