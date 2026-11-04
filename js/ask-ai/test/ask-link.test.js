import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAskLink, resolveProviders, isSafeProviderUrl, BUILT_IN_PROVIDERS } from '../src/ask-ai.js';

const CHATGPT = BUILT_IN_PROVIDERS.chatgpt.url;
const decode = (url, pattern = CHATGPT) => decodeURIComponent(url.slice(pattern.indexOf('{prompt}')));

test('uses the short .md link prompt when a public Markdown URL exists', () => {
  const plan = buildAskLink({ urlPattern: CHATGPT, markdown: 'x'.repeat(50000), markdownUrl: 'https://site.org/cats/ckd.md', pageUrl: 'https://site.org/cats/ckd', title: 'CKD' });
  assert.equal(plan.mode, 'link');
  assert.ok(plan.url.startsWith('https://chatgpt.com/?q='));
  assert.equal(decode(plan.url), 'Read this page so I can ask you questions about it: https://site.org/cats/ckd.md');
});

test('the prompt goes where {prompt} is in the pattern', () => {
  const pattern = 'https://ai.example.com/chat?src=site&q={prompt}&lang=en';
  const plan = buildAskLink({ urlPattern: pattern, markdown: 'Body', markdownUrl: 'https://site.org/a.md', pageUrl: 'https://site.org/a', title: 'A' });
  assert.match(plan.url, /^https:\/\/ai\.example\.com\/chat\?src=site&q=Read%20this%20page.*&lang=en$/);
});

test('inlines short articles when there is no Markdown URL', () => {
  const plan = buildAskLink({ urlPattern: CHATGPT, markdown: '# CKD\n\nShort.', pageUrl: 'https://site.org/cats/ckd', title: 'CKD' });
  assert.equal(plan.mode, 'inline');
  assert.match(decode(plan.url), /titled "CKD" \(https:\/\/site\.org\/cats\/ckd\)[\s\S]*# CKD\n\nShort\.$/);
});

test('falls back to the clipboard for long articles', () => {
  const plan = buildAskLink({ urlPattern: CHATGPT, markdown: 'word '.repeat(5000), pageUrl: 'https://site.org/a', title: 'A', maxUrlLength: 6000 });
  assert.equal(plan.mode, 'clipboard');
  assert.ok(plan.url.length < 6000);
  assert.match(decode(plan.url), /copied an article titled "A" to my clipboard/);
});

test('assistants without a {prompt} placeholder get the clipboard and the plain link', () => {
  const plan = buildAskLink({ urlPattern: 'https://ai.example.com/', markdown: 'Body', markdownUrl: 'https://site.org/a.md', pageUrl: 'https://site.org/a', title: 'A' });
  assert.deepEqual(plan, { mode: 'clipboard', url: 'https://ai.example.com/', prefilled: false });
});

test('no-link forces the text path and custom prompts fill placeholders', () => {
  const plan = buildAskLink({ urlPattern: CHATGPT, markdown: 'Body', markdownUrl: 'https://site.org/a.md', pageUrl: 'https://site.org/a', title: 'A',
    prompt: 'Summarise {title} from {page}', allowLink: false });
  assert.equal(plan.mode, 'inline');
  assert.equal(decode(plan.url), 'Summarise A from https://site.org/a\n\nBody');
});

test('relative Markdown URLs are not sent as links', () => {
  const plan = buildAskLink({ urlPattern: CHATGPT, markdown: 'Body', markdownUrl: '/a.md', pageUrl: 'https://site.org/a', title: 'A' });
  assert.equal(plan.mode, 'inline');
});

const el = (attributes) => ({ getAttribute: (name) => (name in attributes ? attributes[name] : null) });

test('built-in assistants: ChatGPT, Claude and Perplexity by default, in that order', () => {
  assert.deepEqual(resolveProviders([], null).map((p) => p.name), ['ChatGPT', 'Claude', 'Perplexity']);
  assert.deepEqual(resolveProviders([], 'claude, unknown').map((p) => p.label), ['Open in Claude']);
  assert.deepEqual(resolveProviders([], ''), []);
});

test('child elements replace the built-ins and keep their labels', () => {
  const providers = resolveProviders([
    el({ name: 'Gemini', url: 'https://gemini.example.com/?q={prompt}', label: 'Ask Gemini', hint: '' }),
    el({ name: 'Copilot', url: 'https://copilot.example.com/' }),
  ], 'chatgpt');
  assert.deepEqual(providers.map((p) => [p.name, p.label, p.hint]), [
    ['Gemini', 'Ask Gemini', ''],
    ['Copilot', 'Open in Copilot', 'Ask questions about this page'],
  ]);
});

test('unsafe or incomplete assistant entries are dropped', () => {
  const providers = resolveProviders([
    el({ name: 'Bad', url: 'javascript:alert(1)' }),
    el({ name: 'Plain http', url: 'http://ai.example.com/?q={prompt}' }),
    el({ name: '', url: 'https://ai.example.com/' }),
    el({ name: 'Good', url: 'https://ai.example.com/?q={prompt}' }),
  ], null);
  assert.deepEqual(providers.map((p) => p.name), ['Good']);
  assert.equal(isSafeProviderUrl('https://x.org/?q={prompt}'), true);
  assert.equal(isSafeProviderUrl('data:text/html,hi'), false);
});
