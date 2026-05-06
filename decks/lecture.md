---
title: "Designing Systems People Can Think With"
theme: dark
accent: "#e2b455"
fontHeading: Georgia, "Times New Roman", serif
transition: fade
transitionDuration: 850ms
transitionEasing: ease-out
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
layout: image
image: assets/lecture-diagram.svg
imageAlt: Layered diagram showing Markdown flowing into rendered slides
caption: Local images live in `assets/` and can fill a slide.
fit: contain
transition: zoom
transitionDuration: 1.1s
transitionEasing: smooth

---
layout: split
transition: slide
transitionDuration: 900ms
transitionEasing: ease-out

## A Simple Mental Model

1. Write content in a Markdown file
2. Separate slides with `---`
3. Customize the deck with frontmatter

> The lecture stays editable as text.

---
background: assets/lecture-diagram.svg
transition: zoom
transitionDuration: 1.2s
transitionEasing: ease-in-out

## Background Images

Use `background: assets/your-image.jpg` when text should sit on top of a visual.

---
layout: center
transition: slide
transitionDuration: 1s
transitionEasing: snappy

## Transitions

Control `transition`, `transitionDuration`, and `transitionEasing` from Markdown.

---
transition: none

## Code Slides

```js
const deck = parseMarkdown(markdown);
const slide = deck.slides[currentIndex];
render(slide);
```

---
transition: fade
transitionDuration: 1.25s
transitionEasing: ease-in-out

## Tables

| Feature | Purpose |
| --- | --- |
| `layout` | Changes slide composition |
| `theme` | Picks the global visual mode |
| `accent` | Sets a deck color |
| `???` | Adds presenter-only notes |

---
layout: center
transition: zoom
transitionDuration: 1s
transitionEasing: smooth

## Your Turn

Create a new file in `decks/`, point the deck field at it, and lecture from plain text.
