using Sitecore.Data;

namespace Sitecore.MarkdownForAI
{
    /// <summary>Field names of the <c>_LlmsPage</c> base template.</summary>
    public static class LlmsFields
    {
        public const string Include = "LlmsInclude";
        public const string Optional = "LlmsOptional";
        public const string Title = "LlmsTitle";
        public const string Summary = "LlmsSummary";
        public const string Section = "LlmsSection";
    }

    /// <summary>
    /// IDs of the module's items, serialized in <c>serialization/items</c>. They are fixed so every
    /// install and every environment matches.
    /// </summary>
    public static class ItemIds
    {
        /// <summary><c>/sitecore/templates/Modules/Markdown For AI</c></summary>
        public static readonly ID TemplatesFolder = new ID("{1C082D5A-FA42-4765-9B3D-72DD6D01D1D5}");
        public static readonly ID LlmsPageTemplate = new ID("{5DF73228-24F4-4350-852D-169D884FFA28}");
        public static readonly ID LlmsIncludeField = new ID("{77D96D4D-04F6-48C7-A265-45EFAB7DC36E}");
        public static readonly ID LlmsOptionalField = new ID("{4B350638-943D-45C5-8366-17B2ABCDF56C}");
        public static readonly ID LlmsTitleField = new ID("{BF9A3486-4894-4B64-8FCC-A10E5036634A}");
        public static readonly ID LlmsSummaryField = new ID("{533F62F5-5247-4592-A066-F8BDFE44E2F1}");
        public static readonly ID LlmsSectionField = new ID("{358B1505-86BD-4FF3-9762-D94C06792652}");
        public static readonly ID ParametersTemplate = new ID("{79C0AFAF-6C18-4668-8F26-44707F0980A8}");
        public static readonly ID ModeField = new ID("{FF081F50-E6EA-4CDF-930D-D92DBBDAEBF3}");

        /// <summary><c>/sitecore/system/Modules/Markdown For AI/Modes</c></summary>
        public static readonly ID ModesFolder = new ID("{B906CF70-5553-4B13-95FA-8D6202AB5440}");
        public static readonly ID IncludeOption = new ID("{F7940BC3-6E33-4201-AACD-D3B2991CCF12}");
        public static readonly ID ExcludeOption = new ID("{CCD9C2DC-6366-43A2-ACD5-AC3EF1D1CD39}");

        /// <summary><c>/sitecore/templates/Modules/Markdown For AI/Ask AI Settings</c></summary>
        public static readonly ID AskAiSettingsTemplate = new ID("{05416C4C-C256-4363-82CB-2F08DA29FABD}");

        /// <summary><c>/sitecore/templates/Modules/Markdown For AI/AI Assistant</c></summary>
        public static readonly ID AiAssistantTemplate = new ID("{3F742CD0-8726-4AFF-9824-9AA295CAD648}");

        /// <summary><c>/sitecore/system/Modules/Markdown For AI/Ask AI</c>: the default button settings and assistants.</summary>
        public static readonly ID AskAiSettings = new ID("{49593228-8710-41A4-BD89-FC4B85D8CB0C}");

        /// <summary><c>/sitecore/layout/Renderings/Modules/Markdown For AI/Ask AI</c></summary>
        public static readonly ID AskAiRendering = new ID("{115E6CAE-CA7B-4AE8-97C0-59D4DACF1628}");

        /// <summary><c>/sitecore/layout/Renderings/Modules/Markdown For AI/Ask AI Sublayout</c> (WebForms)</summary>
        public static readonly ID AskAiSublayout = new ID("{BB299BE4-6A32-4A44-85C2-DA51BDA760B6}");
    }

    /// <summary>Field names of the <c>Ask AI Settings</c> template.</summary>
    public static class AskAiSettingsFields
    {
        public const string ButtonLabel = "Button Label";
        public const string Prompt = "Prompt";
        public const string ShowCopyMarkdown = "Show Copy Markdown";
        public const string ShowViewMarkdown = "Show View Markdown";
        public const string MaxLinkLength = "Max Link Length";
    }

    /// <summary>Field names of the <c>AI Assistant</c> template.</summary>
    public static class AiAssistantFields
    {
        public const string Name = "Assistant Name";
        public const string LinkPattern = "Link Pattern";
        public const string MenuLabel = "Menu Label";
        public const string Hint = "Hint";
        public const string Prompt = "Prompt";
        public const string Icon = "Icon";
        public const string Enabled = "Enabled";
    }
}
