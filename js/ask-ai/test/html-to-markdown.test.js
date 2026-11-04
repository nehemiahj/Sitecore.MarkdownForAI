import { test } from 'node:test';
import assert from 'node:assert/strict';
import { htmlToMarkdown, dedent } from '../src/html-to-markdown.js';

// Mirrors tests/Sitecore.MarkdownForAI.Tests/MarkdownConverterTests.cs so both converters stay in step.
const md = (html, baseUrl = 'https://www.example.com/pets/cats/') => htmlToMarkdown(html, { baseUrl });

test('headings, paragraphs and inline formatting', () => {
  assert.equal(md('<h1>Kidney care</h1><p>Cats with <strong>CKD</strong> need <em>more</em> water.</p><h3> Signs </h3>'),
    '# Kidney care\n\nCats with **CKD** need *more* water.\n\n### Signs');
});

test('emphasis keeps surrounding spaces outside the markers', () => {
  assert.equal(md('<p>Drink<b> plenty </b>of water</p>'), 'Drink **plenty** of water');
});

test('links and images are made absolute', () => {
  assert.equal(md('<p><a href="../dogs/">Dogs</a> <img src="/-/media/cat.jpg" alt="A cat"></p>'),
    '[Dogs](https://www.example.com/pets/dogs/) ![A cat](https://www.example.com/-/media/cat.jpg)');
});

test('anchor and javascript links keep only their text', () => {
  assert.equal(md('<p><a href="#top">Top</a> and <a href="javascript:print()">print</a></p>'), 'Top and print');
});

test('nested and ordered lists', () => {
  assert.equal(md('<ul><li>Water<ul><li>Fountain</li><li>Wet food</li></ul></li><li>Diet</li></ul>'),
    '- Water\n  - Fountain\n  - Wet food\n- Diet');
  assert.equal(md('<ol start="3"><li>Weigh<li>Measure</ol>'), '3. Weigh\n4. Measure');
  assert.equal(md('<ul><li><p>First</p><p>Second</p></li></ul>'), '- First\n\n  Second');
});

test('tables', () => {
  const html = '<table><thead><tr><th>Stage</th><th>Creatinine</th></tr></thead>' +
    '<tbody><tr><td>1</td><td>&lt; 1.6</td></tr><tr><td>2</td><td>1.6 | 2.8</td></tr></tbody></table>';
  assert.equal(md(html), '| Stage | Creatinine |\n| --- | --- |\n| 1 | < 1.6 |\n| 2 | 1.6 \\| 2.8 |');
  assert.equal(md('<table><tr><td><p>Hello</p></td></tr><tr><td>World</td></tr></table>'), 'Hello\n\nWorld');
});

test('skipped and hidden elements are removed', () => {
  const html = '<nav>Menu</nav><p>Keep</p><script>alert(1)</script><style>p{}</style>' +
    '<div data-md-ignore>Ignore</div><div hidden>Hidden</div><span aria-hidden="true">x</span>' +
    '<div style="display: none">None</div><form><input></form><!-- comment -->';
  assert.equal(md(html), 'Keep');
});

test('raw markdown scripts pass through, dedented', () => {
  assert.equal(md('<div><script type="text/x-markdown">\n    ## Raw\n\n    - **a**\n    - b\n  </script></div>'), '## Raw\n\n- **a**\n- b');
});

test('code, escaping and hard breaks', () => {
  assert.equal(md('<pre><code class="language-json">{\n  "a": 1\n}</code></pre>'), '```json\n{\n  "a": 1\n}\n```');
  assert.equal(md('<p>Use <code>a*b</code> not a*b or [x] or snake_case</p>'), 'Use `a*b` not a\\*b or \\[x\\] or snake_case');
  assert.equal(md('<p># not a heading</p>'), '\\# not a heading');
  assert.equal(md('<p>1. not a list</p>'), '1\\. not a list');
  assert.equal(md('<p>Line one<br/> Line two</p>'), 'Line one  \nLine two');
});

test('blockquotes, entities and custom elements', () => {
  assert.equal(md('<blockquote><p>Call your vet</p><p>Today</p></blockquote>'), '> Call your vet\n>\n> Today');
  assert.equal(md('<blockquote><p>[!WARNING]\n<strong>Hot cars</strong> kill.</p></blockquote>'), '> [!WARNING]\n> **Hot cars** kill.');
  assert.equal(md('<blockquote><p>[!note] Read this.</p></blockquote>'), '> [!NOTE]\n> Read this.');
  assert.equal(md('<blockquote><p>[!SOON] Not an alert.</p></blockquote>'), '> \\[!SOON\\] Not an alert.');
  assert.equal(md('<p>Tom &amp; Jerry&nbsp;</p>'), 'Tom & Jerry');
  assert.equal(md('<my-card>Intro<h2>Title</h2><p>Body</p></my-card>'), 'Intro\n\n## Title\n\nBody');
});

test('dedent', () => {
  assert.equal(dedent('\n    a\n      b\n'), 'a\n  b');
});
