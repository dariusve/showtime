---
title: "Designing Systems People Can Think With"
theme: dark
accent: "#e2b455"
fontHeading: Georgia, "Times New Roman", serif
---

---
layout: title

# Designing Systems People Can Think With

An example university lecture deck powered by Markdown.

???
Open with the human problem first: systems should help people reason, not merely automate.

---
layout: center

## The Core Idea

Software becomes more useful when it makes hidden structure visible.

---

## What This Deck Supports

- Markdown headings, paragraphs, links, images, lists, quotes, code, and tables
- Per-slide layouts with frontmatter
- Speaker notes after `???`
- Keyboard navigation and fullscreen mode

---
layout: split

## A Simple Mental Model

1. Write content in a Markdown file
2. Separate slides with `---`
3. Customize the deck with frontmatter

> The lecture stays editable as text.

---

## Code Slides

```js
const deck = parseMarkdown(markdown);
const slide = deck.slides[currentIndex];
render(slide);
```

---

## Tables

| Feature | Purpose |
| --- | --- |
| `layout` | Changes slide composition |
| `theme` | Picks the global visual mode |
| `accent` | Sets a deck color |
| `???` | Adds presenter-only notes |

---
layout: center

## Your Turn

Create a new file in `decks/`, point the deck field at it, and lecture from plain text.
