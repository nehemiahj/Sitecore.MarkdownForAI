# Content style guide: articles that work for people and for AI

These rules produce pages that an anxious reader can scan in seconds and that an AI model can parse without guessing. The [Feline CKD example](../examples/articles/feline-chronic-kidney-disease.md) follows all of them; [article-template.md](../examples/articles/article-template.md) is a blank to copy.

## Structure

| Rule | Why |
|---|---|
| **One H1**, then H2 sections, H3 only inside a section | Readers and models both use headings as the outline. Skipped levels confuse both. |
| **"In short" box first** | The reader gets the answer before scrolling; a model gets the summary before the detail. |
| **Fixed section order** (what it is, signs, when to call the vet, diagnosis, treatment, home care, questions, takeaways) | Readers learn where to look; models can compare articles. |
| **`---` between H2 sections** | A visual break when scanning; a clean split point for chunking. |
| **On-this-page links** under the summary | Lets readers jump to the part they came for. |

## Scan-path bolding

Bold **the first two to four words** of a bullet or the **one fact** in a sentence that the reader must not miss. A reader who reads only bold text should still get the message.

- Good: **Drinking more** than usual, or waiting by taps
- Too much: **Drinking more than usual, or waiting by taps**
- Never bold whole paragraphs.

## Visual anchors

- **One emoji per H2**, always the same emoji for the same kind of section (🩺 what it is, 👀 signs, 🚨 when to call, 🔬 diagnosis, 🍽️ diet, 💊 treatment, 🏠 home care, ❓ questions, ✅ takeaways). Never inside sentences.
- **Alerts** use GitHub syntax and are reserved for meaning, not decoration:

| Alert | Use for |
|---|---|
| `> [!CAUTION]` | Emergencies: go to a vet now |
| `> [!WARNING]` | Book a visit soon |
| `> [!IMPORTANT]` | Things that cause harm if ignored |
| `> [!TIP]` | Practical help |
| `> [!NOTE]` | Context, summaries, disclaimers |

Alerts render as coloured boxes on GitHub-style renderers and fall back to plain blockquotes elsewhere, so they stay readable.

## Tables

Use a table whenever the reader compares things across the same attributes: stages, diets, toxins, products, schedules.

- **First column bold**, so each row has a scannable label.
- **Units in the header**, not in every cell: `Creatinine (mg/dL)`.
- **Ranges with words:** `1.6 to 2.8`, `Under 18`, `Over 5.0`. Avoid dashes, which models and screen readers can misread as minus signs.
- **Last column "What it means"** in plain language.
- Keep cells short. If a cell needs a paragraph, it is not a table.

## Language

- **Plain words first**, the medical term second, defined once: "fluids under the skin (subcutaneous fluids)".
- **Short sentences**, about 15 words on average; reading age around 12 to 13.
- **Second person** ("your cat"), active voice, present tense.
- **One idea per bullet.**
- **Answer first** in FAQs: the first sentence must answer the question on its own.
- **Inclusive and global:** metric and US units where it matters, no idioms, no regional slang.

## Medical safety

- **No doses.** Name the type of treatment and say the vet sets the dose.
- **Emergency signs always in a CAUTION alert**, never only in body text.
- **Reviewer and review date** in front matter, shown on the page.
- **Disclaimer** at the end, in italics.

## Front matter

Every article starts with YAML front matter. The module also writes front matter on generated Markdown (title, description, url, language, last_updated); keep the keys compatible:

```yaml
---
title: "Chronic Kidney Disease in Cats: Care and Diet Guidelines"
slug: "feline-chronic-kidney-disease"
species: ["Cat"]
topics: ["Kidney and urinary", "Senior care"]
summary: "One sentence, plain language."
reviewed_by: "Name, credentials"
last_reviewed: "2026-10-01"
llms: true
---
```

## Writing in Sitecore rich text

When articles are authored in Sitecore rather than as `.md` files, the same rules map onto HTML:

| Markdown | Rich text |
|---|---|
| `## Heading` | Heading 2 (never bold paragraphs pretending to be headings) |
| `**bold**` | Bold |
| Table | A real table with a header row (`th`), not a layout table |
| `> [!WARNING]` | A blockquote starting with **Warning:**, or a dedicated callout component |
| `---` | Horizontal rule |

The converter turns these back into clean Markdown.
