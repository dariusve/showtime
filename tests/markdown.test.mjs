import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { resolveDeckUrl } from "../src/decks.js";
import { parseSlides } from "../src/markdown.js";

test("parses deck metadata, slide metadata, and speaker notes", () => {
  const parsed = parseSlides(`---
title: "Parser Demo"
theme: paper
transitionDuration: 900
---
---
layaout: title

# First Slide

???
Remember the **point**.

---
## Second Slide

Body text.
`);

  assert.equal(parsed.meta.title, "Parser Demo");
  assert.equal(parsed.meta.theme, "paper");
  assert.equal(parsed.meta.transitionDuration, 900);
  assert.equal(parsed.slides.length, 2);
  assert.equal(parsed.slides[0].meta.layout, "title");
  assert.match(parsed.slides[0].html, /<h1>First Slide<\/h1>/);
  assert.match(parsed.slides[0].notes, /<strong>point<\/strong>/);
});

test("does not split slides on separators inside code fences", () => {
  const parsed = parseSlides(`## Code

\`\`\`js
const separator = "---";
---
\`\`\`

---
## After
`);

  assert.equal(parsed.slides.length, 2);
  assert.match(parsed.slides[0].html, /<pre><code class="language-js">/);
  assert.match(parsed.slides[0].html, /const separator = &quot;---&quot;/);
  assert.match(parsed.slides[0].html, /\n---<\/code><\/pre>/);
});

test("renders tables and combined text block classes", () => {
  const parsed = parseSlides(`::: small muted compact
| Name | Value |
| --- | --- |
| **Mode** | \`demo\` |
:::
`);

  assert.equal(parsed.slides.length, 1);
  assert.match(parsed.slides[0].html, /class="text-block text-small text-muted text-compact"/);
  assert.match(parsed.slides[0].html, /<table>/);
  assert.match(parsed.slides[0].html, /<strong>Mode<\/strong>/);
  assert.match(parsed.slides[0].html, /<code>demo<\/code>/);
});

test("parses the bundled decks", async () => {
  const deckPaths = ["decks/lecture.md", "decks/nobody_cares.md"];

  for (const path of deckPaths) {
    const markdown = await readFile(path, "utf8");
    const parsed = parseSlides(markdown);
    assert.ok(parsed.slides.length > 0, `${path} should contain slides`);
  }
});

test("resolves deck paths relative to the app module", () => {
  const baseUrl = "https://example.com/showtime/app.js?v=20260512-modules";

  assert.equal(
    String(resolveDeckUrl("decks/lecture.md", baseUrl)),
    "https://example.com/showtime/decks/lecture.md"
  );
  assert.equal(
    String(resolveDeckUrl("/shared/deck.md", baseUrl)),
    "https://example.com/shared/deck.md"
  );
});
