import { escapeHtml, renderInline } from "./markdown.js";

export function renderSlideContent(slide) {
  if (slide.meta.layout === "image" && slide.meta.image) {
    const alt = escapeHtml(String(slide.meta.imageAlt || slide.meta.caption || ""));
    const src = escapeHtml(String(slide.meta.image));
    const caption = slide.meta.caption ? `<figcaption>${renderInline(String(slide.meta.caption))}</figcaption>` : "";
    return `<figure class="image-frame"><img src="${src}" alt="${alt}">${caption}</figure>`;
  }

  if (slide.meta.layout === "columns") {
    return renderColumnsSlide(slide);
  }

  if (slide.meta.layout === "compare") {
    return renderCompareSlide(slide);
  }

  return slide.html;
}

function renderColumnsSlide(slide) {
  const match = slide.html.match(/^(<h[1-3]>.*?<\/h[1-3]>)([\s\S]*)$/);
  if (!match) {
    return `<div class="columns-content">${slide.html}</div>`;
  }

  const [, heading, content] = match;
  const subtitleMatch = content.trim().match(/^(<p>.*?<\/p>)([\s\S]*)$/);
  if (!subtitleMatch) {
    return `${heading}${renderColumnContent(content.trim())}`;
  }

  const [, subtitle, columns] = subtitleMatch;
  return `${heading}<div class="slide-subtitle">${subtitle}</div>${renderColumnContent(columns.trim())}`;
}

function renderColumnContent(content) {
  const groups = [];
  const pattern = /<h3>(.*?)<\/h3>\s*([\s\S]*?)(?=<h3>|$)/g;
  let groupMatch;

  while ((groupMatch = pattern.exec(content)) !== null) {
    groups.push(`<section class="column-group"><h3>${groupMatch[1]}</h3>${groupMatch[2].trim()}</section>`);
  }

  if (groups.length === 0) {
    return `<div class="columns-content">${content}</div>`;
  }

  return `<div class="columns-content columns-groups">${groups.join("")}</div>`;
}

function renderCompareSlide(slide) {
  const match = slide.html.match(/^(<h[1-3]>.*?<\/h[1-3]>)([\s\S]*)$/);
  if (!match) {
    return `<div class="compare-content">${slide.html}</div>`;
  }

  const [, heading, content] = match;
  const groups = [];
  const pattern = /<p><strong>(.*?)<\/strong><\/p>\s*(<ul>[\s\S]*?<\/ul>|<ol>[\s\S]*?<\/ol>)/g;
  let lastIndex = 0;
  let groupMatch;

  while ((groupMatch = pattern.exec(content)) !== null) {
    lastIndex = pattern.lastIndex;
    groups.push(`<section class="compare-group"><h3>${groupMatch[1]}</h3>${groupMatch[2]}</section>`);
  }

  const leftover = content.slice(lastIndex).trim();
  if (groups.length === 0) {
    return `${heading}<div class="compare-content">${content.trim()}</div>`;
  }

  return `${heading}<div class="compare-content">${groups.join("")}${leftover}</div>`;
}

export function getSlideLabel(slide, index) {
  const firstHeading = slide.html.match(/<h[1-3]>(.*?)<\/h[1-3]>/);
  if (!firstHeading) return `Slide ${index + 1}`;
  return firstHeading[1].replace(/<[^>]+>/g, "").trim() || `Slide ${index + 1}`;
}

export function getColumnCount(value) {
  const count = Number(value || 2);
  return String(Math.max(2, Math.min(count, 4)));
}

export function getImageFit(value) {
  return value === "cover" || value === "contain" ? value : "contain";
}
