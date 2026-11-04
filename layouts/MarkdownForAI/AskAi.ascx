<%@ Control Language="C#" %>
<%--
    "Ask AI" sublayout for WebForms pages (/sitecore/layout/Renderings/Modules/Markdown For AI/Ask AI Sublayout).
    Data source: an "Ask AI Settings" item; empty = /sitecore/system/Modules/Markdown For AI/Ask AI.
    Parameter "target": CSS selector of the article, used when the page has no Markdown URL.
--%>
<script runat="server">
    protected override void Render(HtmlTextWriter writer)
    {
        var sublayout = Parent as Sitecore.Web.UI.WebControls.Sublayout;
        Sitecore.Data.Items.Item settings = null;
        string target = null;

        if (sublayout != null)
        {
            if (!string.IsNullOrEmpty(sublayout.DataSource) && Sitecore.Context.Database != null)
            {
                settings = Sitecore.Context.Database.GetItem(sublayout.DataSource);
            }

            target = Sitecore.Web.WebUtil.ParseUrlParameters(sublayout.Parameters ?? string.Empty)["target"];
        }

        writer.Write(Sitecore.MarkdownForAI.Html.AskAiHtml.Render(settings, target));
    }
</script>
