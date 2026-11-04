using System;
using System.Collections.Specialized;
using System.Globalization;
using System.Linq;
using System.Runtime.Caching;
using System.Threading;
using System.Web;

namespace Sitecore.MarkdownForAI.Caching
{
    /// <summary>
    /// In-process cache for generated Markdown. Uses System.Runtime.Caching so it does not depend on
    /// Sitecore's cache API. Size-limited by <c>MarkdownForAI.CacheSizeMB</c> and cleared on
    /// publish:end and publish:end:remote.
    /// </summary>
    public static class MarkdownCache
    {
        // Lock striping: concurrent misses for the same key build the value once, without a lock per key.
        private static readonly object[] Locks = Enumerable.Range(0, 64).Select(_ => new object()).ToArray();

        private static MemoryCache _cache = Create();

        public static string Get(string key)
        {
            return key == null ? null : _cache.Get(key) as string;
        }

        /// <summary>
        /// Returns the cached value for <paramref name="key"/>, or builds it with <paramref name="factory"/>.
        /// Only one thread builds a given key at a time; the others wait and reuse the result.
        /// A null key or <paramref name="minutes"/> of 0 builds without caching. Only bodies built for a
        /// 200 response are stored, so not-found and error pages are never replayed.
        /// </summary>
        public static string GetOrCreate(string key, int minutes, Func<string> factory)
        {
            if (key == null || minutes <= 0)
            {
                return factory();
            }

            // The cache this build belongs to. A publish that clears the cache while the build runs
            // swaps in a new instance, and the (now stale) result goes to the discarded one.
            MemoryCache cache = _cache;
            string cached = cache.Get(key) as string;
            if (cached != null)
            {
                return cached;
            }

            lock (Locks[(key.GetHashCode() & int.MaxValue) % Locks.Length])
            {
                cached = cache.Get(key) as string;
                if (cached != null)
                {
                    return cached;
                }

                string created = factory() ?? string.Empty;
                if (IsSuccessResponse())
                {
                    try
                    {
                        cache.Set(key, created, DateTimeOffset.UtcNow.AddMinutes(minutes));
                    }
                    catch (ObjectDisposedException)
                    {
                        // Cleared by a publish during the build: the result is not kept.
                    }
                }

                return created;
            }
        }

        public static void Clear()
        {
            MemoryCache old = Interlocked.Exchange(ref _cache, Create());
            old.Dispose();
        }

        private static bool IsSuccessResponse()
        {
            HttpContext context = HttpContext.Current;
            return context == null || context.Response.StatusCode == 200;
        }

        private static MemoryCache Create()
        {
            var config = new NameValueCollection
            {
                { "cacheMemoryLimitMegabytes", Math.Max(1, MarkdownSettings.CacheSizeMB).ToString(CultureInfo.InvariantCulture) },
                { "pollingInterval", "00:01:00" }
            };
            return new MemoryCache("MarkdownForAI", config);
        }
    }

    /// <summary>Event handler for publish:end and publish:end:remote.</summary>
    public class ClearMarkdownCache
    {
        public void OnPublishEnd(object sender, EventArgs args)
        {
            MarkdownCache.Clear();
            Diagnostics.Log.Info("MarkdownForAI: cache cleared after publish.", this);
        }
    }
}
