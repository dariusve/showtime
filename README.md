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

Slide frontmatter supports:

- `layout: title`
- `layout: center`
- `layout: split`
- `layout: image`

## Controls

- Right arrow, space, or Page Down: next slide
- Left arrow or Page Up: previous slide
- Home or End: first or last slide
- `f`: fullscreen
- `n`: speaker notes
- `t`: theme
