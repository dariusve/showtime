import { fetchDeckMarkdown } from "./src/decks.js";
import { escapeHtml, parseSlides } from "./src/markdown.js";
import { getDom } from "./src/dom.js";
import { getColumnCount, getImageFit, renderSlideContent } from "./src/slides.js";
import { formatCssUrl, getCssTime, getTransition, getTransitionEasing } from "./src/transitions.js";
import { applyDeckMeta, toggleTheme as toggleDocumentTheme } from "./src/theme.js";
import {
  renderThumbnails as renderThumbnailList,
  scrollThumbnails as scrollThumbnailList,
  updateThumbnailScrollButtons,
  updateThumbnails as updateThumbnailList,
} from "./src/thumbnails.js";

const {
  slideEl,
  stageEl,
  notesEl,
  progressEl,
  deckInput,
  loadButton,
  previousButton,
  nextButton,
  notesButton,
  thumbsButton,
  themeButton,
  fullscreenButton,
  thumbnailTrayEl,
  thumbnailsEl,
  thumbnailsScrollLeftButton,
  thumbnailsScrollRightButton,
} = getDom();

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

const thumbnailControls = {
  thumbnailsEl,
  thumbnailTrayEl,
  thumbnailsScrollLeftButton,
  thumbnailsScrollRightButton,
};

const SLIDE_DESIGN_WIDTH = 1180;
const LOW_RES_SLIDE_SCALE_FACTOR = 0.9025;
const MIN_LOW_RES_SLIDE_SCALE = 0.42 * LOW_RES_SLIDE_SCALE_FACTOR;

async function loadDeck(path) {
  const markdown = await fetchDeckMarkdown(path, import.meta.url);
  const parsed = parseSlides(markdown);
  state.deck = parsed.slides;
  state.current = Math.min(state.current, Math.max(state.deck.length - 1, 0));
  applyDeckMeta(parsed.meta, state);
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
  const baseSlideScale = slideWidth / SLIDE_DESIGN_WIDTH;
  const scaledSlideScale = baseSlideScale < 1 ? baseSlideScale * LOW_RES_SLIDE_SCALE_FACTOR : baseSlideScale;
  const slideScale = Math.max(MIN_LOW_RES_SLIDE_SCALE, Math.min(2.25, scaledSlideScale));

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
  toggleDocumentTheme(state);
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
