import { escapeHtml, parseSlides } from "./src/markdown.js";
import { getColumnCount, getImageFit, renderSlideContent } from "./src/slides.js";
import { formatCssUrl, getCssTime, getTransition, getTransitionEasing } from "./src/transitions.js";
import {
  renderThumbnails as renderThumbnailList,
  scrollThumbnails as scrollThumbnailList,
  updateThumbnailScrollButtons,
  updateThumbnails as updateThumbnailList,
} from "./src/thumbnails.js";

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
const thumbnailTrayEl = document.querySelector("#thumbnail-tray");
const thumbnailsEl = document.querySelector("#thumbnails");
const thumbnailsScrollLeftButton = document.querySelector("#thumbs-scroll-left");
const thumbnailsScrollRightButton = document.querySelector("#thumbs-scroll-right");

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

const thumbnailControls = {
  thumbnailsEl,
  thumbnailTrayEl,
  thumbnailsScrollLeftButton,
  thumbnailsScrollRightButton,
};

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
  slideEl.style.setProperty("--columns-count", getColumnCount(slide.meta.columns));
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
  const availableWidth = Math.max(0, stageEl.clientWidth - horizontalPadding);
  const availableHeight = Math.max(0, stageEl.clientHeight - verticalPadding);
  const widthFromHeight = availableHeight * (16 / 9);
  const slideWidth = Math.max(280, Math.min(availableWidth, widthFromHeight));
  const slideHeight = slideWidth * (9 / 16);
  const slideScale = Math.max(0.42, Math.min(2.25, slideWidth / 1180));

  document.documentElement.style.setProperty("--computed-slide-width", `${slideWidth}px`);
  document.documentElement.style.setProperty("--computed-slide-height", `${slideHeight}px`);
  document.documentElement.style.setProperty("--slide-scale", String(slideScale));
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

function renderThumbnails() {
  renderThumbnailList({
    deck: state.deck,
    current: state.current,
    thumbnailsEl,
  });
  updateThumbnailScrollButtons(thumbnailControls);
}

function updateThumbnails() {
  updateThumbnailList({
    current: state.current,
    ...thumbnailControls,
  });
}

function toggleThumbnails() {
  const isVisible = thumbnailTrayEl.classList.toggle("is-visible");
  thumbsButton.setAttribute("aria-pressed", String(isVisible));
  updateThumbnailScrollButtons(thumbnailControls);
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

function showError(error) {
  slideEl.dataset.layout = "center";
  slideEl.innerHTML = `<h2>Deck error</h2><p>${escapeHtml(error.message)}</p>`;
}

previousButton.addEventListener("click", () => goToSlide(state.current - 1));
nextButton.addEventListener("click", () => goToSlide(state.current + 1));
notesButton.addEventListener("click", () => notesEl.classList.toggle("is-visible"));
thumbsButton.addEventListener("click", toggleThumbnails);
thumbnailsScrollLeftButton.addEventListener("click", () => scrollThumbnailList(thumbnailsEl, -1));
thumbnailsScrollRightButton.addEventListener("click", () => scrollThumbnailList(thumbnailsEl, 1));
themeButton.addEventListener("click", toggleTheme);
fullscreenButton.addEventListener("click", toggleFullscreen);
thumbnailsEl.addEventListener("scroll", () => updateThumbnailScrollButtons(thumbnailControls));
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
window.addEventListener("resize", () => {
  updateSlideSize();
  updateThumbnailScrollButtons(thumbnailControls);
});

const initialSlide = Number(location.hash.slice(1));
if (Number.isInteger(initialSlide) && initialSlide > 0) {
  state.current = initialSlide - 1;
}

loadDeck(deckInput.value).catch(showError);
