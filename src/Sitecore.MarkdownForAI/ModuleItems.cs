using Sitecore.Data;

namespace Sitecore.MarkdownForAI
{
    /// <summary>
    /// IDs of the module's items, serialized in <c>serialization/items</c>. They are fixed so every
    /// install and every environment matches.
    /// </summary>
    public static class ItemIds
    {
        /// <summary><c>/sitecore/templates/Modules/Markdown For AI</c></summary>
        public static readonly ID TemplatesFolder = new ID("{1C082D5A-FA42-4765-9B3D-72DD6D01D1D5}");

        /// <summary><c>/sitecore/templates/Modules/Markdown For AI/Ask AI Settings</c></summary>
        public static readonly ID AskAiSettingsTemplate = new ID("{05416C4C-C256-4363-82CB-2F08DA29FABD}");

        /// <summary><c>/sitecore/templates/Modules/Markdown For AI/AI Assistant</c></summary>
        public static readonly ID AiAssistantTemplate = new ID("{3F742CD0-8726-4AFF-9824-9AA295CAD648}");

        /// <summary><c>/sitecore/system/Modules/Markdown For AI/Ask AI</c>: the default button settings and assistants.</summary>
        public static readonly ID AskAiSettings = new ID("{49593228-8710-41A4-BD89-FC4B85D8CB0C}");

        /// <summary><c>/sitecore/layout/Renderings/Modules/Markdown For AI/Ask AI</c></summary>
        public static readonly ID AskAiRendering = new ID("{115E6CAE-CA7B-4AE8-97C0-59D4DACF1628}");
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
