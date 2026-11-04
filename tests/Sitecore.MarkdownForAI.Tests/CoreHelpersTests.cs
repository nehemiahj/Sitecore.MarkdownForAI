using System.Collections.Generic;
using Sitecore.MarkdownForAI.Core;
using Xunit;

namespace Sitecore.MarkdownForAI.Tests
{
    public class MarkdownPathTests
    {
        [Theory]
        [InlineData("/about/team.md", "/about/team")]
        [InlineData("/About/Team.MD", "/About/Team")]
        [InlineData("/index.md", "/")]
        [InlineData("/blog/index.md", "/blog/")]
        [InlineData("/.md", "/")]
        public void Page_path_from_markdown_path(string path, string expected)
        {
            string page;
            Assert.True(MarkdownPath.TryGetPagePath(path, ".md", out page));
            Assert.Equal(expected, page);
        }

        [Theory]
        [InlineData("/about/team")]
        [InlineData("/readme.mdx")]
        [InlineData(".md")]
        [InlineData("")]
        public void Non_markdown_paths(string path)
        {
            string page;
            Assert.False(MarkdownPath.TryGetPagePath(path, ".md", out page));
        }

        [Theory]
        [InlineData("https://x.com/about", "https://x.com/about.md")]
        [InlineData("https://x.com/about?a=1#top", "https://x.com/about.md?a=1#top")]
        [InlineData("https://x.com/", "https://x.com/index.md")]
        [InlineData("https://x.com", "https://x.com/index.md")]
        [InlineData("/blog/", "/blog/index.md")]
        public void Markdown_url_from_page_url(string url, string expected)
        {
            Assert.Equal(expected, MarkdownPath.ToMarkdownUrl(url, ".md"));
        }

    }

    public class PlaceholderMatcherTests
    {
        [Theory]
        [InlineData("header", true)]
        [InlineData("/main/header", true)]
        [InlineData("/main/Header", true)]
        [InlineData("/main/header-{0B1C2D3E-1111-2222-3333-444455556666}-0", true)]
        [InlineData("/main/header_0b1c2d3e11112222333344445555666", true)]
        [InlineData("/main/headerimage", false)]
        [InlineData("/main/header-image", false)]
        [InlineData("/main", false)]
        [InlineData("", false)]
        public void Matches_static_and_dynamic_placeholders(string path, bool expected)
        {
            Assert.Equal(expected, PlaceholderMatcher.MatchesAny(path, new List<string> { "header", "footer" }));
        }

        [Fact]
        public void Top_level_key()
        {
            Assert.Equal("main", PlaceholderMatcher.TopLevelKey("/main/content"));
            Assert.Equal("main", PlaceholderMatcher.TopLevelKey("main"));
            Assert.Null(PlaceholderMatcher.TopLevelKey(""));
        }
    }

    public class MarkdownDocumentTests
    {
        [Fact]
        public void Front_matter_is_quoted_and_lists_are_inline()
        {
            var doc = new MarkdownDocument("# Hi")
                .Set("title", "Cats \"and\" kidneys")
                .Set("topics", new[] { "Kidney", "Diet" })
                .Set("empty", "  ");

            Assert.Equal("---\ntitle: \"Cats \\\"and\\\" kidneys\"\ntopics: [\"Kidney\", \"Diet\"]\n---\n\n# Hi\n", doc.ToString());
        }

        [Fact]
        public void No_front_matter_when_empty()
        {
            Assert.Equal("Body\n", new MarkdownDocument("Body").ToString());
        }
    }
}
