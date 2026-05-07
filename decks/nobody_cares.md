---
title: "A nadie le importa"
theme: dark
accent: "#e2b455"
fontHeading: Georgia, "Times New Roman", serif
transition: fade
transitionDuration: 850ms
transitionEasing: ease-out
---

---
layout: title

# A nadie le importa

Conversatorio sobre la influencia externa en los desarrolladores de software

???
Open with the human problem first: systems should help people reason, not merely automate.

---
layout: center

## About me

Es la hora de echarse flores!

---
layout: columns
columns: 2

## Darío Espina Boada

Senior Software Engineer con mas de 30 años de experiencia.

::: medium
- Retail y manejo de inventarios
- Sistemas real-time en Oil & Gas
- Entretenimiento
- Salud
- Soporte al usuario
- Parque tecnologico
- Consultoria
:::

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
