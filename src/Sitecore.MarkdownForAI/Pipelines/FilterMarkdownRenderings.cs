using System;
using Sitecore.Diagnostics;
using Sitecore.MarkdownForAI.Core;
using Sitecore.Mvc.Pipelines.Response.RenderRendering;
using Sitecore.Mvc.Presentation;

namespace Sitecore.MarkdownForAI.Pipelines
{
    /// <summary>
    /// mvc.renderRendering, first processor. On Markdown requests it drops renderings in placeholders
    /// listed in <c>MarkdownForAI.ExcludedPlaceholders</c> (at any depth, dynamic placeholder suffixes
    /// included) before their controller or view runs, and keeps the remaining renderings out of
    /// Sitecore's HTML (rendering) cache.
    /// </summary>
    /// <remarks>
    /// Markdown output must never share a rendering cache entry with the HTML page: a cached container
    /// would carry child renderings that the Markdown version excludes. Turning caching off on the
    /// rendering itself, at the start of the pipeline, means SetCacheability and any GenerateCacheKey
    /// (stock or a solution's own) see a non-cacheable rendering. The finished page is cached instead
    /// (see MarkdownCache and ServeCachedMarkdown).
    /// </remarks>
    public class FilterMarkdownRenderings : RenderRenderingProcessor
    {
        public override void Process(RenderRenderingArgs args)
        {
            if (!MarkdownRequest.IsActive || args.Rendering == null ||
                string.Equals(args.Rendering.RenderingType, "Layout", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            try
            {
                if (PlaceholderMatcher.MatchesAny(args.Rendering.Placeholder, MarkdownSettings.ExcludedPlaceholders))
                {
                    args.AbortPipeline();
                    return;
                }

                RenderingCachingDefinition caching = args.Rendering.Caching;
                if (caching != null && caching.Cacheable)
                {
                    caching.Cacheable = false;
                    args.Rendering.Caching = caching;
                }

                args.Cacheable = false;
            }
            catch (Exception ex)
            {
                Log.Error("MarkdownForAI: failed to filter rendering " + args.Rendering.RenderingItemPath, ex, this);
            }
        }
    }
}
