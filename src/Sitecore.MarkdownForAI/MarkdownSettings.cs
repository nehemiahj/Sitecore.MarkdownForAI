using System;
using System.Collections.Generic;
using System.Linq;
using Sitecore.MarkdownForAI.Core;

namespace Sitecore.MarkdownForAI
{
    /// <summary>Typed access to the <c>MarkdownForAI.*</c> settings. Values are read on every call so config changes apply after a recycle without code changes.</summary>
    public static class MarkdownSettings
    {
        private const string Prefix = "MarkdownForAI.";

        public static bool Enabled
        {
            get { return Bool("Enabled", true); }
        }

        /// <summary>Convert pages that use WebForms (.aspx) layouts. When false, /page.md returns 404 for them.</summary>
        public static bool WebFormsEnabled
        {
            get { return Bool("WebForms.Enabled", true); }
        }

        /// <summary>Site names the module answers for. <c>*</c> means every site except Sitecore system sites.</summary>
        public static ICollection<string> Sites
        {
            get { return List("Sites", "website"); }
        }

        public static string Extension
        {
            get { return Text("Extension", ".md"); }
        }

        /// <summary>Query string switch, e.g. <c>?format=md</c>. Empty disables it.</summary>
        public static string QueryStringKey
        {
            get { return Text("QueryStringKey", "format"); }
        }

        public static string QueryStringValue
        {
            get { return Text("QueryStringValue", "md"); }
        }

        /// <summary>Serve Markdown when the request sends <c>Accept: text/markdown</c>. Off by default: shared caches must then vary on Accept.</summary>
        public static bool AcceptHeader
        {
            get { return Bool("AcceptHeader", false); }
        }

        public static ICollection<string> ExcludedPathPrefixes
        {
            get { return List("ExcludedPathPrefixes", "/sitecore/|/-/|/api/|/layouts/|/App_Config/|/_DEV/|/temp/"); }
        }

        public static MarkdownMode DefaultMode
        {
            get { return MarkdownModeParser.Parse(Text("DefaultMode", "include")) ?? MarkdownMode.Include; }
        }

        /// <summary>Top-level placeholders to render. Empty means every placeholder used on the page.</summary>
        public static ICollection<string> Placeholders
        {
            get { return List("Placeholders", string.Empty); }
        }

        public static ICollection<string> ExcludedPlaceholders
        {
            get { return List("ExcludedPlaceholders", "header|footer|navigation|nav|breadcrumb"); }
        }

        public static ICollection<string> IncludedRenderings
        {
            get { return List("IncludedRenderings", string.Empty); }
        }

        public static ICollection<string> ExcludedRenderings
        {
            get { return List("ExcludedRenderings", string.Empty); }
        }

        /// <summary>Rendering parameter (and definition default parameter) that sets the mode.</summary>
        public static string ParameterName
        {
            get { return Text("ParameterName", "md"); }
        }

        public static ICollection<string> SkipTags
        {
            get { return List("SkipTags", string.Join("|", MarkdownConverterOptions.DefaultSkipTags)); }
        }

        public static ICollection<string> IgnoreClasses
        {
            get { return List("IgnoreClasses", string.Empty); }
        }

        public static bool IncludeImages
        {
            get { return Bool("IncludeImages", true); }
        }

        public static IList<string> TitleFields
        {
            get { return OrderedList("TitleFields", "LlmsTitle|Title|Page Title|Heading"); }
        }

        public static IList<string> DescriptionFields
        {
            get { return OrderedList("DescriptionFields", "LlmsSummary|Meta Description|MetaDescription|Description|Summary|Abstract"); }
        }

        /// <summary>Built-in front matter values to write: title, description, url, language, last_updated. Empty = none.</summary>
        public static ICollection<string> FrontMatterFields
        {
            get { return List("FrontMatterFields", "title|description|url|language|last_updated"); }
        }

        /// <summary>Minutes to cache Markdown for anonymous visitors. 0 disables. Cleared on publish.</summary>
        public static int CacheMinutes
        {
            get { return Int("CacheMinutes", 30); }
        }

        /// <summary>Memory limit of the Markdown and llms.txt cache, in megabytes. Older entries are evicted first.</summary>
        public static int CacheSizeMB
        {
            get { return Int("CacheSizeMB", 100); }
        }

        /// <summary>When true, each query string gets its own cache entry. Off so tracking parameters cannot fill the cache.</summary>
        public static bool CacheVaryByQueryString
        {
            get { return Bool("CacheVaryByQueryString", false); }
        }

        /// <summary>
        /// Databases whose content is never cached (default <c>master</c>): sites served from them (local
        /// development, preview) change on save, and only a publish clears the cache.
        /// </summary>
        public static ICollection<string> NoCacheDatabases
        {
            get { return List("NoCacheDatabases", "master"); }
        }

        /// <summary>False for databases in <c>MarkdownForAI.NoCacheDatabases</c>.</summary>
        public static bool IsCacheableDatabase(string databaseName)
        {
            return !string.IsNullOrEmpty(databaseName) && !NoCacheDatabases.Contains(databaseName);
        }

        /// <summary>max-age for CDNs, proxies and agents on cached Markdown responses (anonymous only). 0 = revalidate every time.</summary>
        public static int HttpCacheMinutes
        {
            get { return Int("HttpCacheMinutes", 10); }
        }

        /// <summary>URL of ask-ai.js (html-to-markdown.js must sit next to it). Empty = the page loads the script itself.</summary>
        public static string AskAiScriptUrl
        {
            get { return Text("AskAi.ScriptUrl", "/scripts/markdownforai/ask-ai.js"); }
        }

        public static bool NoIndexHeader
        {
            get { return Bool("NoIndexHeader", true); }
        }

        /// <summary>Send a <c>Link: rel="alternate"; type="text/markdown"</c> header on HTML pages.</summary>
        public static bool LinkHeader
        {
            get { return Bool("LinkHeader", true); }
        }

        /// <summary>Forces the scheme of generated absolute URLs (e.g. https behind an SSL offloader). Empty uses the request.</summary>
        public static string Scheme
        {
            get { return Text("Scheme", string.Empty); }
        }

        public static bool LlmsTxtEnabled
        {
            get { return Bool("LlmsTxt.Enabled", true); }
        }

        public static bool LlmsFullTxtEnabled
        {
            get { return Bool("LlmsTxt.FullEnabled", true); }
        }

        /// <summary><c>tree</c> walks the content tree; <c>index</c> queries a ContentSearch index.</summary>
        public static string LlmsTxtSource
        {
            get { return Text("LlmsTxt.Source", "tree"); }
        }

        /// <summary>Index used when the source is <c>index</c>. Empty means <c>sitecore_{database}_index</c>.</summary>
        public static string LlmsTxtIndexName
        {
            get { return Text("LlmsTxt.IndexName", string.Empty); }
        }

        public static int LlmsTxtMaxItems
        {
            get { return Int("LlmsTxt.MaxItems", 5000); }
        }

        public static int LlmsFullMaxChars
        {
            get { return Int("LlmsTxt.FullMaxChars", 5000000); }
        }

        public static int LlmsTxtCacheMinutes
        {
            get { return Int("LlmsTxt.CacheMinutes", 60); }
        }

        public static bool IsSiteAllowed(string siteName)
        {
            if (string.IsNullOrEmpty(siteName))
            {
                return false;
            }

            ICollection<string> sites = Sites;
            if (sites.Contains("*"))
            {
                return !SystemSites.Contains(siteName);
            }

            return sites.Contains(siteName);
        }

        private static readonly HashSet<string> SystemSites = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "shell", "login", "admin", "service", "modules_shell", "modules_website", "scheduler", "system", "publisher", "exm", "coveo_website"
        };

        private static string Text(string name, string defaultValue)
        {
            return Configuration.Settings.GetSetting(Prefix + name, defaultValue) ?? defaultValue;
        }

        private static bool Bool(string name, bool defaultValue)
        {
            return Configuration.Settings.GetBoolSetting(Prefix + name, defaultValue);
        }

        private static int Int(string name, int defaultValue)
        {
            return Configuration.Settings.GetIntSetting(Prefix + name, defaultValue);
        }

        private static ICollection<string> List(string name, string defaultValue)
        {
            return new HashSet<string>(OrderedList(name, defaultValue), StringComparer.OrdinalIgnoreCase);
        }

        private static IList<string> OrderedList(string name, string defaultValue)
        {
            return Text(name, defaultValue)
                .Split(new[] { '|', ',' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(v => v.Trim())
                .Where(v => v.Length > 0)
                .ToList();
        }
    }
}
