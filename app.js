const slideEl = document.querySelector("#slide");
const notesEl = document.querySelector("#notes");
const progressEl = document.querySelector("#progress");
const deckInput = document.querySelector("#deck-input");
const loadButton = document.querySelector("#load-deck");
const previousButton = document.querySelector("#prev");
const nextButton = document.querySelector("#next");
const notesButton = document.querySelector("#notes-toggle");
const themeButton = document.querySelector("#theme-toggle");
const fullscreenButton = document.querySelector("#fullscreen");

const state = {
  deck: [],
  current: 0,
  theme: "dark",
  title: "Showtime",
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
    .split(/\n---+\n/g)
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
    meta[key] = parseFrontmatterValue(value);
    index += 1;
  }

  return [meta, lines.slice(index).join("\n")];
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
  renderSlide();
}

function renderSlide() {
  const slide = state.deck[state.current];
  if (!slide) {
    slideEl.dataset.layout = "center";
    slideEl.innerHTML = "<h2>No slides found</h2><p>Add Markdown slides to your deck file.</p>";
    notesEl.innerHTML = "";
    progressEl.value = "0 / 0";
    return;
  }

  slideEl.dataset.layout = slide.meta.layout || "default";
  slideEl.innerHTML = slide.html;
  notesEl.innerHTML = slide.notes || "<p>No speaker notes for this slide.</p>";
  progressEl.value = `${state.current + 1} / ${state.deck.length}`;
  location.hash = String(state.current + 1);
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
themeButton.addEventListener("click", toggleTheme);
fullscreenButton.addEventListener("click", toggleFullscreen);
loadButton.addEventListener("click", () => loadDeck(deckInput.value.trim()).catch(showError));
deckInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    loadDeck(deckInput.value.trim()).catch(showError);
  }
});
document.addEventListener("keydown", handleKeydown);
document.addEventListener("fullscreenchange", () => {
  document.body.classList.toggle("is-presenting", Boolean(document.fullscreenElement));
});

function showError(error) {
  slideEl.dataset.layout = "center";
  slideEl.innerHTML = `<h2>Deck error</h2><p>${escapeHtml(error.message)}</p>`;
}

const initialSlide = Number(location.hash.slice(1));
if (Number.isInteger(initialSlide) && initialSlide > 0) {
  state.current = initialSlide - 1;
}

loadDeck(deckInput.value).catch(showError);
