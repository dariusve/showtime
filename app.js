const slideEl = document.querySelector("#slide");
const stageEl = document.querySelector(".stage");
const notesEl = document.querySelector("#notes");
const progressEl = document.querySelector("#progress");
const deckInput = document.querySelector("#deck-input");
const loadButton = document.querySelector("#load-deck");
const previousButton = document.querySelector("#prev");
const nextButton = document.querySelector("#next");
const notesButton = document.querySelector("#notes-toggle");
const thumbsButton = document.querySelector("#thumbs-toggle");
const themeButton = document.querySelector("#theme-toggle");
const fullscreenButton = document.querySelector("#fullscreen");
const thumbnailsEl = document.querySelector("#thumbnails");

const state = {
  deck: [],
  current: 0,
  theme: "dark",
  title: "Showtime",
  transition: "fade",
  transitionDuration: "700ms",
  transitionEasing: "ease-out",
  transitionDelay: "0ms",
};

const builtInThemes = {
  dark: {},
  paper: {},
};

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function parseFrontmatter(markdown) {
  if (!markdown.startsWith("---\n")) {
    return [{}, markdown];
  }

  const end = markdown.indexOf("\n---", 4);
  if (end === -1) {
    return [{}, markdown];
  }

  const raw = markdown.slice(4, end).trim();
  const body = markdown.slice(end + 4).trimStart();
  const data = {};

  for (const line of raw.split("\n")) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const [, key, value] = match;
    data[key] = parseFrontmatterValue(value);
  }

  return [data, body];
}

function parseFrontmatterValue(value) {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseSlides(markdown) {
  const [deckMeta, body] = parseFrontmatter(markdown);
  const chunks = body
    .split(/(?:^|\n)---+\s*(?:\n|$)/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return {
    meta: deckMeta,
    slides: chunks.map((chunk) => {
      const [meta, content] = parseSlideMeta(chunk);
      const [visible, notes = ""] = content.split(/\n\?\?\?\n/);
      return {
        meta,
        html: renderMarkdown(visible.trim()),
        notes: renderMarkdown(notes.trim()),
      };
    }),
  };
}

function parseSlideMeta(markdown) {
  const lines = markdown.split("\n");
  const meta = {};
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      break;
    }

    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) {
      index = 0;
      break;
    }

    const [, key, value] = match;
    meta[normalizeMetaKey(key)] = parseFrontmatterValue(value);
    index += 1;
  }

  return [meta, lines.slice(index).join("\n")];
}

function normalizeMetaKey(key) {
  return key === "layaout" ? "layout" : key;
}

function renderMarkdown(markdown) {
  const lines = markdown.split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const language = escapeHtml(line.slice(3).trim());
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push(`<pre><code class="language-${language}">${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    if (/^#{1,6}\s/.test(line)) {
      const [, hashes, text] = line.match(/^(#{1,6})\s+(.*)$/);
      const level = Math.min(hashes.length, 3);
      blocks.push(`<h${level}>${renderInline(text)}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push(`<blockquote>${renderInline(quote.join(" "))}</blockquote>`);
      continue;
    }

    if (/^\|.*\|$/.test(line) && index + 1 < lines.length && /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(lines[index + 1])) {
      const table = [];
      while (index < lines.length && /^\|.*\|$/.test(lines[index])) {
        table.push(lines[index]);
        index += 1;
      }
      blocks.push(renderTable(table));
      continue;
    }

    if (/^(\s*)[-*+]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items = [];
      const pattern = ordered ? /^\s*\d+\.\s+(.*)$/ : /^\s*[-*+]\s+(.*)$/;
      while (index < lines.length && pattern.test(lines[index])) {
        items.push(lines[index].replace(pattern, "$1"));
        index += 1;
      }
      const tag = ordered ? "ol" : "ul";
      blocks.push(`<${tag}>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</${tag}>`);
      continue;
    }

    const paragraph = [];
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index])) {
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
  }

  return blocks.join("\n");
}

function isBlockStart(line) {
  return /^(```|#{1,6}\s|>\s?|(\s*)[-*+]\s+|\s*\d+\.\s+|\|.*\|$)/.test(line);
}

function renderInline(value) {
  let html = escapeHtml(value);
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return html;
}

function renderTable(rows) {
  const [head, , ...body] = rows;
  const headerCells = splitTableRow(head).map((cell) => `<th>${renderInline(cell)}</th>`).join("");
  const bodyRows = body
    .map((row) => `<tr>${splitTableRow(row).map((cell) => `<td>${renderInline(cell)}</td>`).join("")}</tr>`)
    .join("");
  return `<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
}

function splitTableRow(row) {
  return row.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
}

function applyDeckMeta(meta) {
  state.title = meta.title || "Showtime";
  document.title = state.title;

  if (meta.theme && builtInThemes[meta.theme]) {
    state.theme = meta.theme;
    document.body.dataset.theme = meta.theme === "paper" ? "paper" : "";
  }

  state.transition = getTransition(meta.transition);
  state.transitionDuration = getCssTime(meta.transitionDuration, "700ms");
  state.transitionEasing = getTransitionEasing(meta.transitionEasing, "ease-out");
  state.transitionDelay = getCssTime(meta.transitionDelay, "0ms");

  const tokens = ["background", "surface", "text", "muted", "accent", "fontBody", "fontHeading"];
  for (const token of tokens) {
    if (!meta[token]) continue;
    const cssName = token.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    document.documentElement.style.setProperty(`--${cssName}`, meta[token]);
  }
}

async function loadDeck(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Could not load ${path}`);
  }

  const markdown = await response.text();
  const parsed = parseSlides(markdown);
  state.deck = parsed.slides;
  state.current = Math.min(state.current, Math.max(state.deck.length - 1, 0));
  applyDeckMeta(parsed.meta);
  renderThumbnails();
  renderSlide();
}

function renderSlide() {
  updateSlideSize();

  const slide = state.deck[state.current];
  if (!slide) {
    slideEl.dataset.layout = "center";
    slideEl.dataset.transition = "none";
    slideEl.removeAttribute("data-fit");
    slideEl.removeAttribute("data-background");
    slideEl.style.removeProperty("--slide-background-image");
    slideEl.innerHTML = "<h2>No slides found</h2><p>Add Markdown slides to your deck file.</p>";
    notesEl.innerHTML = "";
    progressEl.value = "0 / 0";
    renderThumbnails();
    return;
  }

  slideEl.dataset.layout = slide.meta.layout || "default";
  slideEl.dataset.fit = getImageFit(slide.meta.fit);
  slideEl.dataset.transition = getTransition(slide.meta.transition || state.transition);
  slideEl.style.setProperty("--transition-duration", getCssTime(slide.meta.transitionDuration, state.transitionDuration));
  slideEl.style.setProperty("--transition-easing", getTransitionEasing(slide.meta.transitionEasing, state.transitionEasing));
  slideEl.style.setProperty("--transition-delay", getCssTime(slide.meta.transitionDelay, state.transitionDelay));
  slideEl.toggleAttribute("data-background", Boolean(slide.meta.background));
  slideEl.style.removeProperty("--slide-background-image");

  if (slide.meta.background) {
    slideEl.style.setProperty("--slide-background-image", formatCssUrl(slide.meta.background));
  }

  slideEl.innerHTML = renderSlideContent(slide);
  animateSlide();
  notesEl.innerHTML = slide.notes || "<p>No speaker notes for this slide.</p>";
  progressEl.value = `${state.current + 1} / ${state.deck.length}`;
  updateThumbnails();
  location.hash = String(state.current + 1);
}

function updateSlideSize() {
  const stageStyles = getComputedStyle(stageEl);
  const horizontalPadding = parseFloat(stageStyles.paddingLeft) + parseFloat(stageStyles.paddingRight);
  const verticalPadding = parseFloat(stageStyles.paddingTop) + parseFloat(stageStyles.paddingBottom);
  const availableWidth = stageEl.clientWidth - horizontalPadding;
  const availableHeight = stageEl.clientHeight - verticalPadding;
  const widthFromHeight = availableHeight * (16 / 9);
  const slideWidth = Math.max(280, Math.min(1180, availableWidth, widthFromHeight));
  const slideScale = Math.max(0.42, Math.min(1, slideWidth / 1180));

  document.documentElement.style.setProperty("--computed-slide-width", `${slideWidth}px`);
  document.documentElement.style.setProperty("--slide-scale", String(slideScale));
}

function renderSlideContent(slide) {
  if (slide.meta.layout === "image" && slide.meta.image) {
    const alt = escapeHtml(String(slide.meta.imageAlt || slide.meta.caption || ""));
    const src = escapeHtml(String(slide.meta.image));
    const caption = slide.meta.caption ? `<figcaption>${renderInline(String(slide.meta.caption))}</figcaption>` : "";
    return `<figure class="image-frame"><img src="${src}" alt="${alt}">${caption}</figure>`;
  }

  return slide.html;
}

function getImageFit(value) {
  return value === "cover" || value === "contain" ? value : "contain";
}

function getTransition(value) {
  const transition = String(value || "fade").toLowerCase();
  return ["fade", "slide", "zoom", "none"].includes(transition) ? transition : "fade";
}

function getCssTime(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;

  const time = String(value).trim();
  if (/^\d+(\.\d+)?m?s$/.test(time)) return time;
  if (/^\d+(\.\d+)?$/.test(time)) return `${time}ms`;
  return fallback;
}

function getTransitionEasing(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;

  const easing = String(value).trim();
  const named = {
    linear: "linear",
    ease: "ease",
    "ease-in": "ease-in",
    "ease-out": "ease-out",
    "ease-in-out": "ease-in-out",
    smooth: "cubic-bezier(0.2, 0.78, 0.2, 1)",
    snappy: "cubic-bezier(0.16, 1, 0.3, 1)",
  };

  if (named[easing]) return named[easing];
  if (/^cubic-bezier\([^)]+\)$/.test(easing)) return easing;
  return fallback;
}

function animateSlide() {
  slideEl.classList.remove("is-entering");

  if (slideEl.dataset.transition === "none") {
    return;
  }

  requestAnimationFrame(() => {
    slideEl.classList.add("is-entering");
  });
}

function formatCssUrl(value) {
  const url = String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  return `url("${url}")`;
}

function renderThumbnails() {
  thumbnailsEl.innerHTML = state.deck
    .map((slide, index) => {
      const label = getSlideLabel(slide, index);
      const style = slide.meta.background
        ? ` style="--slide-background-image: ${formatCssUrl(slide.meta.background)}"`
        : "";
      const background = slide.meta.background ? " data-background" : "";
      return `
        <button class="thumbnail" type="button" data-index="${index}" aria-label="Go to slide ${index + 1}: ${escapeHtml(label)}">
          <span
            class="thumbnail-preview"
            data-layout="${escapeHtml(String(slide.meta.layout || "default"))}"
            data-fit="${escapeHtml(getImageFit(slide.meta.fit))}"
            ${background}${style}
          >
            ${renderSlideContent(slide)}
          </span>
          <span class="thumbnail-label">${index + 1}</span>
        </button>
      `;
    })
    .join("");
  updateThumbnails();
}

function updateThumbnails() {
  for (const thumbnail of thumbnailsEl.querySelectorAll(".thumbnail")) {
    const isCurrent = Number(thumbnail.dataset.index) === state.current;
    thumbnail.classList.toggle("is-current", isCurrent);
    thumbnail.toggleAttribute("aria-current", isCurrent);
  }

  const current = thumbnailsEl.querySelector(".thumbnail.is-current");
  current?.scrollIntoView({ block: "nearest", inline: "center" });
}

function toggleThumbnails() {
  const isVisible = thumbnailsEl.classList.toggle("is-visible");
  thumbsButton.setAttribute("aria-pressed", String(isVisible));
}

function getSlideLabel(slide, index) {
  const firstHeading = slide.html.match(/<h[1-3]>(.*?)<\/h[1-3]>/);
  if (!firstHeading) return `Slide ${index + 1}`;
  return firstHeading[1].replace(/<[^>]+>/g, "").trim() || `Slide ${index + 1}`;
}

function goToSlide(index) {
  state.current = Math.max(0, Math.min(index, state.deck.length - 1));
  renderSlide();
}

function toggleTheme() {
  state.theme = document.body.dataset.theme === "paper" ? "dark" : "paper";
  document.body.dataset.theme = state.theme === "paper" ? "paper" : "";
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
    return;
  }
  document.documentElement.requestFullscreen();
}

function handleKeydown(event) {
  if (event.target === deckInput) return;

  const actions = {
    ArrowRight: () => goToSlide(state.current + 1),
    PageDown: () => goToSlide(state.current + 1),
    " ": () => goToSlide(state.current + 1),
    ArrowLeft: () => goToSlide(state.current - 1),
    PageUp: () => goToSlide(state.current - 1),
    Home: () => goToSlide(0),
    End: () => goToSlide(state.deck.length - 1),
    n: () => notesEl.classList.toggle("is-visible"),
    o: toggleThumbnails,
    t: toggleTheme,
    f: toggleFullscreen,
  };

  const action = actions[event.key];
  if (!action) return;
  event.preventDefault();
  action();
}

previousButton.addEventListener("click", () => goToSlide(state.current - 1));
nextButton.addEventListener("click", () => goToSlide(state.current + 1));
notesButton.addEventListener("click", () => notesEl.classList.toggle("is-visible"));
thumbsButton.addEventListener("click", toggleThumbnails);
themeButton.addEventListener("click", toggleTheme);
fullscreenButton.addEventListener("click", toggleFullscreen);
thumbnailsEl.addEventListener("click", (event) => {
  const thumbnail = event.target.closest(".thumbnail");
  if (!thumbnail) return;
  goToSlide(Number(thumbnail.dataset.index));
});
loadButton.addEventListener("click", () => loadDeck(deckInput.value.trim()).catch(showError));
deckInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    loadDeck(deckInput.value.trim()).catch(showError);
  }
});
document.addEventListener("keydown", handleKeydown);
document.addEventListener("fullscreenchange", () => {
  document.body.classList.toggle("is-presenting", Boolean(document.fullscreenElement));
  updateSlideSize();
});
window.addEventListener("resize", updateSlideSize);

function showError(error) {
  slideEl.dataset.layout = "center";
  slideEl.innerHTML = `<h2>Deck error</h2><p>${escapeHtml(error.message)}</p>`;
}

const initialSlide = Number(location.hash.slice(1));
if (Number.isInteger(initialSlide) && initialSlide > 0) {
  state.current = initialSlide - 1;
}

loadDeck(deckInput.value).catch(showError);
