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
- `transition`: `fade`, `slide`, `zoom`, or `none`
- `transitionDuration`: `700ms`, `1s`, or another CSS time
- `transitionEasing`: `ease`, `ease-in`, `ease-out`, `ease-in-out`, `linear`, `smooth`, `snappy`, or `cubic-bezier(...)`
- `transitionDelay`: optional CSS time

Slide frontmatter supports:

- `layout: title`
- `layout: center`
- `layout: split`
- `layout: image`
- `image: assets/photo.jpg`
- `imageAlt: Description of the image`
- `caption: Optional image caption`
- `fit: contain` or `fit: cover`
- `background: assets/photo.jpg`
- `transition: fade`, `slide`, `zoom`, or `none`
- `transitionDuration: 1s`
- `transitionEasing: ease-out`
- `transitionDelay: 120ms`

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
