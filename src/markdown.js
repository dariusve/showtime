export function escapeHtml(value) {
  return String(value)
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

export function parseSlides(markdown) {
  const [deckMeta, body] = parseFrontmatter(markdown);
  const chunks = splitSlides(body)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return {
    meta: deckMeta,
    slides: chunks.map((chunk) => {
      const [meta, content] = parseSlideMeta(chunk);
      const [visible, notes = ""] = splitSpeakerNotes(content);
      return {
        meta,
        html: renderMarkdown(visible.trim()),
        notes: renderMarkdown(notes.trim()),
      };
    }),
  };
}

function splitSlides(markdown) {
  const slides = [];
  const current = [];
  let inCodeBlock = false;

  for (const line of markdown.split("\n")) {
    if (/^\s*```/.test(line)) {
      inCodeBlock = !inCodeBlock;
      current.push(line);
      continue;
    }

    if (!inCodeBlock && /^---+\s*$/.test(line)) {
      slides.push(current.join("\n"));
      current.length = 0;
      continue;
    }

    current.push(line);
  }

  slides.push(current.join("\n"));
  return slides;
}

function splitSpeakerNotes(markdown) {
  const visible = [];
  const notes = [];
  let inCodeBlock = false;
  let inNotes = false;

  for (const line of markdown.split("\n")) {
    if (/^\s*```/.test(line)) {
      inCodeBlock = !inCodeBlock;
    }

    if (!inCodeBlock && line.trim() === "???") {
      inNotes = true;
      continue;
    }

    (inNotes ? notes : visible).push(line);
  }

  return [visible.join("\n"), notes.join("\n")];
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

    if (/^:::\s*[\w -]+$/.test(line)) {
      const className = getBlockClassName(line.replace(/^:::\s*/, ""));
      const content = [];
      index += 1;
      while (index < lines.length && lines[index].trim() !== ":::") {
        content.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push(`<div class="${className}">${renderMarkdown(content.join("\n"))}</div>`);
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

    if (/^\|.*\|$/.test(line)) {
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
    if (paragraph.length > 0) {
      blocks.push(`<p>${renderParagraph(paragraph)}</p>`);
      continue;
    }

    blocks.push(`<p>${renderInline(line.trim())}</p>`);
    index += 1;
  }

  return blocks.join("\n");
}

function renderParagraph(lines) {
  return lines
    .map((line) => {
      const hasHardBreak = /\s{2,}$/.test(line);
      const text = renderInline(line.trim());
      return hasHardBreak ? `${text}<br>` : text;
    })
    .join(" ");
}

function isBlockStart(line) {
  return /^(:::\s*[\w -]+|```|#{1,6}\s|>\s?|(\s*)[-*+]\s+|\s*\d+\.\s+|\|.*\|$)/.test(line);
}

function getBlockClassName(value) {
  const allowed = new Set(["small", "medium", "large", "muted", "compact"]);
  const classes = value
    .split(/\s+/)
    .map((item) => item.trim().toLowerCase())
    .filter((item) => allowed.has(item))
    .map((item) => `text-${item}`);

  return ["text-block", ...classes].join(" ");
}

export function renderInline(value) {
  let html = escapeHtml(value);
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return html;
}

function renderTable(rows) {
  const hasHeader = rows.length > 1 && isTableSeparator(rows[1]);
  const startsWithSeparator = isTableSeparator(rows[0]);
  const head = hasHeader ? rows[0] : "";
  const body = hasHeader ? rows.slice(2) : rows.slice(startsWithSeparator ? 1 : 0);
  const columnCount = Math.max(...rows.map((row) => splitTableRow(row).length), 1);
  const headerCells = (head ? splitTableRow(head) : Array.from({ length: columnCount }, () => ""))
    .map((cell) => `<th>${renderInline(cell)}</th>`)
    .join("");
  const bodyRows = body
    .map((row) => `<tr>${splitTableRow(row).map((cell) => `<td>${renderInline(cell)}</td>`).join("")}</tr>`)
    .join("");
  return `<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
}

function isTableSeparator(row) {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(row);
}

function splitTableRow(row) {
  return row.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
}
