# Showtime

Showtime is a small, dependency-free slideshow system that renders presentation decks from Markdown files.

## Run

Serve the folder with any static server:

```sh
./showtime.sh
```

Then open `http://localhost:5173`.

To use a different port:

```sh
./showtime.sh 8080
```

## Test

Run the parser smoke tests with Node:

```sh
node --test tests/*.test.mjs
```

## Write A Deck

Create a Markdown file in `decks/` and separate slides with `---`.

```md
---
title: "My Lecture"
theme: dark
accent: "#e2b455"
---

---
layout: title

# My Lecture

An opening thought.

???
Private speaker notes for this slide.

---

## Second Slide

- One point
- Another point
```

## Customization

Deck frontmatter supports:

- `title`: browser title
- `theme`: `dark` or `paper`
- `accent`: CSS color for emphasis
- `background`, `surface`, `text`, `muted`: CSS colors
- `fontBody`, `fontHeading`: font stacks
- `transition`: `fade`, `slide`, `zoom`, or `none`
- `transitionDuration`: `700ms`, `1s`, or another CSS time
- `transitionEasing`: `ease`, `ease-in`, `ease-out`, `ease-in-out`, `linear`, `smooth`, `snappy`, or `cubic-bezier(...)`
- `transitionDelay`: optional CSS time

Slide frontmatter supports:

- `layout: title`
- `layout: center`
- `layout: split`
- `layout: columns`
- `layout: compare`
- `layout: image`
- `columns: 2`
- `image: assets/photo.jpg`
- `imageAlt: Description of the image`
- `caption: Optional image caption`
- `fit: contain` or `fit: cover`
- `background: assets/photo.jpg`
- `transition: fade`, `slide`, `zoom`, or `none`
- `transitionDuration: 1s`
- `transitionEasing: ease-out`
- `transitionDelay: 120ms`

## Responsive Slide Sizing

Slides scale to the available presentation stage while preserving a 16:9 aspect ratio.

Typography, spacing, padding, tables, code blocks, and text block modifiers are driven by the rendered slide size. This keeps slides readable on laptop screens and large auditorium displays.

Below the 1180px design width, that responsive scale is reduced by 9.75% so lower-resolution displays keep the same perceived density.

When changing slide formatting, update this README in the same change. New layouts, text block styles, responsive sizing rules, or Markdown conventions should be documented here with a short example.

## Columns

For a column slide, put the title first, then an optional subtitle paragraph. If the content uses `###` headings, each heading and the content below it becomes a balanced presentation panel:

```md
---
layout: columns
columns: 2

## Speaker Bio

Senior Software Engineer with 30 years of experience.

### Fields

- Retail
- Inventory systems
- Health
- Support

### Focus

Build systems people can understand.
```

Use `columns: 2`, `columns: 3`, or `columns: 4`. Dense teaching slides should prefer short bullets and `###` panel headings so content stays grouped instead of flowing like newspaper columns.

## Compare Slides

Use `layout: compare` for two-sided comparisons. The slide title spans the top, and each bold label followed by a list becomes a comparison panel:

```md
---
layout: compare

## China vs. el resto del mundo

**Douyin (TikTok en China)**

- Educación
- Ciencias
- Información

**TikTok global**

- Retos virales
- Estafas
- Crímenes
- Ventas de productos
```

Keep compare slides to two groups. For auditorium projection, use concise labels and short list items.

## Text Blocks

Wrap content in a styled block to adjust one section:

```md
::: small
This paragraph is smaller.

- Compact supporting point
- Another supporting point
:::
```

Available block styles:

- `small`
- `medium`
- `large`
- `muted`
- `compact`

Text block sizes are responsive, not fixed browser text sizes. `small` is still designed to be readable from the back of a room. `muted small` gets a slightly brighter muted color and a larger size so secondary notes remain legible on dark slides.

Paragraphs follow Markdown hard-break behavior. A normal line break in the `.md` source is treated as a space. To force a visible line break, end the line with two spaces:

```md
::: muted
This stays in one paragraph unless it must wrap.
This source line continues the same paragraph.
:::

::: muted
This line breaks here.  
This line starts below it.
:::
```

Styles can be combined:

```md
::: small muted compact
- Secondary detail
- Another detail
:::
```

## Code Blocks

Use fenced code blocks for readable code slides:

````md
```js
const slide = deck.slides[currentIndex];
render(slide);
```
````

Code fences can include `---` lines without splitting the deck into new slides.

## Transitions

Set a default transition for the whole deck:

```md
---
title: "My Lecture"
transition: fade
transitionDuration: 900ms
transitionEasing: ease-out
---
```

Override it on a single slide:

```md
---
transition: zoom
transitionDuration: 1.2s
transitionEasing: smooth

## A Bigger Moment
```

## Images

Put images in `assets/` and reference them from Markdown:

```md
![Architecture diagram](assets/architecture.png)
```

For a full-slide image:

```md
---
layout: image
image: assets/lecture-hall.jpg
imageAlt: Students listening in a lecture hall
caption: Lecture hall, first session.
fit: cover
```

For text over a background image:

```md
---
background: assets/fieldwork.jpg

## Observations From The Field
```

## Controls

- Right arrow, space, or Page Down: next slide
- Left arrow or Page Up: previous slide
- Home or End: first or last slide
- `f`: fullscreen
- `n`: speaker notes
- `o`: slide thumbnails
- `t`: theme
