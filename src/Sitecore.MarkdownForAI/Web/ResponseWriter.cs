using System;
using System.Web;
using Sitecore.Pipelines.HttpRequest;

namespace Sitecore.MarkdownForAI.Web
{
    /// <summary>Writes complete responses from inside httpRequestBegin and sets Markdown headers.</summary>
    public static class ResponseWriter
    {
        public const string MarkdownContentType = "text/markdown";

        /// <summary>Writes cached Markdown and ends the request. A status set earlier (such as 404) is kept.</summary>
        public static void Markdown(HttpRequestArgs args, string body, Uri canonical)
        {
            HttpResponse response = HttpContext.Current.Response;
            response.Clear();
            response.TrySkipIisCustomErrors = true;
            ApplyMarkdownHeaders(response, canonical);
            response.Write(body ?? string.Empty);
            End(args);
        }

        public static void NotFound(HttpRequestArgs args)
        {
            HttpResponse response = HttpContext.Current.Response;
            response.Clear();
            response.StatusCode = 404;
            response.TrySkipIisCustomErrors = true;
            response.ContentType = "text/plain";
            response.Charset = "utf-8";
            response.Write("Not found");
            End(args);
        }

        /// <summary>Headers for a Markdown page: type, canonical link to the HTML page, and noindex.</summary>
        public static void ApplyMarkdownHeaders(HttpResponse response, Uri canonical)
        {
            response.ContentType = MarkdownContentType;
            response.Charset = "utf-8";

            if (canonical != null)
            {
                response.AppendHeader("Link", "<" + canonical.AbsoluteUri + ">; rel=\"canonical\"");
            }

            if (MarkdownSettings.NoIndexHeader)
            {
                response.AppendHeader("X-Robots-Tag", "noindex");
            }
        }

        private static void End(HttpRequestArgs args)
        {
            HttpContext.Current.ApplicationInstance.CompleteRequest();
            args.AbortPipeline();
        }
    }
}
